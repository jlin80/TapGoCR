"use server";

import { appendFileSync } from "node:fs";
import { join } from "node:path";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import type { Prisma, Registration } from "@/generated/prisma/client";
import {
  BusinessRole,
  LinkType,
  RegistrationStatus,
  UserRole,
} from "@/generated/prisma/enums";
import type { ActionState } from "@/lib/action-state";
import { requireRoot } from "@/lib/authz";
import { nextClientCode } from "@/lib/client-code";
import { emitNewClient } from "@/lib/notifications/dispatch";
import { prisma } from "@/lib/prisma";
import { limitPublicSubmission } from "@/lib/public-rate-limit";
import { extractClientIp, hashIp } from "@/lib/request-info";
import { businessNameTaken, clientNameTaken, isUniqueConstraintOn } from "@/lib/uniqueness";
import {
  firstIssue,
  formValues,
  registrationReviewSchema,
  registrationSchema,
} from "@/lib/validation";

const BCRYPT_ROUNDS = 12;
const REGISTRATION_LIMIT = Number(process.env.REGISTRATION_RATE_LIMIT ?? 3);
const REGISTRATION_WINDOW_MS = 60 * 60 * 1000;

/**
 * Alta pedida desde el sitio público.
 *
 * El registro es automático: apenas se guarda la solicitud se aprueba sola
 * (misma lógica que usaba `approveRegistration` para el alta manual de ROOT,
 * factorizada en `finalizeRegistration`). La cuenta queda utilizable de
 * inmediato con el correo y la contraseña que la persona eligió acá. Los
 * controles anti-abuso (rate limit, campo trampa, nombres duplicados) siguen
 * aplicando exactamente igual que antes: lo que se quitó es la espera por un
 * humano, no la validación.
 */
export async function submitRegistration(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = registrationSchema.safeParse(formValues(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  // Campo trampa: una persona nunca lo completa porque está oculto.
  if (parsed.data.website) {
    return { success: "Recibimos tu solicitud." };
  }

  const requestHeaders = await headers();
  const ipHash = hashIp(extractClientIp(requestHeaders));

  const limit = limitPublicSubmission({
    kind: "registration",
    headers: requestHeaders,
    limit: REGISTRATION_LIMIT,
    windowMs: REGISTRATION_WINDOW_MS,
  });

  if (!limit.allowed) {
    return {
      error: "Recibimos varias solicitudes desde esta conexión. Probá más tarde.",
    };
  }

  const { email, password } = parsed.data;

  // El correo no puede repetirse ni entre solicitudes ni entre cuentas ya
  // creadas. Se responde igual en ambos casos para no revelar quién es cliente.
  const [existingUser, existingRegistration] = await Promise.all([
    prisma.user.findUnique({ where: { email }, select: { id: true } }),
    prisma.registration.findUnique({ where: { email }, select: { status: true } }),
  ]);

  if (existingUser || existingRegistration) {
    return {
      error:
        "Ese correo ya está registrado. Si ya sos cliente, ingresá desde el botón de la esquina.",
    };
  }

  const fullName = `${parsed.data.firstName} ${parsed.data.lastName}`;
  if (await businessNameTaken(parsed.data.businessName)) {
    return { error: "Ya hay un negocio registrado con ese nombre. Contactanos si es un error." };
  }
  if (await clientNameTaken(fullName)) {
    return { error: "Ya hay una cuenta registrada con ese nombre. Contactanos si es un error." };
  }

  const registration = await prisma.registration.create({
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email,
      phone: parsed.data.phone,
      passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
      businessName: parsed.data.businessName,
      industry: parsed.data.industry,
      legalId: parsed.data.legalId,
      address: parsed.data.address,
      province: parsed.data.province,
      canton: parsed.data.canton,
      postalCode: parsed.data.postalCode,
      notes: parsed.data.notes,
      whatsapp: parsed.data.whatsapp,
      instagramUrl: parsed.data.instagramUrl,
      facebookUrl: parsed.data.facebookUrl,
      googleReviewsUrl: parsed.data.googleReviewsUrl,
      menuUrl: parsed.data.menuUrl,
      ipHash,
    },
  });

  const result = await finalizeRegistration(registration, "AUTO");

  revalidatePath("/app/registrations");
  revalidatePath("/app/dashboard");

  if ("error" in result) {
    // La solicitud ya quedó guardada; ROOT puede resolverla a mano desde el
    // panel si el alta automática chocó con algo (nombre duplicado, código
    // de cliente repetido). No se le devuelve el detalle técnico a quien se
    // registra, para no revelar si el conflicto es por nombre o negocio.
    return {
      success:
        "Recibimos tu solicitud. Te contactamos para terminar de habilitar tu acceso.",
    };
  }

  return {
    success: `¡Listo! Tu cliente es ${result.clientCode}. Ya podés ingresar con ${email} y la contraseña que elegiste.`,
  };
}

/**
 * Cuántas veces se reintenta la transacción completa cuando `clientCode` o
 * `slug` chocan con uno que otra alta concurrente insertó primero. Cada
 * reintento vuelve a calcular ambos valores contra el estado más reciente de
 * la base, así que un choque real (dos altas al mismo tiempo, no un nombre
 * duplicado) se resuelve solo en el segundo o tercer intento. 5 es más que de
 * sobra: con eso muchas altas tendrían que caer exactamente en el mismo
 * instante para agotarlo.
 */
const MAX_CODE_COLLISION_RETRIES = 5;

/**
 * Registra un fallo inesperado con el detalle real (paso, código/mensaje de
 * Prisma o MariaDB), nunca passwords ni hashes. El stdout de Passenger en
 * este hosting no queda en ningún archivo legible, así que además de
 * `console.error` se escribe una copia en un archivo plano dentro del
 * proyecto: es lo único que permite diagnosticar sin adivinar.
 */
function logRegistrationFailure(context: {
  registration: Registration;
  reviewedBy: "AUTO" | "ROOT";
  step: string;
  attempt: number;
  error: unknown;
}): void {
  const { registration, reviewedBy, step, attempt, error } = context;
  const prismaCode =
    error && typeof error === "object" && "code" in error
      ? String((error as { code: unknown }).code)
      : undefined;
  const prismaMeta =
    error && typeof error === "object" && "meta" in error
      ? (error as { meta: unknown }).meta
      : undefined;

  const debugEntry = {
    at: new Date().toISOString(),
    registrationId: registration.id,
    email: registration.email,
    businessName: registration.businessName,
    reviewedBy,
    step,
    attempt,
    errorCode: prismaCode,
    errorMeta: prismaMeta,
    errorMessage: error instanceof Error ? error.message : String(error),
    errorStack: error instanceof Error ? error.stack : undefined,
  };

  console.error("[registration-approve] fallo en finalizeRegistration", debugEntry);

  try {
    appendFileSync(
      join(process.cwd(), "tmp", "registration-debug.log"),
      JSON.stringify(debugEntry) + "\n",
    );
  } catch {
    // Si ni siquiera se puede escribir el log de diagnóstico, no vale la
    // pena que la aprobación falle por eso.
  }
}

/**
 * Núcleo compartido de la creación de cuenta: User + Business + BusinessUser
 * OWNER + enlaces iniciales + Registration APPROVED, en una sola transacción
 * atómica. Lo usan tanto el alta automática de `submitRegistration` como la
 * aprobación manual de `approveRegistration` (que sigue existiendo solo como
 * mecanismo de recuperación para los casos excepcionales que el alta
 * automática no pudo resolver sola — el correo ya existe, o los reintentos de
 * `clientCode`/`slug` se agotaron).
 *
 * No depende de ningún lock de aplicación (antes usaba `GET_LOCK` de MySQL):
 * la garantía contra dos altas concurrentes con el mismo nombre la da el
 * índice único de `User.name`/`Business.name` en la base (ver
 * `uniqueness.ts`), no una sesión que puede quedar huérfana y bloquear el
 * nombre para siempre. `clientCode` y `slug` se calculan DENTRO de la
 * transacción y, si otra alta concurrente ya tomó el valor calculado
 * (P2002), se reintenta la transacción completa con el siguiente candidato
 * — ver `MAX_CODE_COLLISION_RETRIES`.
 *
 * Si algo falla a mitad no queda un usuario sin negocio ni un negocio sin
 * dueño: todo vive en el mismo `$transaction`.
 */
async function finalizeRegistration(
  registration: Registration,
  reviewedBy: "AUTO" | "ROOT",
): Promise<{ clientCode: string } | { error: string }> {
  if (registration.status !== RegistrationStatus.PENDING) {
    return { error: "Esta solicitud ya fue resuelta." };
  }

  const taken = await prisma.user.findUnique({
    where: { email: registration.email },
    select: { id: true },
  });

  if (taken) {
    return {
      error: `Ya existe una cuenta con ${registration.email}. Rechazá la solicitud o cambiá el correo.`,
    };
  }

  const fullName = `${registration.firstName} ${registration.lastName}`;

  // Comprobación amigable ANTES de intentar: le ahorra a la mayoría de los
  // casos reales (nombre duplicado de verdad) el viaje completo a la base.
  // No es la garantía de concurrencia — esa la da el índice único — así que
  // no hace falta repetirla dentro de la transacción.
  if (await businessNameTaken(registration.businessName, undefined, registration.id)) {
    return {
      error: "Ya existe un negocio con ese nombre. Revisá si es un duplicado antes de aprobar.",
    };
  }
  if (await clientNameTaken(fullName, undefined, registration.id)) {
    return {
      error: "Ya existe una cuenta con ese nombre. Revisá si es un duplicado antes de aprobar.",
    };
  }

  let step = "start";

  for (let attempt = 1; attempt <= MAX_CODE_COLLISION_RETRIES; attempt++) {
    try {
      const result = await prisma.$transaction(
        async (tx) => {
          step = "compute-slug";
          const slug = await availableSlug(registration.businessName, tx);
          step = "compute-client-code";
          const clientCode = await nextClientCode(tx);

          step = "create-user";
          const user = await tx.user.create({
            data: {
              email: registration.email,
              clientCode,
              name: fullName.trim(),
              role: UserRole.CLIENT,
              // Se reutiliza el hash que la persona eligió al registrarse.
              passwordHash: registration.passwordHash,
            },
            select: { id: true },
          });

          step = "create-business";
          const business = await tx.business.create({
            data: {
              name: registration.businessName,
              slug,
              industry: registration.industry,
              legalId: registration.legalId,
              phone: registration.phone,
              whatsapp: registration.whatsapp,
              address: [registration.address, registration.canton, registration.province]
                .filter(Boolean)
                .join(", "),
              ownerId: user.id,
              members: { create: { userId: user.id, role: BusinessRole.OWNER } },
            },
            select: { id: true },
          });

          // Cada enlace que la persona ya tenía a mano al registrarse se
          // publica de una vez: así el negocio no estrena la placa con la
          // landing vacía. Van en el mismo orden en que aparecen en el
          // formulario, para que la landing quede como se la mostró la
          // vista previa del registro.
          type EnlaceInicial = { type: LinkType; label: string; url: string };

          const enlacesIniciales: EnlaceInicial[] = [];
          if (registration.menuUrl) {
            enlacesIniciales.push({
              type: LinkType.MENU,
              label: "Ver menú",
              url: registration.menuUrl,
            });
          }
          if (registration.instagramUrl) {
            enlacesIniciales.push({
              type: LinkType.INSTAGRAM,
              label: "Instagram",
              url: registration.instagramUrl,
            });
          }
          if (registration.facebookUrl) {
            enlacesIniciales.push({
              type: LinkType.FACEBOOK,
              label: "Facebook",
              url: registration.facebookUrl,
            });
          }
          if (registration.googleReviewsUrl) {
            enlacesIniciales.push({
              type: LinkType.GOOGLE_REVIEWS,
              label: "Dejanos tu reseña",
              url: registration.googleReviewsUrl,
            });
          }

          if (enlacesIniciales.length > 0) {
            step = "create-initial-links";
            await tx.businessLink.createMany({
              data: enlacesIniciales.map((link, position) => ({
                ...link,
                businessId: business.id,
                position,
              })),
            });
          }

          step = "update-registration";
          await tx.registration.update({
            where: { id: registration.id },
            data: {
              status: RegistrationStatus.APPROVED,
              reviewedAt: new Date(),
              reviewNotes:
                reviewedBy === "AUTO" ? "Aprobado automáticamente al registrarse." : undefined,
              createdUserId: user.id,
              createdBusinessId: business.id,
            },
          });

          return { userId: user.id, businessId: business.id, clientCode };
        },
        // Sin GET_LOCK de por medio no hace falta el margen de 20s que tenía
        // antes: el trabajo real (unas pocas filas) entra sobrado en el
        // timeout por defecto de Prisma, pero se deja explícito para no
        // depender de que ese default no cambie.
        { maxWait: 10_000, timeout: 15_000 },
      );

      // Recién después de que la transacción confirmó todo: si Discord
      // falla, la cuenta igual quedó creada y utilizable.
      void emitNewClient({
        eventId: `registration-approved:${registration.id}`,
        userId: result.userId,
        userName: fullName,
        userEmail: registration.email,
        businessId: result.businessId,
        businessName: registration.businessName,
        clientCode: result.clientCode,
        source: reviewedBy,
      });

      return { clientCode: result.clientCode };
    } catch (error) {
      if (isUniqueConstraintOn(error, "email")) {
        return {
          error: `Ya existe una cuenta con ${registration.email}. Rechazá la solicitud o cambiá el correo.`,
        };
      }
      if (isUniqueConstraintOn(error, "Business_name_key")) {
        return {
          error: "Ya existe un negocio con ese nombre. Revisá si es un duplicado antes de aprobar.",
        };
      }
      if (isUniqueConstraintOn(error, "User_name_key")) {
        return {
          error: "Ya existe una cuenta con ese nombre. Revisá si es un duplicado antes de aprobar.",
        };
      }
      if (isUniqueConstraintOn(error, "clientCode", "slug")) {
        // Otra alta concurrente tomó el código o el slug calculado entre el
        // cálculo y el insert: no es un error real, es la carrera que este
        // reintento existe para resolver. Se reintenta con el siguiente
        // candidato en vez de fallarle a quien se está registrando.
        if (attempt < MAX_CODE_COLLISION_RETRIES) continue;

        logRegistrationFailure({ registration, reviewedBy, step, attempt, error });
        return {
          error:
            "No se pudo completar el alta por demasiadas altas al mismo tiempo. Volvé a intentarlo.",
        };
      }

      // Cualquier otro error es inesperado: se registra con el detalle real
      // (nunca oculto detrás de un mensaje genérico sin dejar rastro) y no
      // se reintenta, porque reintentar un error desconocido no tiene por
      // qué resolverlo.
      logRegistrationFailure({ registration, reviewedBy, step, attempt, error });
      return { error: "No se pudo completar el alta. Volvé a intentarlo." };
    }
  }

  // Inalcanzable: el bucle siempre retorna dentro del try/catch. Está acá
  // solo para que TypeScript vea una función total.
  return { error: "No se pudo completar el alta. Volvé a intentarlo." };
}

/**
 * Aprueba a mano una solicitud que el alta automática no pudo resolver sola
 * (nombre duplicado, colisión de código de cliente, etc.).
 */
export async function approveRegistration(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRoot();

  const registrationId = String(formData.get("registrationId") ?? "");
  if (!registrationId) return { error: "Falta la solicitud." };

  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
  });

  if (!registration) return { error: "La solicitud no existe." };

  const result = await finalizeRegistration(registration, "ROOT");
  if ("error" in result) return { error: result.error };

  revalidatePath("/app/registrations");
  revalidatePath("/app/clients");
  revalidatePath("/app/users");
  revalidatePath("/app/dashboard");

  return {
    success: `Cliente ${result.clientCode} creado. Ya puede ingresar con ${registration.email} y la contraseña que eligió.`,
  };
}

/** Rechaza una solicitud, opcionalmente con un motivo interno. */
export async function rejectRegistration(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRoot();

  const parsed = registrationReviewSchema.safeParse(formValues(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const registration = await prisma.registration.findUnique({
    where: { id: parsed.data.registrationId },
    select: { status: true },
  });

  if (!registration) return { error: "La solicitud no existe." };
  if (registration.status === RegistrationStatus.APPROVED) {
    return { error: "Esta solicitud ya fue aprobada y creó una cuenta." };
  }

  await prisma.registration.update({
    where: { id: parsed.data.registrationId },
    data: {
      status: RegistrationStatus.REJECTED,
      reviewNotes: parsed.data.reviewNotes,
      reviewedAt: new Date(),
    },
  });

  revalidatePath("/app/registrations");
  revalidatePath("/app/dashboard");

  return { success: "Solicitud rechazada." };
}

/**
 * Elimina una solicitud ya resuelta.
 *
 * Las aprobadas no se borran: son el documento de origen de una cuenta activa.
 */
export async function deleteRegistration(formData: FormData): Promise<void> {
  await requireRoot();

  const registrationId = String(formData.get("registrationId") ?? "");
  if (!registrationId) return;

  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    select: { status: true },
  });

  if (!registration || registration.status === RegistrationStatus.APPROVED) return;

  await prisma.registration.delete({ where: { id: registrationId } });
  revalidatePath("/app/registrations");
}

/**
 * Deriva un identificador legible del nombre y lo hace único.
 *
 * Recibe el `tx` de la transacción activa: igual que `nextClientCode`, así
 * ve el estado más reciente de la base sin abrir una conexión aparte
 * mientras la transacción está abierta. La garantía final contra dos altas
 * concurrentes calculando el mismo slug la da el índice único de
 * `Business.slug` — este bucle solo reduce cuánto tiene que reintentar
 * `finalizeRegistration` cuando eso pasa.
 */
async function availableSlug(
  businessName: string,
  db: typeof prisma | Prisma.TransactionClient = prisma,
): Promise<string> {
  const base =
    businessName
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "negocio";

  for (let attempt = 0; attempt < 50; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const taken = await db.business.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!taken) return candidate;
  }

  return `${base}-${Date.now()}`;
}
