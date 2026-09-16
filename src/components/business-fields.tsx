import { Checkbox, Field, FieldWide, Fieldset, Input, Select, Textarea } from "@/components/ui";
import { LandingTheme, Plan } from "@/generated/prisma/enums";
import { PLAN_LABELS, PLAN_TAG_LIMITS } from "@/lib/plans";
import { THEME_LABELS } from "@/lib/theme";

export type BusinessFormValues = {
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  coverUrl: string | null;
  brandColor: string | null;
  accentColor: string | null;
  logoUrl: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  websiteUrl: string | null;
  active: boolean;
  plan: Plan;
  includedTagsOverride: number | null;
  landingTheme: LandingTheme;
};

/**
 * Campos del formulario de negocio, compartidos por el alta y la edición.
 *
 * Agrupados en cuatro bloques. Antes eran catorce campos en una rejilla plana
 * donde el nombre del negocio, unas coordenadas y un color hexadecimal tenían
 * exactamente el mismo peso visual, sin ninguna indicación de para qué servía
 * cada uno. Los grupos responden a la pregunta que se hace quien completa el
 * formulario: quién es, cómo lo contactan, cómo se ve y si está activo.
 */
export function BusinessFields({ values }: { values?: BusinessFormValues }) {
  return (
    <div className="flex flex-col gap-8">
      <Fieldset
        legend="Identidad"
        description="Cómo se llama el negocio y qué es. El nombre y la descripción encabezan su página pública."
      >
        <Field label="Nombre">
          <Input name="name" required maxLength={120} defaultValue={values?.name} />
        </Field>

        <Field
          label="Identificador"
          hint="Interno y único. Solo minúsculas, números y guiones."
        >
          <Input
            name="slug"
            required
            maxLength={80}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            defaultValue={values?.slug}
            placeholder="burger-lab"
          />
        </Field>

        <Field label="Categoría" hint="Ejemplo: Restaurante, Cafetería, Barbería">
          <Input
            name="category"
            maxLength={60}
            defaultValue={values?.category ?? ""}
            placeholder="Restaurante"
          />
        </Field>

        <FieldWide>
          <Field label="Descripción">
            <Textarea
              name="description"
              maxLength={300}
              defaultValue={values?.description ?? ""}
              placeholder="Hamburguesas artesanales en Barrio Escalante"
            />
          </Field>
        </FieldWide>
      </Fieldset>

      <Fieldset
        legend="Contacto y ubicación"
        description="Cada dato que cargues acá genera su botón en la landing. Si lo dejás vacío, el botón no aparece."
      >
        <Field label="Teléfono" hint="Genera el botón «Llamar»">
          <Input name="phone" maxLength={40} defaultValue={values?.phone ?? ""} />
        </Field>

        <Field label="WhatsApp" hint="En formato internacional: +506 8888 7777">
          <Input name="whatsapp" maxLength={40} defaultValue={values?.whatsapp ?? ""} />
        </Field>

        <FieldWide>
          <Field label="Dirección">
            <Input name="address" maxLength={200} defaultValue={values?.address ?? ""} />
          </Field>
        </FieldWide>

        <Field label="Latitud" hint="Con longitud, genera el botón «Cómo llegar»">
          <Input
            name="latitude"
            inputMode="decimal"
            defaultValue={values?.latitude ?? ""}
            placeholder="9.9333"
          />
        </Field>

        <Field label="Longitud">
          <Input
            name="longitude"
            inputMode="decimal"
            defaultValue={values?.longitude ?? ""}
            placeholder="-84.0833"
          />
        </Field>
      </Fieldset>

      <Fieldset
        legend="Presentación"
        description="Lo que define el aspecto de su página pública. El cliente también puede editarlo desde su panel."
      >
        <Field label="Logo (URL)" hint="Cuadrado, mínimo 200×200 px">
          <Input
            name="logoUrl"
            type="url"
            maxLength={2048}
            defaultValue={values?.logoUrl ?? ""}
            placeholder="https://…/logo.png"
          />
        </Field>

        <Field label="Portada (URL)" hint="Horizontal, proporción 16:9">
          <Input
            name="coverUrl"
            type="url"
            maxLength={2048}
            defaultValue={values?.coverUrl ?? ""}
            placeholder="https://…/portada.jpg"
          />
        </Field>

        <Field label="Color principal" hint="Hexadecimal de 6 dígitos">
          <Input
            name="brandColor"
            maxLength={7}
            pattern="#[0-9a-fA-F]{6}"
            defaultValue={values?.brandColor ?? ""}
            placeholder="#0d9488"
          />
        </Field>

        <Field label="Color secundario" hint="Opcional. Se usa al pulsar un botón.">
          <Input
            name="accentColor"
            maxLength={7}
            pattern="#[0-9a-fA-F]{6}"
            defaultValue={values?.accentColor ?? ""}
            placeholder="#0f766e"
          />
        </Field>

        <Field label="Tema de la landing" hint="Define tipografía, formas y espaciado de la página pública.">
          <Select name="landingTheme" defaultValue={values?.landingTheme ?? LandingTheme.MINIMAL}>
            {Object.values(LandingTheme).map((theme) => (
              <option key={theme} value={theme}>
                {THEME_LABELS[theme]}
              </option>
            ))}
          </Select>
        </Field>

        <FieldWide>
          <Field
            label="Sitio web"
            hint="Si se completa, el botón «Sitio web» aparece solo en la landing."
          >
            <Input
              name="websiteUrl"
              type="url"
              maxLength={2048}
              defaultValue={values?.websiteUrl ?? ""}
              placeholder="https://burgerlab.com"
            />
          </Field>
        </FieldWide>
      </Fieldset>

      <Fieldset
        legend="Suscripción"
        description="Se cobra por cantidad de placas activas, no por taps: los taps son siempre ilimitados. Superar las placas incluidas no corta el servicio, solo avisa."
      >
        <FieldWide>
          <Field label="Plan">
            <Select name="plan" defaultValue={values?.plan ?? Plan.LOCAL}>
              {Object.values(Plan).map((plan) => (
                <option key={plan} value={plan}>
                  {PLAN_LABELS[plan]}
                </option>
              ))}
            </Select>
          </Field>
        </FieldWide>

        <FieldWide>
          <Field
            label="Placas incluidas (override)"
            hint={`Dejar vacío usa el tope estándar del plan. CHAIN no tiene tope estándar (${PLAN_TAG_LIMITS.LOCAL} en Local, ${PLAN_TAG_LIMITS.BUSINESS} en Business).`}
          >
            <Input
              name="includedTagsOverride"
              type="number"
              min={0}
              defaultValue={values?.includedTagsOverride ?? ""}
              placeholder="A medida (ej. contratos Chain)"
            />
          </Field>
        </FieldWide>
      </Fieldset>

      <Fieldset
        legend="Estado"
        description="Desactivar apaga todas sus landings sin borrar nada. Los tags siguen instalados."
      >
        <FieldWide>
          <label className="flex items-center gap-2.5 text-sm">
            <Checkbox name="active" defaultChecked={values?.active ?? true} />
            Negocio activo
          </label>
        </FieldWide>
      </Fieldset>
    </div>
  );
}
