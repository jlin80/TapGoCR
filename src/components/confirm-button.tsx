"use client";

import { useFormStatus } from "react-dom";

import { Button, type ButtonVariant } from "@/components/ui";

/**
 * Botón de envío para formularios de una sola acción (activar, eliminar,
 * reordenar). Con `confirm` pide confirmación antes de enviar; sin JavaScript
 * el formulario se envía igual, que es el comportamiento aceptable aquí.
 */
export function SubmitButton({
  children,
  confirm,
  variant = "secondary",
  className,
  title,
}: {
  children: React.ReactNode;
  confirm?: string;
  variant?: ButtonVariant;
  className?: string;
  title?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={variant}
      className={className}
      title={title}
      disabled={pending}
      onClick={(event) => {
        if (confirm && !window.confirm(confirm)) event.preventDefault();
      }}
    >
      {children}
    </Button>
  );
}
