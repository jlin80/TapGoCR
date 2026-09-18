import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/confirm-button";
import { LinkIcon } from "@/components/link-icon";
import { Card, EmptyState, Field, Input, Select } from "@/components/ui";
import { LinkType } from "@/generated/prisma/enums";
import { LINK_TYPE_LABELS } from "@/lib/link-types";
import { createSocialPost, deleteSocialPost, moveSocialPost } from "@/server/gallery-actions";

/** Sin PDF a propósito: una foto de galería es siempre una imagen. */
const IMAGE_UPLOAD_ACCEPT = "image/png,image/jpeg,image/webp";

/** Solo tiene sentido marcar el ícono de una red con presencia visual real. */
const PLATFORM_OPTIONS = [LinkType.INSTAGRAM, LinkType.TIKTOK, LinkType.FACEBOOK] as const;

export type ManagedSocialPost = {
  id: string;
  imageUrl: string;
  linkUrl: string | null;
  platform: LinkType | null;
};

/**
 * Editor de la galería social ("Seguinos").
 *
 * Igual que `MenuManager`/`LinksManager`, lo pueden usar el panel del cliente
 * y el administrativo: las server actions verifican el acceso al negocio en
 * ambos casos.
 */
export function GalleryManager({
  businessId,
  posts,
}: {
  businessId: string;
  posts: ManagedSocialPost[];
}) {
  return (
    <div className="flex flex-col gap-4">
      {posts.length === 0 ? (
        <EmptyState
          title="Todavía no hay fotos"
          description="Subí capturas de tus publicaciones para que tu página se sienta viva, sin mandar a tu cliente a Instagram sin volver."
        />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {posts.map((post) => (
            <li key={post.id}>
              <PostCard post={post} />
            </li>
          ))}
        </ul>
      )}

      <Card>
        <h3 className="mb-3 font-medium">Agregar foto</h3>
        <ActionForm action={createSocialPost} submitLabel="Subir foto" pendingLabel="Subiendo…">
          <input type="hidden" name="businessId" value={businessId} />

          <Field label="Foto" hint="JPG, PNG o WEBP.">
            <Input type="file" name="file" required accept={IMAGE_UPLOAD_ACCEPT} />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Red (opcional)" hint="Solo define qué ícono se muestra sobre la foto.">
              <Select name="platform" defaultValue="">
                <option value="">Sin ícono</option>
                {PLATFORM_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {LINK_TYPE_LABELS[type]}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Enlace (opcional)" hint="A dónde va si tocan la foto. Podés dejarlo vacío.">
              <Input name="linkUrl" type="url" maxLength={2048} placeholder="https://instagram.com/tu_negocio/p/..." />
            </Field>
          </div>
        </ActionForm>
      </Card>
    </div>
  );
}

function PostCard({ post }: { post: ManagedSocialPost }) {
  return (
    <Card className="flex flex-col gap-2 p-2">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-surface-muted">
        {/* eslint-disable-next-line @next/next/no-img-element -- misma razón que BusinessCover: URL de un archivo propio, sin necesidad de configurar dominios remotos. */}
        <img src={post.imageUrl} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
        {post.platform ? (
          <span className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-surface/90 text-brand shadow-sm">
            <LinkIcon type={post.platform} className="size-3.5" />
          </span>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-1">
        <div className="flex gap-1">
          <form action={moveSocialPost}>
            <input type="hidden" name="postId" value={post.id} />
            <input type="hidden" name="direction" value="up" />
            <SubmitButton className="px-2 py-1 text-xs" title="Mover antes">
              ↑
            </SubmitButton>
          </form>
          <form action={moveSocialPost}>
            <input type="hidden" name="postId" value={post.id} />
            <input type="hidden" name="direction" value="down" />
            <SubmitButton className="px-2 py-1 text-xs" title="Mover después">
              ↓
            </SubmitButton>
          </form>
        </div>

        <form action={deleteSocialPost}>
          <input type="hidden" name="postId" value={post.id} />
          <SubmitButton variant="danger" className="px-2 py-1 text-xs" confirm="¿Eliminar esta foto?">
            Eliminar
          </SubmitButton>
        </form>
      </div>
    </Card>
  );
}
