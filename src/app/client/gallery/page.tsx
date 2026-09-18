import type { Metadata } from "next";

import { GalleryManager } from "@/components/gallery-manager";
import { NoBusinessAssigned } from "@/components/no-business";
import { PageHeader } from "@/components/ui";
import { galleryFor } from "@/lib/gallery";
import { primaryBusinessId, requireClient } from "@/lib/authz";

export const metadata: Metadata = { title: "Galería" };

/**
 * Editor de la galería social ("Seguinos").
 *
 * El negocio se deriva de la sesión, igual que el resto del panel del cliente.
 */
export default async function ClientGalleryPage() {
  const user = await requireClient();
  const businessId = await primaryBusinessId(user);

  if (!businessId) {
    return (
      <>
        <PageHeader title="Galería" />
        <NoBusinessAssigned />
      </>
    );
  }

  const posts = await galleryFor(businessId);

  return (
    <>
      <PageHeader
        title="Galería"
        description="Fotos de tus publicaciones, para que tu página muestre tu negocio en vez de mandar directo a Instagram o TikTok."
      />
      <GalleryManager businessId={businessId} posts={posts} />
    </>
  );
}
