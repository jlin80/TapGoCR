"use server";

import { headers } from "next/headers";

import type { FeedbackActionState } from "@/lib/action-state";
import { EventSource, LinkType } from "@/generated/prisma/enums";
import { limitPublicSubmission } from "@/lib/public-rate-limit";
import { prisma } from "@/lib/prisma";
import { feedbackSchema, firstIssue, formValues } from "@/lib/validation";

/**
 * Envíos de feedback permitidos por IP y por hora. Bastante más generoso que
 * el formulario de contacto: un negocio con tráfico real puede recibir varias
 * opiniones legítimas en una hora desde la misma red (varias mesas, el mismo
 * WiFi del local).
 */
const FEEDBACK_WINDOW_MS = 60 * 60 * 1000;

function feedbackLimit(): number {
  const configured = Number(process.env.FEEDBACK_RATE_LIMIT);
  return Number.isFinite(configured) && configured > 0 ? configured : 10;
}

/**
 * Guarda el feedback de un cliente y devuelve el enlace de Google Reviews del
 * negocio, si lo configuró.
 *
 * El negocio SIEMPRE se resuelve a partir del código de la placa (`code`),
 * nunca de un `businessId` que llegara en el formulario — el mismo criterio
 * de `/t/[code]/go/[linkId]`, para que nadie pueda escribir feedback a nombre
 * de un negocio ajeno con solo cambiar un campo oculto.
 *
 * Sin "review gating": el enlace de Google se devuelve para cualquier rating,
 * de 1 a 5. La calificación nunca decide si el cliente puede publicar su
 * experiencia.
 */
export async function submitFeedback(
  _previous: FeedbackActionState,
  formData: FormData,
): Promise<FeedbackActionState> {
  const parsed = feedbackSchema.safeParse(formValues(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  // Campo trampa completado: casi con certeza un robot. Se responde como si
  // hubiera funcionado, sin guardar nada ni revelar la trampa.
  if (parsed.data.website) {
    return { submitted: true, rating: parsed.data.rating, comment: parsed.data.comment, googleReviewLinkId: null };
  }

  const tag = await prisma.tag.findUnique({
    where: { code: parsed.data.code },
    select: {
      id: true,
      active: true,
      businessId: true,
      business: {
        select: {
          active: true,
          links: {
            where: { type: LinkType.GOOGLE_REVIEWS, active: true },
            orderBy: [{ position: "asc" }, { createdAt: "asc" }],
            take: 1,
            select: { id: true },
          },
        },
      },
    },
  });

  if (!tag || !tag.active || !tag.business.active) {
    return { error: "No pudimos identificar tu placa. Volvé a escanearla e intentá de nuevo." };
  }

  const requestHeaders = await headers();
  const limit = limitPublicSubmission({
    kind: "feedback",
    headers: requestHeaders,
    limit: feedbackLimit(),
    windowMs: FEEDBACK_WINDOW_MS,
  });

  if (!limit.allowed) {
    return { error: "Ya recibimos varias opiniones tuyas. Probá de nuevo más tarde." };
  }

  const source = parsed.data.source === "qr" ? EventSource.QR : EventSource.TAP;

  await prisma.feedback.create({
    data: {
      businessId: tag.businessId,
      tagId: tag.id,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
      source,
    },
  });

  return {
    submitted: true,
    rating: parsed.data.rating,
    comment: parsed.data.comment,
    googleReviewLinkId: tag.business.links[0]?.id ?? null,
  };
}
