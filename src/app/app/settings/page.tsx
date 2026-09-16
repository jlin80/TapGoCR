import type { Metadata } from "next";

import { AccountSettings } from "@/components/account-settings";
import { DiscordSettingsPanel } from "@/components/discord-settings-panel";
import { EmailSettingsPanel } from "@/components/email-settings-panel";
import { PageHeader } from "@/components/ui";
import { requireRoot } from "@/lib/authz";

export const metadata: Metadata = { title: "Configuración" };

export default async function AdminSettingsPage() {
  const user = await requireRoot();

  return (
    <>
      <PageHeader title="Configuración" />
      <div className="flex flex-col gap-6">
        <AccountSettings email={user.email} showPlatformInfo />
        <DiscordSettingsPanel />
        <EmailSettingsPanel />
      </div>
    </>
  );
}
