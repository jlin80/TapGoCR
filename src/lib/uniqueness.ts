import { RegistrationStatus } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Nombres duplicados generan confusión real: dos negocios "Café Central" o dos
 * clientes "María Rodríguez" hacen que ROOT no sepa a cuál se refiere un
 * reporte o un ticket. Se compara sin distinguir mayúsculas ni acentos porque
 * "Café Central", "CAFÉ CENTRAL" y "Cafe Central" son, a estos efectos, el
 * mismo choque.
 *
 * La comparación se hace en JS (no con `mode: "insensitive"` de Prisma, que en
 * Postgres solo pliega mayúsculas/minúsculas, nunca acentos) trayendo el
 * conjunto completo de nombres candidatos. El volumen de negocios/clientes de
 * un SaaS de este tamaño no justifica una extensión `unaccent` en Postgres
 * solo para esto.
 *
 * Cuenta tanto los negocios/clientes ya creados como las solicitudes
 * PENDIENTES: una solicitud rechazada no reserva el nombre, pero una pendiente
 * sí, porque puede aprobarse en cualquier momento.
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

/** Se lanza dentro de {@link withNameLock} cuando el nombre ya está en uso. */
export class NameConflictError extends Error {}

/**
 * Reduce el nombre normalizado a un entero de 32 bits, igual que hacía
 * `hashtext` de Postgres: el lock es por ese hash, no por el nombre en sí, así
 * que en teoría dos nombres distintos podrían colisionar en el mismo lock — a
 * costo de una espera ocasional e inofensiva, nunca de un falso "nombre
 * libre".
 */
function hashName(normalized: string): string {
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (Math.imul(31, hash) + normalized.charCodeAt(i)) | 0;
  }
  return `tapgocr_name:${hash}`;
}

/**
 * Serializa el patrón "verificar que el nombre esté libre, luego crear" contra
 * la propia base de datos, con `GET_LOCK`/`RELEASE_LOCK` de MySQL, para que
 * dos altas concurrentes con el mismo nombre no puedan colarse ambas: sin
 * esto, `businessNameTaken` y el `create` posterior son dos pasos separados, y
 * nada impide que dos solicitudes lean "libre" al mismo tiempo antes de que
 * cualquiera cree su fila.
 *
 * A diferencia de `pg_advisory_xact_lock` de Postgres (que libera solo al
 * hacer commit/rollback), `GET_LOCK` tiene ámbito de sesión, no de
 * transacción: hay que liberarlo explícitamente en un `finally`. Dentro de un
 * `$transaction` interactivo, todas las consultas de `tx` corren sobre la
 * misma conexión, así que el lock y su liberación quedan en la misma sesión.
 */
export async function withNameLock<T>(
  name: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  const normalized = normalizeName(name);
  const lockName = hashName(normalized);
  return prisma.$transaction(async (tx) => {
    const [{ acquired }] = await tx.$queryRaw<[{ acquired: number }]>`
      SELECT GET_LOCK(${lockName}, 10) AS acquired
    `;
    if (acquired !== 1) {
      throw new Error(`No se pudo obtener el lock de nombre "${lockName}" a tiempo`);
    }
    try {
      return await fn(tx);
    } finally {
      await tx.$executeRaw`SELECT RELEASE_LOCK(${lockName})`;
    }
  });
}
