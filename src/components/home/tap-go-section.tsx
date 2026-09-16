/**
 * "TAP → GO", sin depender de texto largo. Animación puramente CSS (dos
 * `@keyframes` en globals.css: `tapgo-pulse` y `tapgo-arrive`), liviana y
 * apagada automáticamente por la regla global de `prefers-reduced-motion`
 * (ver globals.css) — no hay JS de por medio para esto.
 */
export function TapGoSection() {
  return (
    <section className="border-b border-border py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-4xl px-5">
        <div className="grid items-center gap-10 sm:grid-cols-2">
          <div className="reveal flex flex-col items-center text-center sm:items-end sm:text-right">
            <div className="relative flex size-32 items-center justify-center rounded-3xl border-2 border-brand/30 bg-surface-muted">
              {/* Placa: rectángulo con el icono NFC "))" emitiendo ondas. */}
              <svg viewBox="0 0 24 24" fill="none" className="size-12 text-brand" aria-hidden="true">
                <rect x="4" y="4" width="10" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
                <path
                  d="M16 9c1 1 1 5 0 6M19 7c2 2 2 8 0 10"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  className="tapgo-pulse"
                />
              </svg>
            </div>
            <p className="mt-5 text-2xl font-semibold tracking-tight">TAP</p>
            <p className="mt-1 text-muted">Acercá tu teléfono.</p>
          </div>

          <div className="reveal reveal-2 flex flex-col items-center text-center sm:items-start sm:text-left">
            <div className="tapgo-arrive relative flex size-32 items-center justify-center rounded-3xl border-2 border-brand bg-brand/10">
              {/* Teléfono con la acción ya abierta. */}
              <svg viewBox="0 0 24 24" fill="none" className="size-12 text-brand" aria-hidden="true">
                <rect x="6" y="2" width="12" height="20" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
                <path d="M9 8h6M9 12h6M9 16h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </div>
            <p className="mt-5 text-2xl font-semibold tracking-tight">GO</p>
            <p className="mt-1 text-muted">Llegá directamente a donde querés.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
