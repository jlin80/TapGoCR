"use client";

import { useActionState, useId, type ReactNode } from "react";

import { Button, FormError, FormSuccess, type ButtonVariant } from "@/components/ui";
import { EMPTY_STATE, type ActionState } from "@/lib/action-state";

type ServerAction = (
  previous: ActionState,
  formData: FormData,
) => Promise<ActionState>;

/**
 * Formulario conectado a una server action.
 *
 * Encapsula el estado de envío y los mensajes de resultado para que las páginas
 * (componentes de servidor) solo declaren los campos. Los campos llegan como
 * `children` ya renderizados en el servidor.
 *
 * El botón de enviar vive fuera del `<form>` y se asocia por `id` con el
 * atributo `form`. Antes estaba adentro, en la misma fila que `footer` — y
 * `footer` casi siempre trae su propio `<form>` (por ejemplo, el de
 * "Eliminar"). Un `<form>` dentro de otro `<form>` es HTML inválido: el
 * navegador descarta el anidado y el botón termina enviando el formulario de
 * afuera, así que "Eliminar" en realidad disparaba "Guardar".
 */
export function ActionForm({
  action,
  children,
  submitLabel,
  pendingLabel,
  variant = "primary",
  className,
  footer,
}: {
  action: ServerAction;
  children: ReactNode;
  submitLabel: string;
  pendingLabel?: string;
  variant?: ButtonVariant;
  className?: string;
  footer?: ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, EMPTY_STATE);
  const formId = useId();

  return (
    <div className="flex flex-col gap-4">
      <form id={formId} action={formAction} className={className ?? "flex flex-col gap-4"}>
        {children}

        <FormError>{state.error}</FormError>
        <FormSuccess>{state.success}</FormSuccess>
      </form>

      <div className="flex items-center gap-3">
        <Button type="submit" form={formId} variant={variant} disabled={pending}>
          {pending ? (pendingLabel ?? "Guardando…") : submitLabel}
        </Button>
        {footer}
      </div>
    </div>
  );
}
