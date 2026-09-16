import { Highlight } from "@/components/marketing";

/** Tres razones cortas, arriba de todo lo demás. */
export function HighlightsSection() {
  return (
    <section className="border-b border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 text-center sm:grid-cols-3">
        <Highlight title="Sin apps">
          Se abre en el navegador del teléfono, como cualquier página.
        </Highlight>
        <Highlight title="Al instante" delay={2}>
          Editás un enlace y se ve en todas tus mesas de inmediato.
        </Highlight>
        <Highlight title="NFC y QR" delay={3}>
          Funciona con teléfonos nuevos y con los que no tienen NFC.
        </Highlight>
      </div>
    </section>
  );
}
