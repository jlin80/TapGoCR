import { EmptyState } from "@/components/ui";
import { appName } from "@/lib/config";

/** Estado para una cuenta de cliente que todavía no tiene negocio asignado. */
export function NoBusinessAssigned() {
  return (
    <EmptyState
      title="Tu cuenta todavía no tiene un negocio asignado"
      description={`Escribinos y el equipo de ${appName} la vincula a tu negocio.`}
    />
  );
}
