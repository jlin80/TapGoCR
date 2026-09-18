import { Tabs } from "@/components/tabs";
import { Badge } from "@/components/ui";
import { requireBusinessAccess } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

/**
 * Marco de la ficha de un negocio.
 *
 * La verificación de acceso vive aquí, de modo que ninguna subpágina pueda
 * olvidarla. Aun así, cada página vuelve a resolver el negocio por su cuenta:
 * un layout no protege a las server actions.
 */
export default async function BusinessLayout({
  children,
  params,
}: LayoutProps<"/app/businesses/[id]">) {
  const { id } = await params;
  await requireBusinessAccess(id);

  const business = await prisma.business.findUniqueOrThrow({
    where: { id },
    select: { name: true, slug: true, active: true },
  });

  const tabs = [
    { href: `/app/businesses/${id}`, label: "Información" },
    { href: `/app/businesses/${id}/tags`, label: "Tags" },
    { href: `/app/businesses/${id}/analytics`, label: "Analytics" },
    { href: `/app/businesses/${id}/feedback`, label: "Feedback" },
    { href: `/app/businesses/${id}/services`, label: "Servicios" },
    { href: `/app/businesses/${id}/domains`, label: "Dominios" },
  ];

  return (
    <>
      <header className="mb-5 print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{business.name}</h1>
          <Badge tone={business.active ? "success" : "neutral"}>
            {business.active ? "Activo" : "Inactivo"}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted">{business.slug}</p>
      </header>

      <div className="mb-8 print:hidden">
        <Tabs items={tabs} />
      </div>

      {children}
    </>
  );
}
