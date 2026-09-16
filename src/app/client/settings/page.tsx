import type { Metadata } from "next";

import { AccountSettings } from "@/components/account-settings";
import { PageHeader } from "@/components/ui";
import { requireClient } from "@/lib/authz";

export const metadata: Metadata = { title: "Configuración" };

export default async function ClientSettingsPage() {
  const user = await requireClient();

  return (
    <>
      <PageHeader title="Configuración" />
      <AccountSettings email={user.email} />
    </>
  );
}
