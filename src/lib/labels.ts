import type { BadgeTone } from "@/components/ui";
import type {
  ChipModel,
  ChipStatus,
  DomainStatus,
  EventSource,
  LeadStatus,
  RegistrationStatus,
  RequestPriority,
  RequestStatus,
  RequestType,
  ServiceStatus,
  ServiceType,
} from "@/generated/prisma/enums";

/** Etiquetas en español de los enumerados que se muestran en la interfaz. */

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  NFC: "NFC",
  QR: "QR",
  LANDING: "Landing",
  DOMAIN: "Dominio",
  WEBSITE: "Sitio web",
  HOSTING: "Hosting",
  EMAIL: "Correo",
  MAINTENANCE: "Mantenimiento",
  CUSTOM: "Otro",
};

export const SERVICE_STATUS_LABELS: Record<ServiceStatus, string> = {
  LEAD: "Prospecto",
  QUOTED: "Cotizado",
  PENDING: "Pendiente",
  ACTIVE: "Activo",
  PAUSED: "Pausado",
  CANCELLED: "Cancelado",
};

export const SERVICE_STATUS_TONES: Record<ServiceStatus, BadgeTone> = {
  LEAD: "neutral",
  QUOTED: "info",
  PENDING: "warning",
  ACTIVE: "success",
  PAUSED: "warning",
  CANCELLED: "danger",
};

export const DOMAIN_STATUS_LABELS: Record<DomainStatus, string> = {
  NONE: "Sin dominio",
  REQUESTED: "Solicitado",
  PURCHASE_PENDING: "Compra pendiente",
  REGISTERED: "Registrado",
  CONFIGURING: "Configurando",
  ACTIVE: "Activo",
  EXPIRED: "Vencido",
  CANCELLED: "Cancelado",
};

export const DOMAIN_STATUS_TONES: Record<DomainStatus, BadgeTone> = {
  NONE: "neutral",
  REQUESTED: "info",
  PURCHASE_PENDING: "warning",
  REGISTERED: "info",
  CONFIGURING: "warning",
  ACTIVE: "success",
  EXPIRED: "danger",
  CANCELLED: "danger",
};

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  DOMAIN: "Dominio",
  WEBSITE: "Sitio web",
  HOSTING: "Hosting",
  NFC: "NFC",
  QR: "QR",
  MAINTENANCE: "Mantenimiento",
  OTHER: "Otro",
};

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  NEW: "Nueva",
  IN_PROGRESS: "En proceso",
  WAITING_CLIENT: "Esperando al cliente",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};

export const REQUEST_STATUS_TONES: Record<RequestStatus, BadgeTone> = {
  NEW: "info",
  IN_PROGRESS: "warning",
  WAITING_CLIENT: "warning",
  COMPLETED: "success",
  CANCELLED: "neutral",
};

export const REQUEST_PRIORITY_LABELS: Record<RequestPriority, string> = {
  LOW: "Baja",
  NORMAL: "Normal",
  HIGH: "Alta",
  URGENT: "Urgente",
};

export const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
};

export const REGISTRATION_STATUS_TONES: Record<RegistrationStatus, BadgeTone> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "neutral",
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "Nueva",
  CONTACTED: "Contactada",
  QUOTED: "Cotizada",
  WON: "Cerrada",
  LOST: "Perdida",
};

export const LEAD_STATUS_TONES: Record<LeadStatus, BadgeTone> = {
  NEW: "info",
  CONTACTED: "warning",
  QUOTED: "warning",
  WON: "success",
  LOST: "neutral",
};

export const CHIP_MODEL_LABELS: Record<ChipModel, string> = {
  NTAG213: "NTAG213",
  NTAG215: "NTAG215",
  NTAG216: "NTAG216",
  OTHER: "Otro",
};

export const CHIP_STATUS_LABELS: Record<ChipStatus, string> = {
  IN_STOCK: "En stock",
  ASSIGNED: "Asignado",
  INSTALLED: "Instalado",
  RETIRED: "Retirado",
};

export const CHIP_STATUS_TONES: Record<ChipStatus, BadgeTone> = {
  IN_STOCK: "neutral",
  ASSIGNED: "info",
  INSTALLED: "success",
  RETIRED: "danger",
};

export const EVENT_SOURCE_LABELS: Record<EventSource, string> = {
  TAP: "NFC",
  QR: "QR",
};

/** Fecha corta para tablas; `null` se muestra como guion. */
export function formatDate(value: Date | null): string {
  if (!value) return "—";
  return value.toLocaleDateString("es-CR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Valor para un `<input type="date">`. */
export function toDateInput(value: Date | null): string {
  if (!value) return "";
  return value.toISOString().slice(0, 10);
}
