import type { Metadata } from "next";

import { MenuManager } from "@/components/menu-manager";
import { NoBusinessAssigned } from "@/components/no-business";
import { Card, PageHeader } from "@/components/ui";
import { MenuMode } from "@/generated/prisma/enums";
import { primaryBusinessId, requireClient } from "@/lib/authz";
import { manageableMenu } from "@/lib/menu";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Menú digital" };

/**
 * Editor del menú digital nativo.
 *
 * El negocio se deriva de la sesión, igual que el resto del panel del cliente.
 */
export default async function ClientMenuPage() {
  const user = await requireClient();
  const businessId = await primaryBusinessId(user);

  if (!businessId) {
    return (
      <>
        <PageHeader title="Menú digital" />
        <NoBusinessAssigned />
      </>
    );
  }

  const [business, categories] = await Promise.all([
    prisma.business.findUniqueOrThrow({
      where: { id: businessId },
      select: { menuMode: true },
    }),
    manageableMenu(businessId),
  ]);

  return (
    <>
      <PageHeader
        title="Menú digital"
        description="Cargá tu carta acá y se muestra directamente en tu página pública, sin PDF ni enlaces externos."
      />

      {business.menuMode !== MenuMode.NATIVE ? (
        <Card className="mb-6 border-warning bg-warning-soft">
          <p className="text-sm text-warning">
            Podés cargar la carta, pero todavía no se muestra: tu página está
            configurada para abrir un enlace o PDF. Cambiá el menú a «Menú digital de
            TapGoCR» en <strong>Mi página pública</strong> cuando esté lista.
          </p>
        </Card>
      ) : null}

      <MenuManager businessId={businessId} categories={categories} />
    </>
  );
}
