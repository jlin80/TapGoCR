import type { Metadata } from "next";

import { ActionForm } from "@/components/action-form";
import { BusinessFields } from "@/components/business-fields";
import { Card, LinkButton, PageHeader } from "@/components/ui";
import { requireRoot } from "@/lib/authz";
import { createBusiness } from "@/server/business-actions";

export const metadata: Metadata = { title: "Nuevo negocio" };

export default async function NewBusinessPage() {
  await requireRoot();

  return (
    <>
      <PageHeader
        title="Nuevo negocio"
        description="Los tags y los enlaces se agregan después de crearlo."
      />

      <Card className="max-w-3xl">
        <ActionForm
          action={createBusiness}
          submitLabel="Crear negocio"
          pendingLabel="Creando…"
          footer={
            <LinkButton href="/app/businesses" variant="ghost">
              Cancelar
            </LinkButton>
          }
        >
          <BusinessFields />
        </ActionForm>
      </Card>
    </>
  );
}
