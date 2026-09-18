import type { Metadata } from "next";

import { ActionForm } from "@/components/action-form";
import { BusinessFields } from "@/components/business-fields";
import { SubmitButton } from "@/components/confirm-button";
import { GalleryManager } from "@/components/gallery-manager";
import { LinksManager } from "@/components/links-manager";
import { MenuManager } from "@/components/menu-manager";
import { Badge, Card, Field, Select } from "@/components/ui";
import { BusinessRole, UserRole } from "@/generated/prisma/enums";
import { requireBusinessAccess } from "@/lib/authz";
import { galleryFor } from "@/lib/gallery";
import { manageableMenu } from "@/lib/menu";
import { prisma } from "@/lib/prisma";
import { updateBusiness, toggleBusinessActive } from "@/server/business-actions";
import { assignUserToBusiness, removeUserFromBusiness } from "@/server/user-actions";

export const metadata: Metadata = { title: "Información del negocio" };

const ROLE_LABELS: Record<BusinessRole, string> = {
  OWNER: "Propietario",
  MANAGER: "Gestor",
  VIEWER: "Solo lectura",
};

export default async function BusinessDetailPage({
  params,
}: PageProps<"/app/businesses/[id]">) {
  const { id } = await params;
  await requireBusinessAccess(id);

  const [business, assignableUsers, menuCategories, socialPosts] = await Promise.all([
    prisma.business.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        category: true,
        industry: true,
        coverUrl: true,
        brandColor: true,
        accentColor: true,
        logoUrl: true,
        phone: true,
        whatsapp: true,
        address: true,
        latitude: true,
        longitude: true,
        websiteUrl: true,
        active: true,
        plan: true,
        includedTagsOverride: true,
        landingTheme: true,
        links: {
          orderBy: [{ position: "asc" }, { createdAt: "asc" }],
          select: { id: true, type: true, label: true, url: true, active: true },
        },
        members: {
          orderBy: { createdAt: "asc" },
          select: {
            role: true,
            user: { select: { id: true, name: true, email: true, active: true } },
          },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: UserRole.CLIENT },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
    manageableMenu(id),
    galleryFor(id),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="mb-3 text-lg font-semibold">Datos del negocio</h2>
        <Card>
          <ActionForm
            action={updateBusiness}
            submitLabel="Guardar cambios"
            footer={
              <form action={toggleBusinessActive}>
                <input type="hidden" name="businessId" value={business.id} />
                <SubmitButton
                  variant={business.active ? "danger" : "secondary"}
                  confirm={
                    business.active
                      ? "Desactivar el negocio apaga todas sus landings. ¿Continuar?"
                      : undefined
                  }
                >
                  {business.active ? "Desactivar negocio" : "Reactivar negocio"}
                </SubmitButton>
              </form>
            }
          >
            <input type="hidden" name="businessId" value={business.id} />
            <BusinessFields values={business} businessId={business.id} />
          </ActionForm>
        </Card>
      </section>

      <section>
        <h2 className="mb-1 text-lg font-semibold">Enlaces de la landing</h2>
        <p className="mb-3 text-sm text-muted">
          Es lo que ve quien acerca el teléfono al NFC o escanea el QR.
        </p>
        <LinksManager businessId={business.id} links={business.links} />
      </section>

      <section>
        <h2 className="mb-1 text-lg font-semibold">Menú digital</h2>
        <p className="mb-3 text-sm text-muted">
          Solo se muestra en la landing si el negocio tiene el menú en modo «Menú
          digital de TapGoCR».
        </p>
        <MenuManager businessId={business.id} categories={menuCategories} />
      </section>

      <section>
        <h2 className="mb-1 text-lg font-semibold">Galería</h2>
        <p className="mb-3 text-sm text-muted">
          Fotos de Instagram/TikTok cargadas a mano, para que la página no
          mande al cliente fuera de TapGo sin volver.
        </p>
        <GalleryManager businessId={business.id} posts={socialPosts} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Usuarios con acceso</h2>

        <Card className="mb-4 p-0">
          {business.members.length === 0 ? (
            <p className="px-5 py-4 text-sm text-muted">
              Ningún cliente tiene acceso todavía.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {business.members.map((member) => (
                <li
                  key={member.user.id}
                  className="flex flex-wrap items-center gap-3 px-5 py-3"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{member.user.name}</span>
                    <span className="block text-xs text-muted">{member.user.email}</span>
                  </span>

                  <Badge tone="info">{ROLE_LABELS[member.role]}</Badge>
                  {!member.user.active ? <Badge tone="neutral">Suspendido</Badge> : null}

                  <form action={removeUserFromBusiness}>
                    <input type="hidden" name="userId" value={member.user.id} />
                    <input type="hidden" name="businessId" value={business.id} />
                    <SubmitButton
                      variant="danger"
                      confirm={`¿Quitar el acceso de ${member.user.email}?`}
                    >
                      Quitar acceso
                    </SubmitButton>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h3 className="mb-3 font-medium">Asignar un usuario existente</h3>
          <ActionForm action={assignUserToBusiness} submitLabel="Asignar">
            <input type="hidden" name="businessId" value={business.id} />

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Usuario">
                <Select name="userId" required defaultValue="">
                  <option value="" disabled>
                    Seleccioná un usuario
                  </option>
                  {assignableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} — {user.email}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Rol en el negocio">
                <Select name="role" defaultValue={BusinessRole.OWNER}>
                  {Object.values(BusinessRole).map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </ActionForm>
        </Card>
      </section>
    </div>
  );
}
