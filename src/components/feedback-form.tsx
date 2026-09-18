"use client";

import { useActionState, useId, useState } from "react";

import { EMPTY_FEEDBACK_STATE } from "@/lib/action-state";
import { cx } from "@/components/ui";
import { submitFeedback } from "@/server/feedback-actions";

const MAX_COMMENT = 300;

/** Etiqueta contextual por rating. Ninguna empuja a elegir una puntuación alta. */
const RATING_LABELS: Record<number, string> = {
  1: "Necesita mejorar",
  2: "Regular",
  3: "Buena",
  4: "Muy buena",
  5: "Excelente",
};

export function FeedbackForm({
  code,
  source,
  businessName,
}: {
  code: string;
  source: "qr" | "tap";
  businessName: string;
}) {
  const [state, formAction, pending] = useActionState(submitFeedback, EMPTY_FEEDBACK_STATE);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const formId = useId();

  if (state.submitted) {
    return <SuccessScreen code={code} source={source} state={state} />;
  }

  const displayRating = hoverRating || rating;
  const qs = source === "qr" ? "?s=qr" : "";

  return (
    <form id={formId} action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="code" value={code} />
      <input type="hidden" name="source" value={source} />
      <input type="hidden" name="rating" value={rating} />
      {/* Campo trampa contra robots: oculto de verdad, nunca completado por una persona. */}
      <div aria-hidden="true" className="hidden">
        <label>
          No completar este campo
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="text-center">
        <p className="text-lg font-medium">¿Cómo fue tu experiencia?</p>
        <p className="mt-1 text-sm text-muted">Tu opinión nos ayuda a seguir mejorando.</p>
      </div>

      <div
        role="radiogroup"
        aria-label={`Calificá tu experiencia con ${businessName}, de 1 a 5 estrellas`}
        className="flex flex-col items-center gap-3"
      >
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={`${value} ${value === 1 ? "estrella" : "estrellas"} — ${RATING_LABELS[value]}`}
              onClick={() => setRating(value)}
              onMouseEnter={() => setHoverRating(value)}
              onMouseLeave={() => setHoverRating(0)}
              onFocus={() => setHoverRating(value)}
              onBlur={() => setHoverRating(0)}
              className="tap-target rounded-lg p-1 transition-transform active:scale-90"
            >
              <svg
                viewBox="0 0 24 24"
                fill={value <= displayRating ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
                aria-hidden="true"
                className={cx(
                  "size-9 transition-colors sm:size-10",
                  value <= displayRating ? "text-brand" : "text-border",
                )}
              >
                <path d="m12 3 2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L12 17l-5.6 3.1 1.4-6.3-4.8-4.3 6.4-.6L12 3Z" />
              </svg>
            </button>
          ))}
        </div>
        <p className="h-5 text-sm font-medium text-brand" aria-live="polite">
          {displayRating ? RATING_LABELS[displayRating] : ""}
        </p>
      </div>

      <div>
        <label htmlFor={`${formId}-comment`} className="mb-2 block text-sm font-medium">
          Comentario
        </label>
        <textarea
          id={`${formId}-comment`}
          name="comment"
          maxLength={MAX_COMMENT}
          rows={4}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Contanos cómo fue tu experiencia..."
          className="w-full resize-none rounded-[var(--radius)] border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-brand"
        />
        <p className="mt-1.5 text-right text-xs text-muted">
          {comment.length} / {MAX_COMMENT} caracteres
        </p>
      </div>

      {state.error ? (
        <p role="alert" className="rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending || rating === 0}
        className="tap-target flex min-h-14 items-center justify-center rounded-[var(--radius)] bg-brand px-5 text-base font-semibold text-brand-contrast shadow-lg shadow-brand/20 transition-transform active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
      >
        {pending ? "Enviando…" : "Enviar"}
      </button>

      <a
        href={`/t/${encodeURIComponent(code)}${qs}`}
        className="text-center text-sm text-muted hover:text-foreground"
      >
        Volver
      </a>
    </form>
  );
}

function SuccessScreen({
  code,
  source,
  state,
}: {
  code: string;
  source: "qr" | "tap";
  state: { comment?: string | null; googleReviewLinkId?: string | null };
}) {
  const [copied, setCopied] = useState(false);
  const qs = source === "qr" ? "?s=qr" : "";
  const comment = state.comment?.trim();

  async function copyComment() {
    if (!comment) return;
    try {
      await navigator.clipboard.writeText(comment);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sin permiso de portapapeles o navegador sin soporte: el texto ya está
      // visible en pantalla para copiarlo a mano, así que no hace falta avisar de un error.
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-success-soft text-success">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-7" aria-hidden="true">
          <path d="m4 12.5 5 5L20 7" />
        </svg>
      </div>

      <div>
        <h2 className="text-lg font-semibold">¡Gracias por tu opinión!</h2>
        <p className="mt-1 text-sm text-muted">Tu feedback fue enviado correctamente.</p>
      </div>

      {comment ? (
        <div className="w-full rounded-[var(--radius)] border border-border bg-surface-muted p-4 text-left">
          <p className="text-xs font-medium text-muted">Tu comentario:</p>
          <p className="mt-1 text-sm text-pretty">&ldquo;{comment}&rdquo;</p>
        </div>
      ) : null}

      <div className="flex w-full flex-col gap-3">
        {comment ? (
          <button
            type="button"
            onClick={copyComment}
            className="tap-target flex min-h-12 items-center justify-center rounded-[var(--radius)] border border-border px-5 text-sm font-medium transition-colors hover:bg-surface-muted"
          >
            {copied ? "Comentario copiado" : "Copiar comentario"}
          </button>
        ) : null}

        {state.googleReviewLinkId ? (
          <a
            href={`/t/${encodeURIComponent(code)}/go/${encodeURIComponent(state.googleReviewLinkId)}${qs}`}
            target="_blank"
            rel="noopener noreferrer"
            className="tap-target flex min-h-14 items-center justify-center gap-2 rounded-[var(--radius)] bg-brand px-5 text-base font-semibold text-brand-contrast shadow-lg shadow-brand/20 transition-transform active:scale-[0.98]"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="size-5" aria-hidden="true">
              <path d="m12 3 2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L12 17l-5.6 3.1 1.4-6.3-4.8-4.3 6.4-.6L12 3Z" />
            </svg>
            Publicar en Google
          </a>
        ) : (
          <p className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted">
            El negocio todavía no configuró su enlace de reseñas de Google.
          </p>
        )}

        <p className="text-xs text-muted">Publicar en Google es opcional.</p>

        <a href={`/t/${encodeURIComponent(code)}${qs}`} className="text-sm text-muted hover:text-foreground">
          Volver al inicio
        </a>
      </div>
    </div>
  );
}
