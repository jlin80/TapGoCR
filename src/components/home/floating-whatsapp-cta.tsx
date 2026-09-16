import { contactWhatsappUrl } from "@/lib/config";

/**
 * CTA de ventas flotante, no un simple botón de "WhatsApp".
 *
 * Reemplaza al isotipo flotante que solo bajaba a #contacto: acá el texto y
 * el destino son la venta ("💬 Quiero mi TapGo"), con un mensaje prellenado
 * que ya le da contexto a quien responde. Como el resto de los botones de
 * contacto del sitio, no se muestra si no hay un WhatsApp configurado — un
 * botón que no funciona es peor que no tenerlo.
 *
 * Oculto en mobile (`hidden sm:flex`): ahí ya existe el CTA fijo de
 * `SiteFooter` (`MobileStickyCta`) al pie de la pantalla.
 */
export function FloatingWhatsappCta() {
  if (!contactWhatsappUrl) return null;

  const message = encodeURIComponent(
    "Hola, quiero información sobre TapGoCR. Me gustaría saber cuál solución se adapta mejor a mi negocio.",
  );

  return (
    <a
      href={`${contactWhatsappUrl}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      className="tap-target-box fixed right-5 bottom-5 z-30 hidden items-center gap-2.5 rounded-full bg-brand px-5 py-3.5 text-sm font-semibold text-brand-contrast shadow-lg shadow-brand/30 transition-transform hover:scale-105 sm:flex"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="size-5"
      >
        <path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.3 8.7 8.7 0 0 1-3.9-.9L3 20.5l1.7-4.5a8.2 8.2 0 0 1-1.2-4.3A8.4 8.4 0 0 1 12 3.2a8.4 8.4 0 0 1 9 8.3Z" />
      </svg>
      Quiero mi TapGo
    </a>
  );
}
