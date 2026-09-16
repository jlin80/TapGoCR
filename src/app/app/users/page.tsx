import type { Metadata } from "next";
import Link from "next/link";

import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/confirm-button";
import {
  Badge,
  Card,
  Field,
  Input,
  PageHeader,
  Select,
  Table,
  Td,
  Th,
} from "@/components/ui";
import { UserRole } from "@/generated/prisma/enums";
import { requireRoot } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import {
  createClientUser,
  resetClientPassword,
  toggleUserActive,
} from "@/server/user-actions";

export const metadata: Metadata = { title: "Usuarios" };

export default async function UsersPage() {
  const root = await requireRoot();

  const [users, businesses] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        memberships: {
          select: { business: { select: { id: true, name: true } } },
        },
      },
    }),
    prisma.business.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const clients = users.filter((user) => user.role === UserRole.CLIENT);

  return (
    <>
      <PageHeader
        title="Usuarios"
        description="Cuentas de acceso. No existe registro público: las cuentas las crea TapGoCR."
      />

      <div className="flex flex-col gap-6">
        <Table>
          <thead>
            <tr>
              <Th>Usuario</Th>
              <Th>Rol</Th>
              <Th>Negocios</Th>
              <Th>Estado</Th>
              <Th>Acciones</Th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <Td label="Usuario">
                  <span className="block font-medium">{user.name}</span>
                  <span className="block text-xs text-muted">{user.email}</span>
                </Td>
                <Td label="Rol">
                  <Badge tone={user.role === UserRole.ROOT ? "info" : "neutral"}>
                    {user.role === UserRole.ROOT ? "Root" : "Cliente"}
                  </Badge>
                </Td>
                <Td label="Negocios">
                  {user.role === UserRole.ROOT ? (
                    <span className="text-xs text-muted">Todos</span>
                  ) : user.memberships.length === 0 ? (
                    <span className="text-xs text-muted">Sin asignar</span>
                  ) : (
                    <span className="flex flex-wrap gap-1">
                      {user.memberships.map((membership) => (
                        <Link
                          key={membership.business.id}
                          href={`/app/businesses/${membership.business.id}`}
                          className="text-xs text-brand hover:underline"
                        >
                          {membership.business.name}
                        </Link>
                      ))}
                    </span>
                  )}
                </Td>
                <Td label="Estado">
                  <Badge tone={user.active ? "success" : "danger"}>
                    {user.active ? "Activa" : "Suspendida"}
                  </Badge>
                </Td>
                <Td>
                  {user.id === root.id ? (
                    <span className="text-xs text-muted">Tu cuenta</span>
                  ) : (
                    <form action={toggleUserActive}>
                      <input type="hidden" name="userId" value={user.id} />
                      <SubmitButton
                        confirm={
                          user.active
                            ? `¿Suspender el acceso de ${user.email}?`
                            : undefined
                        }
                      >
                        {user.active ? "Suspender" : "Reactivar"}
                      </SubmitButton>
                    </form>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>

        <Card className="max-w-2xl">
          <h3 className="mb-1 font-medium">Nueva cuenta de cliente</h3>
          <p className="mb-3 text-sm text-muted">
            Entregá la contraseña inicial por un canal seguro y pedile al cliente que
            la cambie desde Configuración.
          </p>

          <ActionForm action={createClientUser} submitLabel="Crear cuenta">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nombre">
                <Input name="name" required maxLength={120} placeholder="Burger Lab" />
              </Field>

              <Field label="Correo">
                <Input
                  name="email"
                  type="email"
                  required
                  maxLength={254}
                  placeholder="burgerlab@tapgocr.com"
                />
              </Field>
            </div>

            <Field label="Contraseña inicial" hint="Mínimo 12 caracteres.">
              <Input name="password" type="text" required minLength={12} maxLength={200} />
            </Field>

            <Field label="Negocio asignado" hint="Opcional: se puede asignar después.">
              <Select name="businessId" defaultValue="">
                <option value="">Sin asignar</option>
                {businesses.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name}
                  </option>
                ))}
              </Select>
            </Field>
          </ActionForm>
        </Card>

        {clients.length > 0 ? (
          <Card className="max-w-2xl">
            <h3 className="mb-1 font-medium">Restablecer contraseña de un cliente</h3>
            <p className="mb-3 text-sm text-muted">
              Para cuando un cliente pierde la suya. Tu propia contraseña se cambia
              desde Configuración.
            </p>

            <ActionForm action={resetClientPassword} submitLabel="Restablecer">
              <Field label="Cuenta">
                <Select name="userId" required defaultValue="">
                  <option value="" disabled>
                    Seleccioná una cuenta
                  </option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} — {client.email}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Nueva contraseña" hint="Mínimo 12 caracteres.">
                <Input
                  name="password"
                  type="text"
                  required
                  minLength={12}
                  maxLength={200}
                />
              </Field>
            </ActionForm>
          </Card>
        ) : null}
      </div>
    </>
  );
}
