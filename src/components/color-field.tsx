"use client";

import { useId, useState } from "react";

import { Input } from "@/components/ui";

/**
 * Campo de color: el swatch nativo (`input[type=color]`) para elegir con una
 * paleta, sincronizado con el mismo texto hexadecimal que ya validan las
 * server actions (`pattern="#[0-9a-fA-F]{6}"`). Solo el campo de texto lleva
 * `name` — el swatch es puramente una forma más cómoda de escribir el mismo
 * valor, no un segundo dato que enviar.
 *
 * El swatch necesita un valor `#rrggbb` completo y sin vacíos (a diferencia
 * del texto, que puede dejarse en blanco para "sin color"): cuando el negocio
 * no tiene un color propio todavía, el swatch arranca en `fallback` — un gris
 * neutro, nunca el color de marca de TapGo — y el campo de texto sigue vacío
 * hasta que la persona realmente elige algo.
 */
export function ColorField({
  name,
  defaultValue,
  placeholder,
  fallback = "#94a3b8",
}: {
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  fallback?: string;
}) {
  const [hex, setHex] = useState(defaultValue?.trim() || "");
  const swatchId = useId();
  const isValidHex = /^#[0-9a-fA-F]{6}$/.test(hex);

  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        aria-label="Elegir color"
        id={swatchId}
        value={isValidHex ? hex : fallback}
        onChange={(event) => setHex(event.target.value)}
        className="tap-target-box size-10 shrink-0 cursor-pointer rounded-lg border border-border bg-transparent p-1"
      />
      <Input
        name={name}
        maxLength={7}
        pattern="#[0-9a-fA-F]{6}"
        value={hex}
        onChange={(event) => setHex(event.target.value)}
        placeholder={placeholder}
        className="flex-1"
      />
    </div>
  );
}
