import { CrossOriginLinkButton } from "@/components/ui";

export default function Forbidden() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-5 py-16 text-center">
      <p className="text-sm font-semibold text-danger">Error 403</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Acceso denegado</h1>
      <p className="mt-2 max-w-md text-sm text-muted">
        Tu cuenta no tiene permiso para ver este recurso. Si creés que se trata de un
        error, contactá al equipo de TapGoCR.
      </p>
      {/* Ver el comentario en not-found.tsx: puede renderizarse bajo app.{dominio}. */}
      <CrossOriginLinkButton href="/" className="mt-6">
        Volver al inicio
      </CrossOriginLinkButton>
    </main>
  );
}
