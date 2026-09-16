import { CrossOriginLinkButton } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-5 py-16 text-center">
      <p className="text-sm font-semibold text-muted">Error 404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        No encontramos esta página
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted">
        El enlace puede estar mal escrito o el recurso ya no existe.
      </p>
      {/*
        Esta página puede renderizarse bajo app.{dominio} (un 404 dentro de
        /app o /client) o bajo el dominio raíz: no hay forma de saber cuál al
        escribir el componente. Un <a> normal funciona en los dos casos; un
        <Link> fallaría por CORS en el primero.
      */}
      <CrossOriginLinkButton href="/" className="mt-6">
        Volver al inicio
      </CrossOriginLinkButton>
    </main>
  );
}
