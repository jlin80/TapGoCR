import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/**
 * Primitivas de interfaz compartidas por los paneles de administración y de
 * cliente. Son componentes de servidor: ninguno necesita estado en el cliente.
 */

export function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

// ---------------------------------------------------------------------------
// Contenedores
// ---------------------------------------------------------------------------

/**
 * Contenedor de contenido agrupado.
 *
 * Sin borde ni sombra por defecto. Antes toda tarjeta llevaba borde de 1px mas
 * `shadow-sm`, y con ocho o diez en pantalla el borde dejaba de separar para
 * convertirse en ruido. La separacion la hace ahora el contraste de fondo entre
 * `--surface` y `--background`, que existe en los dos temas.
 *
 * `bordered` se reserva para cuando una tarjeta se apoya sobre otra superficie
 * del mismo tono y el contraste no alcanza.
 */
export function Card({
  children,
  className,
  bordered = false,
}: {
  children: ReactNode;
  className?: string;
  bordered?: boolean;
}) {
  return (
    <div
      className={cx(
        "surface-panel p-5",
        bordered && "border border-border",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    // `items-end` alinea la accion con la base del bloque de texto en lugar de
    // con su borde superior: con titulo y descripcion, alinear arriba dejaba el
    // boton flotando. El titulo escala con el viewport en vez de saltar.
    <header className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        <h1 className="text-[clamp(1.5rem,1.2rem+1vw,2rem)] font-semibold tracking-tight">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-[60ch] text-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-3 text-sm font-semibold text-muted uppercase tracking-wide">{children}</h2>;
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    // El borde punteado era decorativo y gritaba "aqui falta algo". Una
    // superficie hundida comunica lo mismo sin dibujar un marco.
    <div className="surface-sunken px-6 py-12 text-center">
      <p className="font-medium">{title}</p>
      {description ? (
        <p className="mx-auto mt-1.5 max-w-[46ch] text-sm text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Métricas
// ---------------------------------------------------------------------------

/**
 * Una cifra dentro de un riel.
 *
 * Ya no es una tarjeta: el nombre se conserva porque lo usan varias paginas,
 * pero ahora rinde una celda pensada para vivir dentro de `.stat-rail`, donde
 * la separacion la hace un filete y no un marco. El numero manda; la etiqueta
 * se retira. Un cero se atenua para no competir con un dato real.
 *
 * Para listas de cifras nuevas conviene `StatRail` de `@/components/console`,
 * que ademas admite enlazar cada cifra a su seccion.
 */
export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  const cero = value === 0;

  return (
    <div className={cx(cero && "stat-zero")}>
      <p className="stat-label">{label}</p>
      <p className="stat-value mt-2">
        {typeof value === "number" ? value.toLocaleString("es-CR") : value}
      </p>
      {hint ? <p className="mt-1.5 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Indicadores
// ---------------------------------------------------------------------------

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: "bg-surface-muted text-muted",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-brand-strong",
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        BADGE_TONES[tone],
      )}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Acciones
// ---------------------------------------------------------------------------

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-brand text-brand-contrast hover:bg-brand-strong",
  secondary: "border border-border bg-surface hover:bg-surface-muted",
  danger: "border border-transparent bg-danger-soft text-danger hover:brightness-95",
  ghost: "hover:bg-surface-muted",
};

// `tap-target` eleva el alto mínimo a 44px solo cuando se apunta con el dedo.
// Ver el bloque `pointer: coarse` en globals.css.
const BUTTON_BASE =
  "tap-target inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60";

export function Button({
  variant = "primary",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant }) {
  return (
    <button
      {...props}
      className={cx(BUTTON_BASE, BUTTON_VARIANTS[variant], className)}
    />
  );
}

export function LinkButton({
  variant = "secondary",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant }) {
  return (
    <Link {...props} className={cx(BUTTON_BASE, BUTTON_VARIANTS[variant], className)} />
  );
}

/**
 * Como `LinkButton`, pero con un `<a>` real en vez de `next/link`.
 *
 * Usar solo para `/login` y `/registro`: nginx redirige esas rutas del
 * dominio raíz hacia `app.{dominio}` (ver
 * `deploy/nginx.multisite.conf.example`). `<Link>` intercepta el click e
 * intenta una transición de cliente vía `fetch()`; contra un destino que
 * cruza de origen, ese fetch dispara un preflight de CORS que el servidor
 * nunca puede pasar (el protocolo RSC de Next.js no está pensado para
 * servirse entre dominios), y el navegador lo bloquea. Un `<a>` normal
 * dispara una navegación completa, que sí sigue la redirección sin problema.
 */
export function CrossOriginLinkButton({
  variant = "secondary",
  className,
  ...props
}: ComponentProps<"a"> & { variant?: ButtonVariant }) {
  return <a {...props} className={cx(BUTTON_BASE, BUTTON_VARIANTS[variant], className)} />;
}

// ---------------------------------------------------------------------------
// Formularios
// ---------------------------------------------------------------------------

const CONTROL =
  "tap-target w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted focus:border-brand disabled:cursor-not-allowed disabled:opacity-60";

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
      {hint && !error ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
      {error ? <span className="mt-1 block text-xs text-danger">{error}</span> : null}
    </label>
  );
}

/**
 * Grupo de campos relacionados dentro de un formulario.
 *
 * El formulario de negocio tenia catorce campos en una sola rejilla plana:
 * nombre, coordenadas, colores y estado, todos con el mismo peso y sin ninguna
 * pista de que hacia que. Agrupados por lo que significan —identidad, contacto,
 * presentacion— se recorre por bloques y se entiende que se esta editando.
 *
 * Es un `<fieldset>` de verdad, no un div con un titulo: el lector de pantalla
 * anuncia la leyenda al entrar en cada campo del grupo.
 */
export function Fieldset({
  legend,
  description,
  children,
}: {
  legend: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="min-w-0 border-0 p-0">
      <legend className="mb-1 text-sm font-semibold">{legend}</legend>
      {description ? (
        <p className="mb-4 max-w-[60ch] text-sm text-muted">{description}</p>
      ) : (
        <div className="mb-4" />
      )}
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

/** Un campo que ocupa las dos columnas del grupo. */
export function FieldWide({ children }: { children: ReactNode }) {
  return <div className="sm:col-span-2">{children}</div>;
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input {...props} className={cx(CONTROL, className)} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea {...props} className={cx(CONTROL, "min-h-24", className)} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select {...props} className={cx(CONTROL, className)} />;
}

export function Checkbox({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      type="checkbox"
      {...props}
      className={cx(
        "tap-target-box size-4 rounded border-border accent-[var(--brand)]",
        className,
      )}
    />
  );
}

/** Mensaje de error de un formulario, devuelto por una server action. */
export function FormError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger"
    >
      {children}
    </p>
  );
}

/** Confirmación breve tras una operación correcta. */
export function FormSuccess({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p className="rounded-lg bg-success-soft px-3 py-2 text-sm text-success">
      {children}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Tablas
// ---------------------------------------------------------------------------

/**
 * Tabla de datos que se apila en pantallas angostas.
 *
 * Por debajo de 768px cada fila se convierte en una ficha y cada celda en una
 * línea con su etiqueta, en lugar de esconder columnas tras un scroll lateral.
 * Las etiquetas salen del prop `label` de cada `<Td>`; ver globals.css.
 *
 * `stacked={false}` deja el comportamiento clásico con scroll horizontal, para
 * tablas donde comparar columnas entre filas importa más que leer una fila
 * completa.
 */
export function Table({
  children,
  stackUntil = "md",
}: {
  children: ReactNode;
  /**
   * Ancho por debajo del cual la tabla se apila.
   *
   * `md` (hasta 767px) sirve para tablas de cinco o seis columnas. `lg` (hasta
   * 1023px) es para las anchas: la de clientes tiene diez columnas y a 768px
   * todavía escondía 406px tras el scroll. El umbral depende de cuántas
   * columnas hay, no de un breakpoint único.
   *
   * `none` conserva el scroll horizontal clásico.
   */
  stackUntil?: "md" | "lg" | "none";
}) {
  return (
    <div
      className={cx(
        "surface-panel overflow-x-auto overflow-y-hidden",
        stackUntil === "md" && "stacked-table",
        stackUntil === "lg" && "stacked-table stacked-table-lg",
      )}
    >
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <th
      className={cx(
        "border-b border-border px-4 py-3 text-left text-[0.68rem] font-semibold tracking-[0.08em] text-muted uppercase",
        className,
      )}
    >
      {children}
    </th>
  );
}

/**
 * Celda de datos.
 *
 * `label` es el título de la columna. Se usa cuando la tabla se apila en
 * pantallas angostas: sin él, la celda queda sin contexto y el usuario no sabe
 * qué está leyendo. Una celda de acciones se deja sin `label` a propósito y
 * ocupa el ancho completo.
 */
export function Td({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <td
      data-label={label}
      className={cx("border-b border-border px-4 py-3 align-middle", className)}
    >
      {children}
    </td>
  );
}
