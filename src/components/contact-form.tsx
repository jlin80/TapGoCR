"use client";

import { useActionState } from "react";

import { Button, Field, FormError, Input, Textarea } from "@/components/ui";
import { EMPTY_STATE } from "@/lib/action-state";
import { submitContact } from "@/server/contact-actions";

/**
 * Formulario de contacto del sitio comercial.
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
        <Field label="Tu nombre">
          <Input name="name" required maxLength={120} autoComplete="name" />
        </Field>

        <Field label="Nombre del negocio">
          <Input
            name="businessName"
            maxLength={120}
            autoComplete="organization"
            placeholder="Opcional"
          />
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

        <Field label="Teléfono">
          <Input
            name="phone"
            type="tel"
            maxLength={40}
            autoComplete="tel"
            placeholder="Opcional"
          />
        </Field>
      </div>

      <div className="mt-4">
        <Field label="¿Qué necesitás?">
          <Textarea
            name="message"
            required
            minLength={10}
            maxLength={2000}
            rows={4}
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
