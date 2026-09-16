"use client";

import { useActionState, useRef, useState } from "react";

import {
  Button,
  Card,
  Field,
  Fieldset,
  FieldWide,
  FormError,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import { Industry } from "@/generated/prisma/enums";
import { EMPTY_STATE, type ActionState } from "@/lib/action-state";
import { INDUSTRY_ICONS, INDUSTRY_LABELS } from "@/lib/industry-labels";
import { submitRegistration } from "@/server/registration-actions";

/** El mismo `Industry` que usa `Business.industry`: elegir acá y sugerir después en el panel es el mismo dato, no dos. */
const INDUSTRY_OPTIONS: Array<{ value: Industry; label: string; icon: string }> = Object.values(
  Industry,
).map((value) => ({ value, label: INDUSTRY_LABELS[value], icon: INDUSTRY_ICONS[value] }));

const PROVINCES = [
  "San José",
  "Alajuela",
  "Cartago",
  "Heredia",
  "Guanacaste",
  "Puntarenas",
  "Limón",
];

/** Campos que deben estar completos y válidos antes de pasar al segundo paso. */
const STEP_ONE_FIELDS = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "password",
  "passwordConfirm",
];

/**
 * Alta de cliente en dos pasos.
 *
 * Los campos del segundo paso se ocultan con CSS en lugar de desmontarse: así
 * conservan lo escrito al ir y volver, y el formulario se envía completo de una
 * sola vez. Sin JavaScript se ven los dos pasos seguidos y el envío funciona
 * igual.
 */
export function RegistrationForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    submitRegistration,
    EMPTY_STATE,
  );
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [industry, setIndustry] = useState<Industry | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  if (state.success) {
    return (
      <Card className="text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-success-soft text-success">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-7"
            aria-hidden="true"
          >
            <path d="m5 13 4 4 10-11" />
          </svg>
        </div>
        <h2 className="mt-4 text-xl font-semibold">¡Listo!</h2>
        <p className="mt-2 text-muted">{state.success}</p>
      </Card>
    );
  }

  /** Valida el primer paso con la validación nativa antes de avanzar. */
  const goToStepTwo = () => {
    const form = formRef.current;
    if (!form) return;

    for (const name of STEP_ONE_FIELDS) {
      const field = form.elements.namedItem(name);
      if (field instanceof HTMLInputElement && !field.reportValidity()) return;
    }

    const password = form.elements.namedItem("password");
    const confirm = form.elements.namedItem("passwordConfirm");

    if (
      password instanceof HTMLInputElement &&
      confirm instanceof HTMLInputElement
    ) {
      if (password.value !== confirm.value) {
        confirm.setCustomValidity("Las contraseñas no coinciden.");
        confirm.reportValidity();
        return;
      }
      confirm.setCustomValidity("");
    }

    setStep(2);
  };

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-6">
      <Steps current={step} />

      {industry ? <input type="hidden" name="industry" value={industry} /> : null}

      <Card className={step === 0 ? undefined : "hidden"}>
        <h2 className="mb-1 text-lg font-semibold">¿Qué tipo de negocio tenés?</h2>
        <p className="mb-5 text-sm text-muted">
          Así te sugerimos las secciones y el estilo que mejor le quedan a tu negocio.
        </p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {INDUSTRY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={industry === option.value}
              onClick={() => {
                setIndustry(option.value);
                setStep(1);
              }}
              className={`tap-target flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-colors ${
                industry === option.value
                  ? "border-brand bg-brand/5"
                  : "border-border bg-surface hover:border-brand/40"
              }`}
            >
              <span aria-hidden="true" className="text-2xl">
                {option.icon}
              </span>
              <span className="text-sm font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card className={step === 1 ? undefined : "hidden"}>
        <h2 className="mb-1 text-lg font-semibold">Tus datos</h2>
        <p className="mb-5 text-sm text-muted">
          Con estos datos vas a ingresar a tu panel.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre">
            <Input name="firstName" required maxLength={60} autoComplete="given-name" />
          </Field>

          <Field label="Apellidos">
            <Input name="lastName" required maxLength={60} autoComplete="family-name" />
          </Field>

          <Field label="Correo electrónico">
            <Input
              name="email"
              type="email"
              required
              maxLength={254}
              autoComplete="email"
              placeholder="vos@tunegocio.com"
            />
          </Field>

          <Field label="Teléfono">
            <Input
              name="phone"
              type="tel"
              required
              minLength={8}
              maxLength={40}
              autoComplete="tel"
              placeholder="8888 7777"
            />
          </Field>

          <Field label="Contraseña" hint="Mínimo 12 caracteres.">
            <Input
              name="password"
              type="password"
              required
              minLength={12}
              maxLength={200}
              autoComplete="new-password"
            />
          </Field>

          <Field label="Repetí la contraseña">
            <Input
              name="passwordConfirm"
              type="password"
              required
              minLength={12}
              maxLength={200}
              autoComplete="new-password"
            />
          </Field>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Button type="button" variant="secondary" onClick={() => setStep(0)}>
            Volver
          </Button>
          <Button type="button" onClick={goToStepTwo} className="px-6 py-2.5">
            Continuar
          </Button>
        </div>
      </Card>

      <Card className={step === 2 ? undefined : "hidden"}>
        <h2 className="mb-1 text-lg font-semibold">Tu negocio</h2>
        <p className="mb-5 text-sm text-muted">
          Es lo que va a aparecer en la landing de tus placas.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre del negocio">
            <Input
              name="businessName"
              required
              maxLength={120}
              placeholder="Burger Lab"
            />
          </Field>

          <Field label="Cédula jurídica o física" hint="Opcional. Para facturar.">
            <Input name="legalId" maxLength={40} placeholder="3-101-123456" />
          </Field>

          <div className="sm:col-span-2">
            <Field label="Dirección">
              <Input
                name="address"
                required
                maxLength={200}
                placeholder="Barrio Escalante, 200 m norte del parque"
              />
            </Field>
          </div>

          <Field label="Provincia">
            <Select name="province" required defaultValue="">
              <option value="" disabled>
                Seleccioná una provincia
              </option>
              {PROVINCES.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Cantón" hint="Opcional.">
            <Input name="canton" maxLength={60} />
          </Field>

          <Field label="Código postal" hint="Opcional.">
            <Input name="postalCode" maxLength={20} />
          </Field>

          <div className="sm:col-span-2">
            <Field
              label="¿Qué necesitás?"
              hint="Opcional. Cuántas placas, en qué puntos, si querés dominio o sitio web."
            >
              <Textarea name="notes" maxLength={1000} />
            </Field>
          </div>
        </div>

        <div className="mt-6 border-t border-border pt-6">
          <Fieldset
            legend="Presencia online (opcional)"
            description="Si ya tenés esto, tu placa lo muestra desde el primer día. Lo que dejes vacío lo agregás después desde tu panel."
          >
            <Field label="WhatsApp del negocio" hint="Formato internacional: +506 8888 7777">
              <Input name="whatsapp" maxLength={40} placeholder="+506 8888 7777" />
            </Field>

            <Field label="Instagram">
              <Input
                name="instagramUrl"
                type="url"
                maxLength={2048}
                placeholder="https://instagram.com/tunegocio"
              />
            </Field>

            <Field label="Facebook">
              <Input
                name="facebookUrl"
                type="url"
                maxLength={2048}
                placeholder="https://facebook.com/tunegocio"
              />
            </Field>

            <Field label="Enlace de Google Reviews">
              <Input
                name="googleReviewsUrl"
                type="url"
                maxLength={2048}
                placeholder="https://g.page/r/…"
              />
            </Field>

            <FieldWide>
              <Field
                label="Menú"
                hint="Un enlace o un PDF ya publicado. Si no tenés uno, lo armamos después desde tu panel."
              >
                <Input
                  name="menuUrl"
                  type="url"
                  maxLength={2048}
                  placeholder="https://tunegocio.com/menu.pdf"
                />
              </Field>
            </FieldWide>
          </Fieldset>
        </div>

        {/* Campo trampa: oculto para las personas, tentador para un robot. */}
        <div aria-hidden="true" className="hidden">
          <label>
            No completes este campo
            <input name="website" type="text" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        <FormError>{state.error}</FormError>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Button type="button" variant="secondary" onClick={() => setStep(1)}>
            Volver
          </Button>

          <Button type="submit" disabled={pending} className="px-6 py-2.5">
            {pending ? "Creando cuenta…" : "Crear mi cuenta"}
          </Button>
        </div>
      </Card>
    </form>
  );
}

function Steps({ current }: { current: 0 | 1 | 2 }) {
  const steps = [
    { number: 0 as const, label: "Tu rubro" },
    { number: 1 as const, label: "Tus datos" },
    { number: 2 as const, label: "Tu negocio" },
  ];

  return (
    <ol className="flex items-center gap-3">
      {steps.map((step, index) => {
        const done = current > step.number;
        const active = current === step.number;

        return (
          <li key={step.number} className="flex items-center gap-3">
            <span
              aria-current={active ? "step" : undefined}
              className={`flex items-center gap-2 text-sm font-medium ${
                active || done ? "text-foreground" : "text-muted"
              }`}
            >
              <span
                className={`flex size-7 items-center justify-center rounded-full text-xs font-semibold ${
                  active || done
                    ? "bg-brand text-brand-contrast"
                    : "bg-surface-muted text-muted"
                }`}
              >
                {index + 1}
              </span>
              {step.label}
            </span>

            {index < steps.length - 1 ? (
              <span aria-hidden="true" className="h-px w-8 bg-border sm:w-12" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
