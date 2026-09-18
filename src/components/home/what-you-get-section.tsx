import Image from "next/image";

import { Check, SectionHeading } from "@/components/marketing";

/**
 * "¿Qué recibís?" con protagonismo propio, separada de la comparación
 * pago-inicial-vs-mensualidad (esa vive más abajo, en la sección de
 * "Placa vs plataforma"). Acá solo el producto físico: la misma lista que
 * usa esa sección para no inventar una segunda versión de las inclusiones.
 */
const INCLUDES = [
  "Placa física personalizada",
  "Chip NFC integrado",
  "Código QR integrado",
  "Diseño con tu marca",
  "Configuración inicial",
  "Página digital, según tu plan",
];

export function WhatYouGetSection() {
  return (
    <section id="que-recibis" className="border-b border-border bg-surface-muted">
      <div className="mx-auto max-w-5xl px-5 py-16 sm:py-20 lg:py-24">
        <SectionHeading
          eyebrow="¿Qué recibís?"
          title="Tu TapGo llega listo para conectar a tus clientes con tu negocio."
        />

        <div className="mt-12 grid items-center gap-8 sm:mt-16 lg:grid-cols-2 lg:gap-12">
          {/*
            Mismo archivo que el hero (`hero-placa.png`), pero recortado en
            close-up sobre la placa en vez de la escena completa: composición
            distinta de la misma foto real, como pide evitar repetir
            exactamente la misma imagen en cada sección.
          */}
          <div className="reveal aspect-[4/3] overflow-hidden rounded-3xl border border-border">
            <Image
              src="/brand/hero-placa.png"
              alt="Placa TapGo, de cerca"
              width={1374}
              height={1145}
              className="h-full w-full scale-150 object-cover object-[54%_42%]"
              sizes="(min-width: 1024px) 45vw, 90vw"
            />
          </div>

          <div className="reveal reveal-2 rounded-3xl border border-border bg-surface p-7 sm:p-10">
            <h3 className="text-sm font-semibold tracking-widest text-muted uppercase">Incluye</h3>
            <ul className="mt-6 flex flex-col gap-3.5">
              {INCLUDES.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Check />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
