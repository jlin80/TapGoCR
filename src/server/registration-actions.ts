"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import type { Registration } from "@/generated/prisma/client";
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
import { businessNameTaken, clientNameTaken, NameConflictError, withNameLock } from "@/lib/uniqueness";
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
 * Núcleo compartido de la creación de cuenta: User + Business + enlaces
 * iniciales, en una sola transacción. Lo usan tanto el alta automática de
 * `submitRegistration` como la aprobación manual de `approveRegistration`
 * (que sigue existiendo para resolver a mano los casos que el alta
 * automática no pudo completar — nombre duplicado, colisión de código).
 *
 * Si algo falla a mitad no queda un usuario sin negocio ni un negocio sin
 * dueño.
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

  const slug = await availableSlug(registration.businessName);
  const clientCode = await nextClientCode();

  // Se llenan dentro de la transacción; se leen después para notificar a
  // Discord solo si todo se guardó bien.
  let createdUserId = "";
  let createdBusinessId = "";
  // Diagnóstico temporal: para saber en qué paso concreto falló sin tener
  // que adivinar. Nunca contiene contraseñas ni hashes.
  let step = "start";

  try {
    step = "acquire-lock";
    await withNameLock(registration.businessName, async (tx) => {
      step = "recheck-name-conflict";
      // Re-verificado dentro del lock: dos altas concurrentes con el mismo
      // nombre ya no pueden leer ambas "libre" antes de que cualquiera cree
      // su fila.
      if (await businessNameTaken(registration.businessName, undefined, registration.id, tx)) {
        throw new NameConflictError(
          "Ya existe un negocio con ese nombre. Revisá si es un duplicado antes de aprobar.",
        );
      }
      if (await clientNameTaken(fullName, undefined, registration.id, tx)) {
        throw new NameConflictError(
          "Ya existe una cuenta con ese nombre. Revisá si es un duplicado antes de aprobar.",
        );
      }

      step = "create-user";
      const user = await tx.user.create({
        data: {
          email: registration.email,
          clientCode,
          name: `${registration.firstName} ${registration.lastName}`.trim(),
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

      // Cada enlace que la persona ya tenía a mano al registrarse se publica
      // de una vez: así el negocio no estrena la placa con la landing vacía.
      // Van en el mismo orden en que aparecen en el formulario, para que la
      // landing quede como se la mostró la vista previa del registro.
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

      createdUserId = user.id;
      createdBusinessId = business.id;
    });
  } catch (error) {
    if (error instanceof NameConflictError) return { error: error.message };

    // Diagnóstico temporal: nunca se loguea passwordHash ni ningún secreto,
    // solo identificadores y el error real (código/mensaje de Prisma o de
    // MariaDB) para saber qué paso falló en producción en vez de adivinar.
    const prismaCode =
      error && typeof error === "object" && "code" in error
        ? String((error as { code: unknown }).code)
        : undefined;
    const prismaMeta =
      error && typeof error === "object" && "meta" in error
        ? (error as { meta: unknown }).meta
        : undefined;

    console.error("[registration-approve] fallo en finalizeRegistration", {
      registrationId: registration.id,
      email: registration.email,
      businessName: registration.businessName,
      reviewedBy,
      step,
      clientCode,
      slug,
      errorCode: prismaCode,
      errorMeta: prismaMeta,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    });

    if (prismaCode === "P2002") {
      // Unique constraint: casi seguro clientCode o slug calculados antes del
      // lock, que otra alta ya tomó entre el cálculo y el insert.
      return {
        error:
          "No se pudo completar el alta: el código de cliente o el identificador del negocio ya estaban en uso. Volvé a intentarlo.",
      };
    }

    return { error: "No se pudo completar el alta. Volvé a intentarlo." };
  }

  // Recién después de que la transacción confirmó todo: si Discord falla,
  // la cuenta igual quedó creada y utilizable.
  void emitNewClient({
    eventId: `registration-approved:${registration.id}`,
    userId: createdUserId,
    userName: fullName,
    userEmail: registration.email,
    businessId: createdBusinessId,
    businessName: registration.businessName,
    clientCode,
    source: reviewedBy,
  });

  return { clientCode };
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

/** Deriva un identificador legible del nombre y lo hace único. */
async function availableSlug(businessName: string): Promise<string> {
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
    const taken = await prisma.business.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!taken) return candidate;
  }

  return `${base}-${Date.now()}`;
}
