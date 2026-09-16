import { SectionHeading } from "@/components/marketing";

/**
 * Sección preparada para clientes reales, sin fingir que ya existen. El
 * ejemplo de "Ceniza y Brasa" que se ve en el teléfono del hero y en "Probalo
 * vos mismo" ya está marcado como demo en esos mismos componentes — acá no se
 * repite como si fuera un cliente.
 */
export function TrustSection() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-2xl px-5 py-16 text-center sm:py-20">
        <SectionHeading eyebrow="Negocios que usan TapGoCR" title="Estamos incorporando nuestros primeros negocios." />
      </div>
    </section>
  );
}
