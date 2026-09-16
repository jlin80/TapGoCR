"use client";

import { useActionState } from "react";

import { Button, Field, FormError, Input, Select, Textarea } from "@/components/ui";
import { Industry } from "@/generated/prisma/enums";
import { EMPTY_STATE } from "@/lib/action-state";
import { INDUSTRY_LABELS } from "@/lib/industry-labels";
import { submitContact } from "@/server/contact-actions";

/** Mismas metas que el selector "¿Qué querés conseguir?" de la home — un solo lugar con la lista. */
const GOALS = [
  "Más reseñas",
  "Más mensajes por WhatsApp",
  "Compartir mi menú",
  "Mostrar mis redes",
  "Facilitar pagos",
  "Tener varias acciones",
  "Otra cosa",
];

/**
 * Formulario de contacto del sitio comercial — es el camino corto de venta:
 * "Vos elegís qué querés, nosotros lo configuramos" no puede empezar con un
 * formulario largo. Rubro y objetivo alcanzan para que el equipo prepare una
 * propuesta; el mensaje libre queda como opcional, no como paso obligatorio.
 *
 * Al enviarse con éxito reemplaza el formulario por la confirmación, en lugar
 * de dejar los campos llenos invitando a mandar lo mismo otra vez.
 */
export function ContactForm() {
  const [state, action, pending] = useActionState(submitContact, EMPTY_STATE);

  if (state.success) {
    return (
      <div className="rounded-2xl border border-brand bg-surface p-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand text-brand-contrast">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-6"
            aria-hidden="true"
          >
            <path d="m5 13 4 4 10-11" />
          </svg>
        </div>
        <p className="mt-4 text-lg font-semibold">{state.success}</p>
        <p className="mt-1 text-sm text-muted">
          Normalmente respondemos el mismo día.
        </p>
      </div>
    );
  }

  return (
    <form
      action={action}
      className="rounded-2xl border border-border bg-surface p-6 text-left shadow-sm sm:p-8"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="¿Qué tipo de negocio tenés?">
          <Select name="industry" defaultValue="">
            <option value="">Elegí una opción</option>
            {Object.values(Industry).map((industry) => (
              <option key={industry} value={industry}>
                {INDUSTRY_LABELS[industry]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="¿Qué querés conseguir?">
          <Select name="goal" defaultValue="">
            <option value="">Elegí una opción</option>
            {GOALS.map((goal) => (
              <option key={goal} value={goal}>
                {goal}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Tu nombre">
          <Input name="name" required maxLength={120} autoComplete="name" />
        </Field>

        <Field label="Correo">
          <Input
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
          />
        </Field>

        <Field label="WhatsApp" hint="Opcional, si preferís que te escribamos ahí.">
          <Input name="phone" type="tel" maxLength={40} autoComplete="tel" />
        </Field>

        <Field label="Nombre del negocio" hint="Opcional.">
          <Input name="businessName" maxLength={120} autoComplete="organization" />
        </Field>
      </div>

      <div className="mt-4">
        <Field label="Contanos más (opcional)">
          <Textarea
            name="message"
            maxLength={2000}
            rows={3}
            placeholder="Tengo un restaurante con 12 mesas y quiero que los clientes vean el menú desde el celular…"
          />
        </Field>
      </div>

      {/* Campo trampa: invisible para personas, tentador para robots. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 overflow-hidden">
        <label>
          No completar este campo
          <input name="website" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="mt-4">
        <FormError>{state.error}</FormError>
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="mt-4 w-full px-5 py-3 text-base"
      >
        {pending ? "Enviando…" : "Enviar consulta"}
      </Button>

      <p className="mt-3 text-center text-xs text-muted">
        Usamos tus datos únicamente para responderte. No los compartimos con nadie.
      </p>
    </form>
  );
}
