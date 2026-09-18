/**
 * Forma común del estado que devuelven las server actions a `useActionState`.
 * Vive fuera de los archivos "use server" porque esos módulos solo pueden
 * exportar funciones asíncronas.
 */
export type ActionState = {
  error?: string;
  success?: string;
};

export const EMPTY_STATE: ActionState = {};

/**
 * Estado de `submitFeedback` (`src/server/feedback-actions.ts`). El flujo de
 * feedback no usa el `<ActionForm>` genérico porque necesita mostrar una
 * pantalla de éxito distinta (calificación, comentario tal cual se escribió,
 * y el botón de Google) en vez de un simple mensaje de éxito.
 */
export type FeedbackActionState = ActionState & {
  submitted?: boolean;
  rating?: number;
  comment?: string | null;
  /**
   * Id del `BusinessLink` de tipo GOOGLE_REVIEWS, no la URL directa: el botón
   * "Publicar en Google" arma su href como `/t/[code]/go/[linkId]` para
   * reutilizar el mismo redirector (y el mismo tracking de clics) que
   * cualquier otro botón de la landing. `null` = el negocio todavía no
   * configuró su enlace de Google Reviews.
   */
  googleReviewLinkId?: string | null;
};

export const EMPTY_FEEDBACK_STATE: FeedbackActionState = {};
