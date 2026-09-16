"use client";

import { useState } from "react";

import { Button } from "@/components/ui";

/** Copia un texto al portapapeles y confirma brevemente. */
export function CopyButton({
  value,
  label = "Copiar URL",
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      variant="secondary"
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // Sin permiso de portapapeles no hay alternativa razonable: la URL
          // está visible en pantalla y se puede seleccionar a mano.
          setCopied(false);
        }
      }}
    >
      {copied ? "¡Copiado!" : label}
    </Button>
  );
}
