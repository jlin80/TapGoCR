import { z } from "zod";

import {
  ChipModel,
  ChipStatus,
  DomainStatus,
  Industry,
  LandingTheme,
  LeadStatus,
  LinkType,
  MenuMode,
  Plan,
  RegistrationStatus,
  RequestPriority,
  RequestStatus,
  RequestType,
  ServiceStatus,
  ServiceType,
} from "@/generated/prisma/enums";
import { parsePriceToCents } from "@/lib/price";
import { checkUrl } from "@/lib/url";

/**
 * Esquemas de validación de todo lo que entra desde un formulario.
 *
 * Toda server action valida con uno de estos esquemas antes de tocar la base de
 * datos. Los campos de texto se recortan y se limitan en longitud para que un
 * envío manipulado no pueda inflar la base.
 */

const trimmed = (max: number) => z.string().trim().max(max);

/** Campo de URL obligatorio, restringido a esquemas seguros. */
const urlField = trimmed(2048).superRefine((value, ctx) => {
  const result = checkUrl(value);
  if (!result.ok) ctx.addIssue({ code: "custom", message: result.reason });
});

/** Campo de URL opcional: la cadena vacía se convierte en null. */
const optionalUrlField = z
  .string()
  .trim()
  .max(2048)
  .optional()
  .transform((value) => (value ? value : null))
  .superRefine((value, ctx) => {
    if (value === null) return;
    const result = checkUrl(value);
    if (!result.ok) ctx.addIssue({ code: "custom", message: result.reason });
  });

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : null));

/** Coordenada opcional; acepta cadena vacía desde el formulario. */
const optionalCoordinate = (min: number, max: number) =>
  z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? Number(value) : null))
    .superRefine((value, ctx) => {
      if (value === null) return;
      if (Number.isNaN(value) || value < min || value > max) {
        ctx.addIssue({
          code: "custom",
          message: `Debe ser un número entre ${min} y ${max}.`,
        });
      }
    });

/**
 * Color hexadecimal de 6 dígitos.
 *
 * Se acota a `#rrggbb` en lugar de aceptar cualquier valor CSS porque el color
 * se inyecta en un atributo `style` de la landing: admitir texto libre abriría
 * la puerta a inyectar propiedades CSS arbitrarias.
 */
const optionalHexColor = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value.toLowerCase() : null))
  .superRefine((value, ctx) => {
    if (value === null) return;
    if (!/^#[0-9a-f]{6}$/.test(value)) {
      ctx.addIssue({
        code: "custom",
        message: "Usá un color hexadecimal de 6 dígitos, por ejemplo #c1121f.",
      });
    }
  });

/** Entero no negativo opcional; cadena vacía se convierte en null. */
const optionalNonNegativeInt = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? Number(value) : null))
  .superRefine((value, ctx) => {
    if (value === null) return;
    if (!Number.isInteger(value) || value < 0) {
      ctx.addIssue({ code: "custom", message: "Debe ser un número entero mayor o igual a 0." });
    }
  });

const optionalDate = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? new Date(value) : null))
  .superRefine((value, ctx) => {
    if (value !== null && Number.isNaN(value.getTime())) {
      ctx.addIssue({ code: "custom", message: "Fecha inválida." });
    }
  });

/**
 * Casilla de formulario HTML: cuando está desmarcada, el navegador ni
 * siquiera manda su clave en el `FormData` — no llega como `undefined`, llega
 * ausente del todo. `z.undefined()` dentro de la unión solo cubre una clave
 * presente con valor `undefined`; para que Zod acepte la clave *faltante*
 * hace falta `.optional()` en el campo. Sin esto, desmarcar cualquier
 * checkbox y guardar tira "Invalid input: expected nonoptional, received
 * undefined" en vez de guardar `false`.
 */
const checkbox = z
  .union([z.literal("on"), z.literal("true"), z.literal("false")])
  .optional()
  .transform((value) => value === "on" || value === "true");

// ---------------------------------------------------------------------------

export const businessSchema = z.object({
  name: trimmed(120).min(2, "El nombre debe tener al menos 2 caracteres."),
  slug: trimmed(80)
    .min(2, "El identificador debe tener al menos 2 caracteres.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Solo minúsculas, números y guiones simples.",
    ),
  description: optionalText(300),
  category: optionalText(60),
  // El <select> de ROOT tiene una opción "Sin especificar" que manda "", no
  // ausente: a diferencia del picker visual del registro (un <input hidden>
  // que solo existe cuando hay una industria elegida), acá "" es un valor
  // real que hay que tratar como ausencia, no rechazar.
  industry: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.enum(Industry).optional(),
  ),
  logoUrl: optionalUrlField,
  coverUrl: optionalUrlField,
  brandColor: optionalHexColor,
  accentColor: optionalHexColor,
  phone: optionalText(40),
  whatsapp: optionalText(40),
  address: optionalText(200),
  latitude: optionalCoordinate(-90, 90),
  longitude: optionalCoordinate(-180, 180),
  websiteUrl: optionalUrlField,
  active: checkbox,
  plan: z.enum(Plan),
  includedTagsOverride: optionalNonNegativeInt,
  landingTheme: z.enum(LandingTheme).default(LandingTheme.MINIMAL),
});

/**
 * Campos de presentación que el propio negocio administra desde "Mi página
 * pública".
 *
 * Es un subconjunto estricto de `businessSchema` a propósito. Quedan fuera
 * `slug` (identifica al negocio en la plataforma y no es cosmético), `active`
 * (cortar el servicio es una decisión de TapGoCR) y `legalId` (dato fiscal).
 * Un cliente que enviara esos campos igual no los cambiaría: la acción arma el
 * `update` solo con las claves de este esquema.
 */
export const publicProfileSchema = z.object({
  name: trimmed(120).min(2, "El nombre debe tener al menos 2 caracteres."),
  description: optionalText(300),
  category: optionalText(60),
  logoUrl: optionalUrlField,
  coverUrl: optionalUrlField,
  brandColor: optionalHexColor,
  accentColor: optionalHexColor,
  menuMode: z.enum(MenuMode),
  landingTheme: z.enum(LandingTheme).default(LandingTheme.MINIMAL),
});

export const menuCategorySchema = z.object({
  name: trimmed(60).min(2, "Escribí el nombre de la categoría."),
  description: optionalText(200),
  active: checkbox,
});

/**
 * Producto del menú.
 *
 * El precio llega como texto libre porque el negocio lo escribe con coma o con
 * espacios; se normaliza a céntimos enteros y se rechaza cualquier cosa que no
 * sea un número. Un producto sin precio es válido: hay cartas que dicen
 * "precio del día".
 */
export const menuItemSchema = z.object({
  name: trimmed(80).min(2, "Escribí el nombre del producto."),
  description: optionalText(300),
  priceCents: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? parsePriceToCents(value) : null))
    .superRefine((value, ctx) => {
      if (value === null) return;
      if (!Number.isInteger(value) || value < 0 || value > 100_000_000) {
        ctx.addIssue({
          code: "custom",
          message: "Ingresá un precio válido, por ejemplo 2500.",
        });
      }
    }),
  imageUrl: optionalUrlField,
  available: checkbox,
  featured: checkbox,
});

export const businessLinkSchema = z.object({
  type: z.enum(LinkType),
  label: trimmed(60).min(1, "Escribí una etiqueta para el botón."),
  url: urlField.pipe(z.string().min(1, "La URL no puede estar vacía.")),
  position: z.coerce.number().int().min(0).max(999).default(0),
  active: checkbox,
});

/**
 * Alta de un enlace subiendo un archivo en lugar de pegar una URL.
 *
 * Sin `url`: la resuelve `saveUpload` una vez guardado el archivo en disco, no
 * este esquema — acá solo se valida lo que sí llega como texto del formulario.
 */
export const businessFileLinkSchema = z.object({
  type: z.enum(LinkType),
  label: trimmed(60).min(1, "Escribí una etiqueta para el botón."),
  active: checkbox,
});

export const tagSchema = z.object({
  name: trimmed(60).min(1, "Escribí un nombre para el tag."),
  locationLabel: optionalText(80),
  active: checkbox,
});

/**
 * Creación masiva de puntos TapGo (ROOT/Admin). "Mesa" + 10 → Mesa 1..Mesa 10,
 * todos en el mismo `PointGroup`. Tope de 50 por tanda: ni un negocio real
 * necesita más de golpe, ni conviene poder tipear un número desmedido en un
 * campo sin más validación que "es un entero".
 */
export const tagBulkSchema = z.object({
  groupName: trimmed(60).min(1, "Escribí un nombre de grupo, por ejemplo Mesas."),
  namePrefix: trimmed(40).min(1, "Escribí un nombre base, por ejemplo Mesa."),
  quantity: z.coerce
    .number()
    .int("Tiene que ser un número entero.")
    .min(1, "Creá al menos un punto.")
    .max(50, "Máximo 50 puntos por tanda."),
  startIndex: z.coerce.number().int().min(1).default(1),
  locationLabel: optionalText(80),
});

export const domainSchema = z.object({
  domain: trimmed(253)
    .min(4, "Escribí un dominio válido.")
    .regex(
      /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/,
      "Formato de dominio inválido. Ejemplo: burgerlab.com",
    ),
  status: z.enum(DomainStatus),
  registrar: optionalText(120),
  expiresAt: optionalDate,
  autoRenew: checkbox,
  notes: optionalText(1000),
});

export const serviceSchema = z.object({
  type: z.enum(ServiceType),
  status: z.enum(ServiceStatus),
  provider: optionalText(120),
  notes: optionalText(1000),
  startDate: optionalDate,
  renewalDate: optionalDate,
  lastUpdate: optionalDate,
  nextReview: optionalDate,
});

export const serviceRequestSchema = z.object({
  type: z.enum(RequestType),
  title: trimmed(120).min(3, "Escribí un título descriptivo."),
  description: optionalText(2000),
  status: z.enum(RequestStatus),
  priority: z.enum(RequestPriority),
});

/** Solicitud creada por el cliente: no elige estado ni prioridad. */
export const clientRequestSchema = z.object({
  type: z.enum(RequestType),
  title: trimmed(120).min(3, "Escribí un título descriptivo."),
  description: optionalText(2000),
});

export const userSchema = z.object({
  email: z.email("Ingresá un correo válido.").max(254).toLowerCase(),
  name: trimmed(120).min(2, "Escribí el nombre del contacto."),
  password: z
    .string()
    .min(12, "La contraseña debe tener al menos 12 caracteres.")
    .max(200),
  businessId: z.string().min(1).optional(),
});

/**
 * Alta y edición de un chip físico.
 *
 * El UID es el que trae grabado el chip de fábrica. Se normaliza a mayúsculas
 * sin separadores para que el mismo chip no se registre dos veces por haberlo
 * escrito con dos puntos o con guiones.
 */
export const chipSchema = z.object({
  uid: trimmed(32)
    .min(6, "El UID debe tener al menos 6 caracteres.")
    .transform((value) => value.replace(/[^0-9A-Fa-f]/g, "").toUpperCase())
    .refine((value) => /^[0-9A-F]+$/.test(value), {
      message: "El UID solo admite dígitos hexadecimales (0-9 y A-F).",
    }),
  model: z.enum(ChipModel),
  status: z.enum(ChipStatus),
  batch: optionalText(60),
  notes: optionalText(1000),
});

/** Asignación de un chip a un tag, o desvinculación si el tag viene vacío. */
export const chipAssignSchema = z.object({
  chipId: z.string().min(1),
  tagId: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : null)),
});

/**
 * Alta pedida desde el sitio público.
 *
 * La persona elige su contraseña acá mismo; el identificador de cliente lo
 * asigna el sistema al aprobar, así que no hay ningún campo de usuario.
 *
 * `website` es un campo trampa, igual que en el formulario de contacto.
 */
export const registrationSchema = z
  .object({
    firstName: trimmed(60).min(2, "Escribí tu nombre."),
    lastName: trimmed(60).min(2, "Escribí tus apellidos."),
    email: z.email("Ingresá un correo válido.").max(254).toLowerCase(),
    phone: trimmed(40).min(8, "Ingresá un teléfono de contacto."),
    password: z
      .string()
      .min(12, "La contraseña debe tener al menos 12 caracteres.")
      .max(200),
    passwordConfirm: z.string().max(200),
    businessName: trimmed(120).min(2, "Escribí el nombre del negocio."),
    industry: z.enum(Industry).optional(),
    legalId: optionalText(40),
    address: trimmed(200).min(5, "Escribí la dirección del negocio."),
    province: trimmed(60).min(2, "Indicá la provincia."),
    canton: optionalText(60),
    postalCode: optionalText(20),
    notes: optionalText(1000),

    // Presencia online opcional: si la persona ya la tiene, no estrena la
    // placa con la landing vacía. `whatsapp` es texto libre y no una URL —va
    // directo a `Business.whatsapp`, que ya valida el formato al derivar el
    // botón— y los demás son enlaces reales, con el mismo chequeo de esquema
    // que el resto de la plataforma.
    whatsapp: optionalText(40),
    instagramUrl: optionalUrlField,
    facebookUrl: optionalUrlField,
    googleReviewsUrl: optionalUrlField,
    menuUrl: optionalUrlField,

    website: z.string().max(200).optional(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Las contraseñas no coinciden.",
    path: ["passwordConfirm"],
  });

/** Resolución de una solicitud por parte de ROOT. */
export const registrationReviewSchema = z.object({
  registrationId: z.string().min(1),
  status: z.enum(RegistrationStatus),
  reviewNotes: optionalText(1000),
});

/**
 * Consulta enviada desde el sitio comercial.
 *
 * `website` es un campo trampa: está oculto en el formulario, así que una
 * persona nunca lo completa y un robot que rellena todo sí. Si viene con algo,
 * se descarta el envío.
 */
export const contactSchema = z.object({
  name: trimmed(120).min(2, "Escribí tu nombre."),
  email: z.email("Ingresá un correo válido.").max(254).toLowerCase(),
  phone: optionalText(40),
  businessName: optionalText(120),
  // El camino corto de venta (hero, CTA final) no obliga a escribir un
  // mensaje: alcanza con elegir rubro y objetivo. `submitContact` arma un
  // mensaje legible con esos dos datos cuando esto viene vacío — la tabla
  // `ContactLead.message` sigue siendo obligatoria, nunca queda vacía.
  message: optionalText(2000),
  industry: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.enum(Industry).optional(),
  ),
  goal: optionalText(120),
  website: z.string().max(200).optional(),
});

export const leadUpdateSchema = z.object({
  leadId: z.string().min(1),
  status: z.enum(LeadStatus),
  notes: optionalText(2000),
});

/** Restablecimiento hecho por un administrador: no pide la contraseña anterior. */
export const resetPasswordSchema = z.object({
  userId: z.string().min(1, "Seleccioná una cuenta."),
  password: z
    .string()
    .min(12, "La contraseña debe tener al menos 12 caracteres.")
    .max(200),
});

export const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Ingresá tu contraseña actual.").max(200),
  newPassword: z
    .string()
    .min(12, "La nueva contraseña debe tener al menos 12 caracteres.")
    .max(200),
});

// ---------------------------------------------------------------------------

/** Primer mensaje de error de un `safeParse` fallido, listo para mostrar. */
export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Datos inválidos.";
}

/** Convierte un FormData en un objeto plano para `safeParse`. */
export function formValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") values[key] = value;
  }
  return values;
}
