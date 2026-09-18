/**
 * Feedback interno + puente a Google Reviews, contra un servidor en ejecución.
 *
 *   1. npm run dev        (o npm run build && npm start)
 *   2. npm run db:seed
 *   3. npm run test:e2e
 *
 * Mismas convenciones que `authorization.e2e.test.ts`: sesión por cookie jar,
 * y los formularios con `useActionState` se envían reenviando tal cual los
 * campos ocultos `$ACTION_*` que la página trae.
 */
import assert from "node:assert/strict";
import { before, describe, it } from "node:test";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const CLIENT = {
  email: "burgerlab@tapgocr.com",
  password: process.env.SEED_CLIENT_PASSWORD ?? "TapGoCR-demo-client",
};

/** Placa de Burger Lab (ver `prisma/seed.ts`), que sí tiene un enlace de Google Reviews configurado. */
const OWN_TAG_CODE = "A8F3K29X";

type Jar = Map<string, string>;

let serverUp = false;
let clientJar: Jar;

before(async () => {
  serverUp = await isServerUp();
  if (!serverUp) return;

  clientJar = new Map();
  await login(clientJar, CLIENT.email, CLIENT.password);
});

describe("página pública de feedback", () => {
  it("carga con la marca del negocio y es noindex", async (t) => {
    if (!serverUp) return t.skip("servidor no disponible");

    const response = await request(`/t/${OWN_TAG_CODE}/feedback`, new Map());
    assert.equal(response.status, 200);

    const html = await response.text();
    assert.match(html, /noindex/);
    assert.match(html, /Burger Lab/);
    assert.match(html, /¿Cómo fue tu experiencia\?/);
    // Las 5 estrellas son accesibles: cada una trae su propio aria-label.
    for (const n of [1, 2, 3, 4, 5]) {
      assert.match(html, new RegExp(`aria-label="${n} estrella`));
    }
  });

  it("el botón de reseñas de la landing lleva al feedback, no directo a Google", async (t) => {
    if (!serverUp) return t.skip("servidor no disponible");

    const html = await (await request(`/t/${OWN_TAG_CODE}`, new Map())).text();
    assert.match(html, new RegExp(`/t/${OWN_TAG_CODE}/feedback`));
    assert.doesNotMatch(html, /g\.page\/r\/burgerlab-demo/);
  });
});

describe("envío de feedback", () => {
  it("guarda el feedback y ofrece Google para cualquier calificación (sin review gating)", async (t) => {
    if (!serverUp) return t.skip("servidor no disponible");

    const before = await feedbackTotal(clientJar);

    for (const rating of [1, 5]) {
      const page = await (await request(`/t/${OWN_TAG_CODE}/feedback`, new Map())).text();
      const actionFields = hiddenActionFields(page);
      assert.ok(Object.keys(actionFields).length > 0, "no se encontró la acción del formulario");

      const marker = `prueba-e2e-${Date.now()}-${rating}`;
      const body = formBody({
        ...actionFields,
        code: OWN_TAG_CODE,
        source: "tap",
        rating: String(rating),
        comment: marker,
      });

      const response = await fetch(`${BASE_URL}/t/${OWN_TAG_CODE}/feedback`, {
        method: "POST",
        redirect: "manual",
        headers: { Origin: BASE_URL },
        body,
      });
      const html = await response.text();

      assert.equal(response.status, 200, `rating ${rating}: el envío no se completó`);
      // Nunca se afirma que la reseña quedó publicada: solo que se puede publicar.
      assert.doesNotMatch(html, /reseña fue publicada/i);
      assert.match(
        html,
        /Publicar en Google/,
        `rating ${rating}: debería ofrecer Google sin importar la calificación`,
      );
      assert.match(html, new RegExp(marker), "el comentario no se muestra tal cual se escribió");
    }

    const after = await feedbackTotal(clientJar);
    assert.equal(after, before + 2, "no se guardaron las dos respuestas de feedback");
  });

  it("rechaza una calificación fuera de 1-5", async (t) => {
    if (!serverUp) return t.skip("servidor no disponible");

    const page = await (await request(`/t/${OWN_TAG_CODE}/feedback`, new Map())).text();
    const actionFields = hiddenActionFields(page);

    for (const rating of ["0", "6"]) {
      const response = await fetch(`${BASE_URL}/t/${OWN_TAG_CODE}/feedback`, {
        method: "POST",
        redirect: "manual",
        headers: { Origin: BASE_URL },
        body: formBody({ ...actionFields, code: OWN_TAG_CODE, source: "tap", rating, comment: "" }),
      });
      const html = await response.text();
      assert.doesNotMatch(html, /¡Gracias por tu opinión!/, `rating ${rating} no debería aceptarse`);
    }
  });

  it("descarta el envío de un robot que completa el campo trampa", async (t) => {
    if (!serverUp) return t.skip("servidor no disponible");

    const before = await feedbackTotal(clientJar);

    const page = await (await request(`/t/${OWN_TAG_CODE}/feedback`, new Map())).text();
    const actionFields = hiddenActionFields(page);
    const response = await fetch(`${BASE_URL}/t/${OWN_TAG_CODE}/feedback`, {
      method: "POST",
      redirect: "manual",
      headers: { Origin: BASE_URL },
      body: formBody({
        ...actionFields,
        code: OWN_TAG_CODE,
        source: "tap",
        rating: "5",
        comment: "",
        website: "http://spam.example",
      }),
    });
    await response.arrayBuffer();

    const after = await feedbackTotal(clientJar);
    assert.equal(after, before, "el envío del robot no debería guardarse");
  });
});

describe("dashboard de feedback", () => {
  it("un negocio no ve el feedback de otro (mismo aislamiento que analytics)", async (t) => {
    if (!serverUp) return t.skip("servidor no disponible");

    const response = await request("/client/feedback", new Map());
    assert.equal(response.status, 307);
    assert.match(response.headers.get("location") ?? "", /\/login/);
  });
});

// ---------------------------------------------------------------------------

async function isServerUp(): Promise<boolean> {
  try {
    const response = await fetch(BASE_URL, { redirect: "manual" });
    await response.arrayBuffer();
    return true;
  } catch {
    return false;
  }
}

async function request(path: string, jar: Jar): Promise<Response> {
  const response = await fetch(`${BASE_URL}${path}`, {
    redirect: "manual",
    headers: cookieHeader(jar),
  });
  storeCookies(jar, response);
  return response;
}

async function login(jar: Jar, email: string, password: string): Promise<void> {
  const csrfResponse = await fetch(`${BASE_URL}/api/auth/csrf`);
  storeCookies(jar, csrfResponse);
  const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };

  const response = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: "POST",
    redirect: "manual",
    headers: { "Content-Type": "application/x-www-form-urlencoded", ...cookieHeader(jar) },
    body: new URLSearchParams({ csrfToken, identifier: email, password, callbackUrl: BASE_URL }),
  });
  storeCookies(jar, response);
  await response.arrayBuffer();
}

/** Lee "Total de respuestas" del panel de feedback del cliente. */
async function feedbackTotal(jar: Jar): Promise<number> {
  const html = await (await request("/client/feedback", jar)).text();
  const at = html.indexOf("Total de respuestas");
  assert.ok(at >= 0, "no se encontró la cifra de feedback en el panel");
  const match = html.slice(at, at + 200).match(/stat-value[^>]*>([\d.,]+)</);
  assert.ok(match, "no se pudo leer el total de respuestas");
  return Number(match[1].replace(/[.,]/g, ""));
}

function cookieHeader(jar: Jar): Record<string, string> {
  if (jar.size === 0) return {};
  return { Cookie: [...jar].map(([name, value]) => `${name}=${value}`).join("; ") };
}

function storeCookies(jar: Jar, response: Response): void {
  for (const pair of response.headers.getSetCookie?.() ?? []) {
    const [nameValue] = pair.split(";");
    const index = nameValue.indexOf("=");
    if (index === -1) continue;
    const name = nameValue.slice(0, index).trim();
    const value = nameValue.slice(index + 1).trim();
    if (value === "") jar.delete(name);
    else jar.set(name, value);
  }
}

function hiddenActionFields(formHtml: string): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const match of formHtml.matchAll(
    /<input type="hidden" name="(\$ACTION[^"]*)"(?: value="([^"]*)")?\/>/g,
  )) {
    fields[decodeEntities(match[1])] = decodeEntities(match[2] ?? "");
  }
  return fields;
}

function decodeEntities(value: string): string {
  return value.replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, "&");
}

function formBody(fields: Record<string, string>): FormData {
  const body = new FormData();
  for (const [key, value] of Object.entries(fields)) body.set(key, value);
  return body;
}
