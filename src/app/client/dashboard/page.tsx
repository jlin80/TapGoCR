import type { Metadata } from "next";
import Link from "next/link";

import { CopyButton } from "@/components/copy-button";
import { NoBusinessAssigned } from "@/components/no-business";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { QuotaBadge, QuotaBar, QuotaNotice } from "@/components/quota";
import { GroupHeading, StatRail } from "@/components/console";
import { Badge, Card, LinkButton, PageHeader } from "@/components/ui";
import { LinkType, MenuMode } from "@/generated/prisma/enums";
import { getBusinessSummary } from "@/lib/analytics";
import { placaQuotaFor } from "@/lib/chips";
import { getClientContext } from "@/lib/client-context";
import { tagUrl } from "@/lib/config";
import { hasPublishedMenu } from "@/lib/menu";
import { PLAN_LABELS, PLAN_TONES } from "@/lib/plans";
import { prisma } from "@/lib/prisma";

/**
 * Accesos secundarios de "¿Qué querés hacer?": editar menú, ver los puntos
 * TapGo y ver estadísticas. "Editar mi página" es el CTA principal, aparte
 * (ver más abajo) — no uno más de esta rejilla. Antes había 6 atajos, dos de
 * ellos ("Administrar enlaces" y "Cambiar apariencia") llevaban al mismo
 * lugar sin distinción real; ahora "Editar mi página" cubre ambos.
 */
const QUICK_ACTIONS = [
  { href: "/client/menu", icon: "🍽️", label: "Editar menú" },
  { href: "/client/tags", icon: "📍", label: "Mis puntos TapGo" },
  { href: "/client/analytics", icon: "📊", label: "Ver estadísticas" },
] as const;

export const metadata: Metadata = { title: "Dashboard" };

export default async function ClientDashboardPage() {
  const { business } = await getClientContext();

  if (!business) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <NoBusinessAssigned />
      </>
    );
  }

  // En serie a propósito: `getBusinessSummary` y `placaQuotaFor` ya lanzan
  // varias consultas en paralelo cada una.
  const summary = await getBusinessSummary(business.id);
  const quota = await placaQuotaFor(business);
  const tags = await prisma.tag.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, active: true, code: true },
  });

  const activeTag = tags.find((tag) => tag.active) ?? null;
  const activeCount = tags.filter((tag) => tag.active).length;

  // --- Puesta en marcha de la página pública --------------------------------
  // Cubre tanto al negocio dado de alta antes de que el registro pidiera estos
  // datos como al que dejó algún campo vacío a propósito: en los dos casos
  // conviene recordárselo, no solo al recién aprobado.
  const [socialLink, reviewsLink, menuLink, presentation] = await Promise.all([
    prisma.businessLink.findFirst({
      where: {
        businessId: business.id,
        active: true,
        type: { in: [LinkType.INSTAGRAM, LinkType.FACEBOOK, LinkType.TIKTOK] },
      },
      select: { id: true },
    }),
    prisma.businessLink.findFirst({
      where: { businessId: business.id, active: true, type: LinkType.GOOGLE_REVIEWS },
      select: { id: true },
    }),
    prisma.businessLink.findFirst({
      where: { businessId: business.id, active: true, type: LinkType.MENU },
      select: { id: true },
    }),
    prisma.business.findUniqueOrThrow({
      where: { id: business.id },
      select: { menuMode: true, logoUrl: true, address: true, latitude: true, longitude: true },
    }),
  ]);

  const hasNativeMenu =
    presentation.menuMode === MenuMode.NATIVE && (await hasPublishedMenu(business.id));
  const hasLocation = Boolean(
    presentation.address || (presentation.latitude !== null && presentation.longitude !== null),
  );

  return (
    <>
      {/*
        La pregunta que un dueño de local abre esta pantalla para responder es
        una sola: cuánta gente escaneó hoy. Por eso esa cifra es el titular y no
        una tarjeta más en una rejilla de cuatro iguales.
      */}
      {/*
        Saludo + estado + accesos directos: lo primero que responde "¿cómo
        está mi TapGo" y "¿qué puedo hacer ahora", antes de cualquier cifra.
        Las estadísticas siguen abajo — no se perdió nada, solo dejaron de
        ser lo primero que se ve.
      */}
      <header className="mb-8">
        <h1 className="truncate text-[clamp(1.5rem,1.2rem+1vw,2rem)] font-semibold tracking-tight">
          Hola, {business.name} 👋
        </h1>
        <p className="mt-1 flex items-center gap-2 text-muted">
          <span
            aria-hidden="true"
            className={`size-2 rounded-full ${business.active ? "bg-success" : "bg-warning"}`}
          />
          Tu TapGo está {business.active ? "activo" : "desactivado temporalmente"}
        </p>
      </header>

      {!business.active ? (
        <div className="mb-6 rounded-lg bg-warning-soft px-4 py-3 text-sm text-warning">
          Tu negocio está desactivado temporalmente: las landings muestran un aviso.
          Contactá al equipo de TapGoCR.
        </div>
      ) : null}

      <section className="mb-8 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <p className="stat-label">Tu TapGo</p>
          <div className="mt-3 flex items-center gap-2">
            <Badge tone={business.active ? "success" : "warning"}>
              {business.active ? "Activo" : "Desactivado"}
            </Badge>
          </div>
          {activeTag ? (
            <>
              <p className="mt-4 text-sm text-muted">
                <span className="font-medium text-foreground">
                  {activeCount} {activeCount === 1 ? "punto activo" : "puntos activos"}
                </span>{" "}
                · 1 página compartida
              </p>
              <details className="mt-3">
                <summary className="cursor-pointer list-none text-xs font-medium text-brand select-none">
                  Más opciones
                </summary>
                <div className="mt-2 flex flex-col gap-2">
                  <p className="truncate rounded-lg bg-surface-muted px-3 py-2 text-xs text-muted">
                    {tagUrl(activeTag.code)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <LinkButton href={tagUrl(activeTag.code)} target="_blank" rel="noopener noreferrer">
                      Ver página
                    </LinkButton>
                    <CopyButton value={tagUrl(activeTag.code)} label="Copiar enlace" />
                  </div>
                </div>
              </details>
            </>
          ) : (
            <p className="mt-4 text-sm text-muted">
              Todavía no tenés un punto TapGo activo. El equipo de TapGoCR lo
              instala y lo activa por vos.
            </p>
          )}
        </Card>

        <div className="flex flex-col gap-3">
          <Link
            href="/client/profile"
            className="tap-target flex items-center justify-center gap-2 rounded-2xl bg-brand px-6 py-4 text-center font-medium text-brand-contrast transition-colors hover:bg-brand-strong"
          >
            Editar mi página
          </Link>

          <div className="grid grid-cols-3 gap-3">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="tap-target flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-4 text-center transition-colors hover:border-brand/40 hover:bg-surface-muted"
              >
                <span aria-hidden="true" className="text-2xl">
                  {action.icon}
                </span>
                <span className="text-sm font-medium">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <QuotaNotice quota={quota} />

      <OnboardingChecklist
        state={{
          hasLogo: Boolean(presentation.logoUrl),
          hasLocation,
          hasMenu: Boolean(menuLink) || hasNativeMenu,
          hasSocial: Boolean(socialLink),
          hasReviews: Boolean(reviewsLink),
          hasWhatsapp: Boolean(business.whatsapp),
        }}
      />

      <section className="mb-12 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div>
          <p className="stat-label">Escaneos de hoy</p>
          <p className="mt-3 font-[family-name:var(--font-display)] text-[clamp(3.5rem,2rem+9vw,6rem)] leading-none font-extrabold tracking-[-0.04em] tabular-nums">
            {summary.scansToday.toLocaleString("es-CR")}
          </p>
          <p className="mt-3 text-muted">
            {summary.scans7d.toLocaleString("es-CR")} en los últimos 7 días ·{" "}
            {summary.scans30d.toLocaleString("es-CR")} en el mes
          </p>
        </div>

        <Card className="self-start">
          <div className="mb-3 flex items-center justify-between gap-3">
            <Badge tone={PLAN_TONES[business.plan]}>{PLAN_LABELS[business.plan]}</Badge>
            <QuotaBadge quota={quota} />
          </div>
          <QuotaBar quota={quota} />
        </Card>
      </section>

      <section className="mb-12">
        <StatRail
          stats={[
            { label: "Clics este mes", value: summary.clicks30d, href: "/client/analytics" },
            {
              label: "Puntos activos",
              value: summary.tagsActive,
              hint: `de ${summary.tagsTotal} en total`,
              href: "/client/tags",
            },
            { label: "Scans totales", value: summary.scansTotal, hint: "histórico" },
            { label: "Clics totales", value: summary.clicksTotal, hint: "histórico" },
          ]}
        />
      </section>

      <section>
        <GroupHeading
          title="Mis puntos TapGo"
          action={
            <Link href="/client/tags" className="text-sm font-medium text-brand hover:underline">
              Ver detalle
            </Link>
          }
        />
        {tags.length === 0 ? (
          <p className="surface-sunken px-6 py-8 text-center text-sm text-muted">
            Todavía no tenés puntos TapGo. El equipo de TapGoCR los crea y los
            entrega instalados.
          </p>
        ) : (
          <ul className="surface-panel divide-hairline overflow-hidden">
            {tags.map((tag) => (
              <li
                key={tag.id}
                className="flex items-center justify-between gap-4 px-5 py-3.5"
              >
                <span className="min-w-0 truncate font-medium">{tag.name}</span>
                <Badge tone={tag.active ? "success" : "neutral"}>
                  {tag.active ? "Activo" : "Inactivo"}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
