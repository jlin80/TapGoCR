import { RegistrationStatus } from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Nombres duplicados generan confusión real: dos negocios "Café Central" o dos
 * clientes "María Rodríguez" hacen que ROOT no sepa a cuál se refiere un
 * reporte o un ticket. Se compara sin distinguir mayúsculas ni acentos porque
 * "Café Central", "CAFÉ CENTRAL" y "Cafe Central" son, a estos efectos, el
 * mismo choque.
 *
 * Estas dos funciones son solo una comprobación amigable ANTES de intentar
 * crear: le devuelven a quien se registra o a ROOT un mensaje claro sin tener
 * que esperar a que la base rechace el insert. La garantía real contra dos
 * altas concurrentes con el mismo nombre es el índice único de
 * `User.name`/`Business.name` (ver migración `20260918180000_unique_names`):
 * la collation por defecto de la base (utf8mb4_unicode_ci) ya es insensible a
 * mayúsculas y acentos, así que el índice por sí solo hace cumplir esta misma
 * regla sin depender de un lock de aplicación. `isUniqueConstraintOn` más
 * abajo es lo que traduce esa violación en un mensaje igual de claro cuando
 * esta comprobación previa no alcanzó a detectar la carrera.
 *
 * También cuenta las solicitudes PENDIENTES: una solicitud rechazada no
 * reserva el nombre, pero una pendiente sí, porque puede aprobarse en
 * cualquier momento (típicamente por el mecanismo de recuperación manual,
 * `approveRegistration`).
 */

type Db = typeof prisma | Prisma.TransactionClient;

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export async function businessNameTaken(
  name: string,
  excludeBusinessId?: string,
  excludeRegistrationId?: string,
  db: Db = prisma,
): Promise<boolean> {
  const normalized = normalizeName(name);
  if (!normalized) return false;

  const [businesses, registrations] = await Promise.all([
    db.business.findMany({
      where: excludeBusinessId ? { id: { not: excludeBusinessId } } : {},
      select: { name: true },
    }),
    db.registration.findMany({
      where: {
        status: RegistrationStatus.PENDING,
        ...(excludeRegistrationId ? { id: { not: excludeRegistrationId } } : {}),
      },
      select: { businessName: true },
    }),
  ]);

  return (
    businesses.some((business) => normalizeName(business.name) === normalized) ||
    registrations.some((registration) => normalizeName(registration.businessName) === normalized)
  );
}

export async function clientNameTaken(
  fullName: string,
  excludeUserId?: string,
  excludeRegistrationId?: string,
  db: Db = prisma,
): Promise<boolean> {
  const normalized = normalizeName(fullName);
  if (!normalized) return false;

  const [users, pendingRegistrations] = await Promise.all([
    db.user.findMany({
      where: excludeUserId ? { id: { not: excludeUserId } } : {},
      select: { name: true },
    }),
    db.registration.findMany({
      where: {
        status: RegistrationStatus.PENDING,
        ...(excludeRegistrationId ? { id: { not: excludeRegistrationId } } : {}),
      },
      select: { firstName: true, lastName: true },
    }),
  ]);

  if (users.some((user) => normalizeName(user.name) === normalized)) return true;

  return pendingRegistrations.some(
    (registration) => normalizeName(`${registration.firstName} ${registration.lastName}`) === normalized,
  );
}

/**
 * Interpreta el error P2002 ("Unique constraint failed") de Prisma y dice
 * si afecta a alguno de los campos/índices dados.
 *
 * En otros conectores `error.meta.target` trae el nombre de columna, pero el
 * adaptador `@prisma/adapter-mariadb` que usa este proyecto NO llena
 * `target`: el nombre del índice viola do viene anidado en
 * `error.meta.driverAdapterError.cause.constraint.index` (confirmado
 * disparando un P2002 real contra la base de dev — la forma no está
 * documentada). Se revisan ambos lugares, con `target` como respaldo por si
 * el conector cambia de comportamiento en una actualización futura. Sirve
 * para decidir, tras un fallo de `create`, si hay que reintentar con otro
 * valor calculado (`clientCode`/`slug`) o si es un choque real de datos que
 * hay que devolverle a quien aprueba.
 */
export function isUniqueConstraintOn(error: unknown, ...fields: string[]): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (error.code !== "P2002") return false;

  const targets: string[] = [];

  const target = error.meta?.target;
  if (Array.isArray(target)) targets.push(...target.map(String));
  else if (target != null) targets.push(String(target));

  const driverIndex = (
    error.meta?.driverAdapterError as
      | { cause?: { constraint?: { index?: string } } }
      | undefined
  )?.cause?.constraint?.index;
  if (driverIndex) targets.push(driverIndex);

  return fields.some((field) =>
    targets.some((t) => t.toLowerCase().includes(field.toLowerCase())),
  );
}
