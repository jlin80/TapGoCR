import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BusinessAvatar, InactiveTag } from "@/components/landing";
import { FeedbackForm } from "@/components/feedback-form";
import { appName } from "@/lib/config";
import { isPlausibleCode } from "@/lib/landing";
import { prisma } from "@/lib/prisma";
import { themeClasses, landingThemeStyle } from "@/lib/theme";

export const dynamic = "force-dynamic";

async function loadTag(code: string) {
  if (!isPlausibleCode(code)) return null;

  return prisma.tag.findUnique({
    where: { code },
    select: {
      id: true,
      active: true,
      business: {
        select: {
          id: true,
          name: true,
          category: true,
          logoUrl: true,
          brandColor: true,
          accentColor: true,
          landingTheme: true,
          active: true,
        },
      },
    },
  });
}

export async function generateMetadata({
  params,
}: PageProps<"/t/[code]/feedback">): Promise<Metadata> {
  const { code } = await params;
  const tag = await loadTag(code);
  const business = tag?.business;

  // Mismo criterio que la landing principal: nunca indexable, las URLs de tag
  // se reparten por NFC/QR, no por buscadores.
  if (!business || !tag?.active || !business.active) {
    return { title: appName, robots: { index: false, follow: false } };
  }

  return {
    title: `Comparte tu experiencia | ${business.name}`,
    robots: { index: false, follow: false },
  };
}

export default async function FeedbackPage({
  params,
  searchParams,
}: PageProps<"/t/[code]/feedback">) {
  const { code } = await params;
  const source = (await searchParams).s === "qr" ? "qr" : "tap";
  const tag = await loadTag(code);

  if (!tag) notFound();

  const business = tag.business;
  if (!tag.active || !business.active) {
    return <InactiveTag />;
  }

  const theme = themeClasses(business.landingTheme);

  return (
    <main
      style={landingThemeStyle(business.landingTheme, business.brandColor, business.accentColor)}
      className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col px-5 py-10"
    >
      <header className="flex flex-col items-center text-center">
        <BusinessAvatar name={business.name} logoUrl={business.logoUrl} size="size-16" />
        <h1 className={`mt-3 text-xl leading-tight text-balance ${theme.heading}`}>
          {business.name}
        </h1>
        {business.category ? (
          <p className={`mt-1 text-[0.65rem] text-brand ${theme.eyebrow}`}>{business.category}</p>
        ) : null}
      </header>

      <div className="mt-8">
        <FeedbackForm code={code} source={source} businessName={business.name} />
      </div>
    </main>
  );
}
