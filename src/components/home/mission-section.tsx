import { SectionHeading } from "@/components/marketing";
import { appName } from "@/lib/config";

/** Qué queremos lograr, en dos párrafos. */
export function MissionSection() {
  return (
    <section className="on-dark border-b border-border">
      <div className="mx-auto max-w-4xl px-5 py-20 sm:py-24 lg:py-28">
        <SectionHeading eyebrow="Nuestra meta" title="Qué queremos lograr" centered={false} />
        <div className="reveal mt-8 flex flex-col gap-5 text-xl text-muted text-pretty">
          <p>
            Que cualquier negocio del país pueda tener una presencia digital seria
            sin depender de alguien más cada vez que cambia un precio.
          </p>
          <p>
            La tecnología ya existe y es barata; lo que falta casi siempre es que
            alguien la instale bien, la explique en simple y responda el teléfono
            cuando algo se rompe. Eso es{" "}
            <span className="text-brand">{appName}</span>: el trabajo técnico lo
            hacemos nosotros y el control queda en manos del negocio.
          </p>
        </div>
      </div>
    </section>
  );
}
