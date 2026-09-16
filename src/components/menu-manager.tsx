import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/confirm-button";
import { Badge, Card, Checkbox, EmptyState, Field, Input, Textarea } from "@/components/ui";
import { formatPrice } from "@/lib/price";
import {
  createMenuCategory,
  createMenuItem,
  deleteMenuCategory,
  deleteMenuItem,
  moveMenuCategory,
  toggleMenuItemAvailable,
  updateMenuCategory,
  updateMenuItem,
} from "@/server/menu-actions";

export type ManagedMenuItem = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number | null;
  imageUrl: string | null;
  available: boolean;
  featured: boolean;
};

export type ManagedMenuCategory = {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  items: ManagedMenuItem[];
};

/**
 * Editor del menú digital nativo.
 *
 * Igual que `LinksManager`, lo pueden usar el panel del cliente y el
 * administrativo: las server actions verifican el acceso al negocio en ambos
 * casos, así que compartir el componente no relaja ningún permiso.
 */
export function MenuManager({
  businessId,
  categories,
}: {
  businessId: string;
  categories: ManagedMenuCategory[];
}) {
  return (
    <div className="flex flex-col gap-4">
      {categories.length === 0 ? (
        <EmptyState
          title="Todavía no hay categorías"
          description="Empezá creando «Entradas», «Platos fuertes» o «Bebidas», y después agregá los productos."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {categories.map((category) => (
            <li key={category.id}>
              <CategoryCard category={category} />
            </li>
          ))}
        </ul>
      )}

      <Card>
        <h3 className="mb-3 font-medium">Agregar categoría</h3>
        <ActionForm
          action={createMenuCategory}
          submitLabel="Agregar"
          pendingLabel="Agregando…"
        >
          <input type="hidden" name="businessId" value={businessId} />

          <Field label="Nombre">
            <Input name="name" required maxLength={60} placeholder="Platos fuertes" />
          </Field>

          <Field label="Descripción (opcional)">
            <Input name="description" maxLength={200} placeholder="Servidos con guarnición" />
          </Field>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox name="active" defaultChecked />
            Visible en el menú
          </label>
        </ActionForm>
      </Card>
    </div>
  );
}

function CategoryCard({ category }: { category: ManagedMenuCategory }) {
  const availableCount = category.items.filter((item) => item.available).length;

  return (
    <Card className="p-0">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3">
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{category.name}</span>
            <span className="block truncate text-xs text-muted">
              {category.items.length === 0
                ? "Sin productos"
                : `${availableCount} de ${category.items.length} disponibles`}
            </span>
          </span>

          {!category.active ? <Badge tone="neutral">Oculta</Badge> : null}

          <span
            aria-hidden="true"
            className="text-muted transition-transform group-open:rotate-90"
          >
            &rsaquo;
          </span>
        </summary>

        <div className="border-t border-border px-4 py-4">
          <div className="mb-4 flex flex-wrap gap-2">
            <form action={moveMenuCategory}>
              <input type="hidden" name="categoryId" value={category.id} />
              <input type="hidden" name="direction" value="up" />
              <SubmitButton title="Subir">↑ Subir</SubmitButton>
            </form>

            <form action={moveMenuCategory}>
              <input type="hidden" name="categoryId" value={category.id} />
              <input type="hidden" name="direction" value="down" />
              <SubmitButton title="Bajar">↓ Bajar</SubmitButton>
            </form>

            <form action={deleteMenuCategory}>
              <input type="hidden" name="categoryId" value={category.id} />
              <SubmitButton
                variant="danger"
                confirm={`Se eliminará "${category.name}" y sus ${category.items.length} producto(s). ¿Continuar?`}
              >
                Eliminar categoría
              </SubmitButton>
            </form>
          </div>

          <ActionForm
            action={updateMenuCategory}
            submitLabel="Guardar categoría"
            className="mb-6 flex flex-col gap-3"
          >
            <input type="hidden" name="categoryId" value={category.id} />

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nombre">
                <Input name="name" required maxLength={60} defaultValue={category.name} />
              </Field>

              <Field label="Descripción">
                <Input
                  name="description"
                  maxLength={200}
                  defaultValue={category.description ?? ""}
                />
              </Field>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <Checkbox name="active" defaultChecked={category.active} />
              Visible en el menú
            </label>
          </ActionForm>

          <h4 className="mb-2 text-sm font-semibold text-muted uppercase tracking-wide">
            Productos
          </h4>

          {category.items.length > 0 ? (
            <ul className="mb-4 flex flex-col gap-2">
              {category.items.map((item) => (
                <li key={item.id}>
                  <ItemRow item={item} />
                </li>
              ))}
            </ul>
          ) : null}

          <ActionForm
            action={createMenuItem}
            submitLabel="Agregar producto"
            pendingLabel="Agregando…"
            className="flex flex-col gap-3 rounded-lg border border-dashed border-border p-3"
          >
            <input type="hidden" name="categoryId" value={category.id} />

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nombre">
                <Input name="name" required maxLength={80} placeholder="Casado con pollo" />
              </Field>

              <Field label="Precio" hint="En colones. Dejalo vacío si es precio del día.">
                <Input name="priceCents" inputMode="decimal" placeholder="4500" />
              </Field>
            </div>

            <Field label="Descripción (opcional)">
              <Textarea
                name="description"
                maxLength={300}
                placeholder="Arroz, frijoles, ensalada y plátano maduro"
              />
            </Field>

            <Field label="Imagen (URL, opcional)">
              <Input name="imageUrl" type="url" maxLength={2048} />
            </Field>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox name="available" defaultChecked />
                Disponible
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox name="featured" />
                Destacado en la página principal
              </label>
            </div>
          </ActionForm>
        </div>
      </details>
    </Card>
  );
}

function ItemRow({ item }: { item: ManagedMenuItem }) {
  const price = formatPrice(item.priceCents);

  return (
    <Card className="p-0">
      <details>
        <summary className="flex cursor-pointer list-none items-center gap-3 px-3 py-2.5">
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{item.name}</span>
            {item.description ? (
              <span className="block truncate text-xs text-muted">{item.description}</span>
            ) : null}
          </span>

          {price ? (
            <span className="shrink-0 text-sm font-semibold tabular-nums">{price}</span>
          ) : null}

          {!item.available ? <Badge tone="warning">Agotado</Badge> : null}
          {item.featured ? <Badge tone="info">Destacado</Badge> : null}
        </summary>

        <div className="border-t border-border px-3 py-3">
          <div className="mb-3 flex flex-wrap gap-2">
            <form action={toggleMenuItemAvailable}>
              <input type="hidden" name="itemId" value={item.id} />
              <SubmitButton>
                {item.available ? "Marcar agotado" : "Marcar disponible"}
              </SubmitButton>
            </form>

            <form action={deleteMenuItem}>
              <input type="hidden" name="itemId" value={item.id} />
              <SubmitButton variant="danger" confirm={`¿Eliminar "${item.name}"?`}>
                Eliminar
              </SubmitButton>
            </form>
          </div>

          <ActionForm
            action={updateMenuItem}
            submitLabel="Guardar producto"
            className="flex flex-col gap-3"
          >
            <input type="hidden" name="itemId" value={item.id} />

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nombre">
                <Input name="name" required maxLength={80} defaultValue={item.name} />
              </Field>

              <Field label="Precio">
                <Input
                  name="priceCents"
                  inputMode="decimal"
                  defaultValue={item.priceCents === null ? "" : item.priceCents / 100}
                />
              </Field>
            </div>

            <Field label="Descripción">
              <Textarea
                name="description"
                maxLength={300}
                defaultValue={item.description ?? ""}
              />
            </Field>

            <Field label="Imagen (URL)">
              <Input
                name="imageUrl"
                type="url"
                maxLength={2048}
                defaultValue={item.imageUrl ?? ""}
              />
            </Field>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox name="available" defaultChecked={item.available} />
                Disponible
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox name="featured" defaultChecked={item.featured} />
                Destacado en la página principal
              </label>
            </div>
          </ActionForm>
        </div>
      </details>
    </Card>
  );
}
