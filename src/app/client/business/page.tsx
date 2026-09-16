import type { Metadata } from "next";
import Link from "next/link";

import { LinksManager } from "@/components/links-manager";
import { NoBusinessAssigned } from "@/components/no-business";
import { Card, PageHeader } from "@/components/ui";
import { getClientContext } from "@/lib/client-context";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Mi negocio" };

export default async function ClientBusinessPage() {
  const { business } = await getClientContext();

  if (!business) {
    return (
      <>
        <PageHeader title="Mi negocio" />
        <NoBusinessAssigned />
      </>
    );
  }

  const links = await prisma.businessLink.findMany({
    where: { businessId: business.id },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: { id: true, type: true, label: true, url: true, active: true },
  });

  return (
    <>
      <PageHeader
        title="Mi negocio"
        description="Los datos de contacto los administra TapGoCR; los enlaces los administrás vos."
      />

      <div className="flex flex-col gap-8">
        <section>
          <h2 className="mb-3 text-lg font-semibold">Información</h2>
          <Card>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail label="Nombre" value={business.name} />
              <Detail label="Descripción" value={business.description} />
              <Detail label="Teléfono" value={business.phone} />
              <Detail label="WhatsApp" value={business.whatsapp} />
              <Detail label="Dirección" value={business.address} />
              <Detail label="Sitio web" value={business.websiteUrl} />
            </dl>
            <p className="mt-4 text-xs text-muted">
              ¿Necesitás cambiar algo de esta información? Abrí una solicitud y el
              equipo de TapGoCR la actualiza.
            </p>
          </Card>
        </section>

        <section>
          <h2 className="mb-1 text-lg font-semibold">Mis enlaces</h2>
          <p className="mb-3 text-sm text-muted">
            Es lo que ven tus clientes al acercar el teléfono al NFC o escanear el QR.
            Los cambios se aplican al instante, sin reprogramar nada. El resto de la
            apariencia —logo, portada, colores— se administra en{" "}
            <Link
              href="/client/profile"
              className="font-medium text-brand underline underline-offset-2"
            >
              Mi página pública
            </Link>
            .
          </p>
          <LinksManager businessId={business.id} links={links} />
        </section>
      </div>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 break-words">{value || "—"}</dd>
    </div>
  );
}
