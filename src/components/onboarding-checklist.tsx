import Link from "next/link";

/**
 * Puesta en marcha de la página pública, con el TapGo Score.
 *
 * Aparece en el panel del cliente mientras falte alguno de los datos que más
 * se preguntan al mostrar la placa: logo, ubicación, WhatsApp, redes, reseñas
 * de Google y menú. Cubre tanto al negocio que se registró antes de que el
 * alta pidiera estos datos como al que dejó algún campo vacío a propósito.
 *
 * El puntaje es aritmética simple sobre estos mismos seis datos — nunca una
 * promesa de más ventas o de mejor posicionamiento, que no podemos demostrar.
 * La sección se oculta solo cuando los seis están resueltos: mostrarla a
 * medias, con ítems tachados, es justo lo que hace que alguien vuelva a
 * mirarla.
 */
export type ChecklistState = {
  hasLogo: boolean;
  hasLocation: boolean;
  hasWhatsapp: boolean;
  hasSocial: boolean;
  hasReviews: boolean;
  hasMenu: boolean;
};

const ITEMS: Array<{
  key: keyof ChecklistState;
  label: string;
  description: string;
  href: string;
}> = [
  {
    key: "hasLogo",
    label: "Logo",
    description: "Es lo primero que ve quien toca tu placa.",
    href: "/client/profile",
  },
  {
    key: "hasLocation",
    label: "Ubicación",
    description: "Habilita el botón «Cómo llegar».",
    href: "/client/business",
  },
  {
    key: "hasWhatsapp",
    label: "WhatsApp",
    description: "El botón para pedir o consultar aparece solo con este dato.",
    href: "/client/business",
  },
  {
    key: "hasSocial",
    label: "Redes sociales",
    description: "Instagram, Facebook o TikTok.",
    href: "/client/business",
  },
  {
    key: "hasReviews",
    label: "Reseñas de Google",
    description: "El enlace que abre directo el formulario de reseña.",
    href: "/client/business",
  },
  {
    key: "hasMenu",
    label: "Menú",
    description: "Un enlace, un PDF, o tu carta cargada en TapGoCR.",
    href: "/client/menu",
  },
];

/** Puntaje sobre 100: cuántos de los datos clave completó el negocio. */
export function tapGoScore(state: ChecklistState): number {
  const done = ITEMS.filter((item) => state[item.key]).length;
  return Math.round((done / ITEMS.length) * 100);
}

export function OnboardingChecklist({ state }: { state: ChecklistState }) {
  const pending = ITEMS.filter((item) => !state[item.key]);
  if (pending.length === 0) return null;

  const score = tapGoScore(state);

  return (
    <section className="surface-panel mb-12 overflow-hidden">
      <div className="px-5 pt-5 pb-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="text-lg font-semibold tracking-tight">
            Terminá de armar tu página
          </h2>
          <p className="text-sm text-muted">
            TapGo Score: <span className="font-semibold text-foreground">{score}/100</span>
          </p>
        </div>
        <p className="mt-0.5 text-sm text-muted">
          {pending.length === 1
            ? "Falta un dato para que tu placa muestre todo tu negocio."
            : `Faltan ${pending.length} datos para que tu placa muestre todo tu negocio.`}
        </p>
      </div>

      <ul className="divide-hairline mt-3">
        {pending.map((item) => (
          <li key={item.key}>
            <Link
              href={item.href}
              className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-surface-muted"
            >
              <span
                aria-hidden="true"
                className="size-2 shrink-0 rounded-full bg-accent"
              />
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{item.label}</span>
                <span className="block truncate text-sm text-muted">
                  {item.description}
                </span>
              </span>
              <span className="shrink-0 text-sm font-medium text-muted transition-colors group-hover:text-brand">
                Agregar
              </span>
              <span aria-hidden="true" className="shrink-0 text-muted">
                &rsaquo;
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
