import { Marquee } from "@/components/marketing";

const CAPABILITIES = [
  "Escaneos por día",
  "Clics por destino",
  "Estadísticas por mesa",
  "iPhone y Android",
  "Cambios al instante",
  "Sin reimprimir",
  "Panel propio",
  "QR descargable",
  "Placas y stickers",
  "Chips NFC certificados",
];

/** Lo que ve el cliente final contra lo que ve el dueño del negocio. */
export function DualViewSection() {
  return (
    <>
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:py-24 lg:py-28">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="reveal lift rounded-3xl border border-border bg-surface p-7 sm:p-10">
              <h3 className="text-2xl font-semibold">Lo que ve tu cliente</h3>
              <ul className="mt-6 flex flex-col gap-3.5 text-muted">
                <li>Una página que abre en menos de un segundo</li>
                <li>Botones grandes, pensados para usar con una mano</li>
                <li>Sin registro ni correo</li>
                <li>Siempre la información actualizada</li>
              </ul>
            </div>

            <div className="reveal reveal-2 lift rounded-3xl border border-border bg-surface p-7 sm:p-10">
              <h3 className="text-2xl font-semibold">Lo que ves vos</h3>
              <ul className="mt-6 flex flex-col gap-3.5 text-muted">
                <li>Escaneos de hoy, de la semana y del mes</li>
                <li>Qué punto de tu local se usa más</li>
                <li>Qué botón tocan más: menú, WhatsApp o redes</li>
                <li>Un panel para cambiar tus enlaces cuando querás</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-surface py-8">
        <Marquee items={CAPABILITIES} reverse />
      </section>
    </>
  );
}
