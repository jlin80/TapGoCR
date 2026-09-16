/**
 * Pruebas de aislamiento multi-tenant contra un servidor en ejecución.
 *
 *   1. npm run dev        (o npm run build && npm start)
 *   2. npm run db:seed
 *   3. npm run test:e2e
 *
 * Comprueban el criterio de aceptación del panel de cliente: un CLIENT no debe
 * poder alcanzar los datos de otro negocio manipulando la URL.
 */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const ADMIN = {
  email: "admin@tapgocr.com",
  password: process.env.SEED_ADMIN_PASSWORD ?? "TapGoCR-demo-admin",
};
const CLIENT = {
  email: "burgerlab@tapgocr.com",
  password: process.env.SEED_CLIENT_PASSWORD ?? "TapGoCR-demo-client",
};

/** Tags creados por el seed: uno de Burger Lab y otro de Café Central. */
const OWN_TAG_CODE = "A8F3K29X";
const FOREIGN_TAG_CODE = "F7Y4X93M";

type Jar = Map<string, string>;

let serverUp = false;
let clientJar: Jar;
let adminJar: Jar;
let ownTagId = "";
let foreignTagId = "";
let foreignBusinessId = "";

before(async () => {
  serverUp = await isServerUp();
  if (!serverUp) return;

  clientJar = new Map();
  adminJar = new Map();

  await login(clientJar, CLIENT.email, CLIENT.password);
  await login(adminJar, ADMIN.email, ADMIN.password);

  // Los identificadores internos se descubren desde el panel de administración,
  // que es la única superficie que los expone.
  const tagsPage = await request("/app/tags", adminJar);
  const html = await tagsPage.text();

  ownTagId = findTagId(html, OWN_TAG_CODE);
  foreignTagId = findTagId(html, FOREIGN_TAG_CODE);
  foreignBusinessId = findForeignBusinessId(html, foreignTagId);
});

after(() => {
  if (!serverUp) {
    console.warn(
      `\n  Servidor no disponible en ${BASE_URL}: las pruebas e2e se saltaron.\n`,
    );
  }
});

describe("acceso sin sesión", () => {
  it("manda al login desde el panel de cliente", async (t) => {
    if (!serverUp) return t.skip("servidor no disponible");

    const response = await request("/client/dashboard", new Map());
    assert.equal(response.status, 307);
    assert.match(response.headers.get("location") ?? "", /\/login/);
  });

  it("manda al login desde el panel administrativo", async (t) => {
    if (!serverUp) return t.skip("servidor no disponible");

    const response = await request("/app/dashboard", new Map());
    assert.equal(response.status, 307);
    assert.match(response.headers.get("location") ?? "", /\/login/);
  });
});

describe("sesión de CLIENT", () => {
  it("entra a su propio panel", async (t) => {
    if (!serverUp) return t.skip("servidor no disponible");

    const response = await request("/client/dashboard", clientJar);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /Burger Lab/);
  });

  it("no entra al panel administrativo", async (t) => {
    if (!serverUp) return t.skip("servidor no disponible");

    const response = await request("/app/dashboard", clientJar);
    assert.equal(response.status, 307);
    assert.match(response.headers.get("location") ?? "", /\/client\/dashboard/);
  });

  it("no llega a la ficha de otro negocio", async (t) => {
    if (!serverUp) return t.skip("servidor no disponible");

    const response = await request(
      `/app/businesses/${foreignBusinessId}`,
      clientJar,
    );
    assert.equal(response.status, 307);
    assert.match(response.headers.get("location") ?? "", /\/client\/dashboard/);
  });

  it("descarga el QR de su propio tag", async (t) => {
    if (!serverUp) return t.skip("servidor no disponible");

    const response = await request(`/api/tags/${ownTagId}/qr`, clientJar);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "image/png");
  });

  it("recibe 403 al pedir el QR de un tag ajeno", async (t) => {
    if (!serverUp) return t.skip("servidor no disponible");

    // Es la prueba de IDOR: misma ruta, identificador de otro negocio.
    const response = await request(`/api/tags/${foreignTagId}/qr`, clientJar);
    assert.equal(response.status, 403);
  });
});

describe("sesión de ADMIN", () => {
  it("entra a su panel", async (t) => {
    if (!serverUp) return t.skip("servidor no disponible");

    const response = await request("/app/dashboard", adminJar);
    assert.equal(response.status, 200);
  });

  it("accede a cualquier negocio", async (t) => {
    if (!serverUp) return t.skip("servidor no disponible");

    const response = await request(
      `/app/businesses/${foreignBusinessId}`,
      adminJar,
    );
    assert.equal(response.status, 200);
  });

  it("descarga el QR de cualquier tag", async (t) => {
    if (!serverUp) return t.skip("servidor no disponible");

    const response = await request(`/api/tags/${foreignTagId}/qr`, adminJar);
    assert.equal(response.status, 200);
  });
});

describe("server actions", () => {
  it("un CLIENT modifica sus propios enlaces pero no los de otro negocio", async (t) => {
    if (!serverUp) return t.skip("servidor no disponible");

    // El formulario de edición de un enlace usa un server action "atado"
    // (useActionState, vía ActionForm): React lo codifica con
    // $ACTION_REF_/$ACTION_<n>:N/$ACTION_KEY, no con el $ACTION_ID_<hash>
    // simple que usan los botones de subir/bajar/eliminar. `actionIds()` solo
    // reconoce esa segunda forma, así que un bucle que la usara para "probar
    // todas las acciones" terminaba disparando `deleteLink` (la única que solo
    // necesita `linkId`) creyendo que era un interruptor de visibilidad —
    // borraba el enlace sin poder restaurarlo después. Por eso acá se apunta
    // directo al formulario de edición y a los campos reales que ya trae.
    const ownPage = await (await request("/client/business", clientJar)).text();
    const ownLinkId = firstLinkId(ownPage);
    const own = updateLinkForm(ownPage, ownLinkId);

    const foreignPage = await (
      await request(`/app/businesses/${foreignBusinessId}`, adminJar)
    ).text();
    const foreignLinkId = firstLinkId(foreignPage);
    assert.notEqual(ownLinkId, foreignLinkId);

    // Depende de que el primer enlace del negocio se renderice en la landing.
    // Es el caso con los datos del seed; si algún día deja de serlo, la
    // siguiente aserción lo dirá con claridad.
    const before = await landingLabels(OWN_TAG_CODE);

    // Se apaga el enlace propio (desmarcado "active": un checkbox sin marcar
    // no manda su clave) y se comprueba que desaparece de la landing.
    await postBoundAction("/client/business", clientJar, own.fields, {
      linkId: ownLinkId,
      type: own.type,
      label: own.label,
      url: own.url,
    });
    const afterDisable = await landingLabels(OWN_TAG_CODE);
    assert.equal(afterDisable.length, before.length - 1, "el enlace no se desactivó");

    // Se restaura el estado original para no dejar la demo alterada.
    await postBoundAction("/client/business", clientJar, own.fields, {
      linkId: ownLinkId,
      type: own.type,
      label: own.label,
      url: own.url,
      active: "on",
    });
    assert.deepEqual(await landingLabels(OWN_TAG_CODE), before, "no se restauró");

    // Mismos campos del formulario propio, id de otro negocio: no debe completarse.
    const foreignBefore = await landingLabels(FOREIGN_TAG_CODE);
    const status = await postBoundAction("/client/business", clientJar, own.fields, {
      linkId: foreignLinkId,
      type: own.type,
      label: own.label,
      url: own.url,
    });

    assert.notEqual(status, 200, "la acción no debería completarse con datos ajenos");
    assert.deepEqual(
      await landingLabels(FOREIGN_TAG_CODE),
      foreignBefore,
      "un CLIENT modificó los enlaces de otro negocio",
    );
  });
});

describe("sitio comercial", () => {
  it("la raíz es pública y no redirige al login", async (t) => {
    if (!serverUp) return t.skip("servidor no disponible");

    const response = await request("/", new Map());
    assert.equal(response.status, 200);

    // React intercala marcadores de comentario dentro del <h1>, así que se
    // comprueba un fragmento continuo del texto.
    const html = await response.text();
    assert.match(html, /Tu negocio,/);
    assert.match(html, /Registrá tu negocio/);
  });

  it("es la única página indexable", async (t) => {
    if (!serverUp) return t.skip("servidor no disponible");

    const home = await (await request("/", new Map())).text();
    assert.doesNotMatch(home, /name="robots"[^>]*noindex/);

    for (const path of ["/login", `/t/${OWN_TAG_CODE}`]) {
      const html = await (await request(path, new Map())).text();
      assert.match(html, /noindex/, `${path} debería llevar noindex`);
    }
  });
});

describe("formulario de contacto", () => {
  it("guarda la consulta y la muestra en el panel, pero descarta a los robots", async (t) => {
    if (!serverUp) return t.skip("servidor no disponible");

    const home = await (await request("/", new Map())).text();
    const at = home.indexOf("Enviar consulta");
    const start = home.lastIndexOf("<form", at);
    const form = home.slice(start, home.indexOf("</form>", start));
    const fields = hiddenActionFields(form);

    assert.ok(
      Object.keys(fields).length > 0,
      "no se encontró la codificación de la acción del formulario",
    );

    const marker = `prueba-${Date.now()}`;

    // La página es estática, así que la respuesta del POST no trae el estado ya
    // renderizado: se comprueba el efecto real, que es lo que importa.

    // 1. Envío legítimo.
    const sent = await fetch(`${BASE_URL}/`, {
      method: "POST",
      redirect: "manual",
      headers: { Origin: BASE_URL },
      body: formBody({
        ...fields,
        name: "Persona de prueba",
        email: `${marker}@ejemplo.test`,
        businessName: "Negocio de prueba",
        message: `Consulta automatizada ${marker}. Quiero información.`,
      }),
    });
    await sent.arrayBuffer();
    assert.equal(sent.status, 200);

    // 2. Campo trampa completado: no debe guardarse nada.
    const bot = await fetch(`${BASE_URL}/`, {
      method: "POST",
      redirect: "manual",
      headers: { Origin: BASE_URL },
      body: formBody({
        ...fields,
        name: "Robot",
        email: `bot-${marker}@ejemplo.test`,
        message: `Mensaje de robot ${marker} con suficiente longitud.`,
        website: "https://spam.example",
      }),
    });
    await bot.arrayBuffer();
    assert.equal(bot.status, 200);

    // 3. La consulta legítima aparece en el panel; la del robot no.
    const panel = await (await request("/app/leads", adminJar)).text();
    assert.match(panel, new RegExp(`${marker}@ejemplo.test`), "no se guardó la consulta");
    assert.doesNotMatch(
      panel,
      new RegExp(`bot-${marker}@ejemplo.test`),
      "se guardó una consulta con el campo trampa completado",
    );

    // 4. Un CLIENT no puede ver las consultas.
    const forbiddenForClient = await request("/app/leads", clientJar);
    assert.notEqual(forbiddenForClient.status, 200);
  });
});

describe("consola ROOT", () => {
  it("un CLIENT no llega al inventario de chips", async (t) => {
    if (!serverUp) return t.skip("servidor no disponible");

    const response = await request("/app/chips", clientJar);
    assert.equal(response.status, 307);
    assert.match(response.headers.get("location") ?? "", /[/]client[/]dashboard/);
  });

  it("un CLIENT no puede modificar el inventario de chips", async (t) => {
    if (!serverUp) return t.skip("servidor no disponible");

    const page = await (await request("/app/chips", adminJar)).text();
    const actions = actionIds(page);
    const chipId = page.match(/name="chipId" value="([^"]+)"/)?.[1];
    const uid = page.match(/font-mono text-sm font-medium">([^<]+)</)?.[1];

    assert.ok(chipId, "no se encontró ningún chip; ¿corriste el seed?");
    assert.ok(uid, "no se encontró el UID de ningún chip");
    assert.ok(actions.length > 0, "no se encontró ninguna acción en la página");

    for (const action of actions) {
      await postAction("/app/chips", clientJar, action, { chipId });
    }

    const after = await (await request("/app/chips", adminJar)).text();
    assert.ok(after.includes(uid!), "un CLIENT alteró el inventario de chips");
  });

  it("la comparativa de clientes es solo para ROOT", async (t) => {
    if (!serverUp) return t.skip("servidor no disponible");

    assert.equal((await request("/app/clients", adminJar)).status, 200);
    assert.equal((await request("/app/clients", clientJar)).status, 307);
  });
});

describe("landing pública", () => {
  it("responde sin sesión", async (t) => {
    if (!serverUp) return t.skip("servidor no disponible");

    const response = await request(`/t/${OWN_TAG_CODE}`, new Map());
    assert.equal(response.status, 200);
  });

  it("devuelve 404 con un código inexistente", async (t) => {
    if (!serverUp) return t.skip("servidor no disponible");

    const response = await request("/t/ZZZZZZZZZZ", new Map());
    assert.equal(response.status, 404);
  });
});

// ---------------------------------------------------------------------------

async function isServerUp(): Promise<boolean> {
  try {
    await fetch(`${BASE_URL}/login`, { redirect: "manual" });
    return true;
  } catch {
    return false;
  }
}

function request(path: string, jar: Jar): Promise<Response> {
  return fetch(`${BASE_URL}${path}`, {
    redirect: "manual",
    headers: cookieHeader(jar),
  });
}

/** Inicia sesión por el endpoint de Auth.js y guarda las cookies en el jar. */
async function login(jar: Jar, email: string, password: string): Promise<void> {
  const csrfResponse = await fetch(`${BASE_URL}/api/auth/csrf`);
  storeCookies(jar, csrfResponse);
  const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };

  const response = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: "POST",
    redirect: "manual",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      ...cookieHeader(jar),
    },
    body: new URLSearchParams({
      csrfToken,
      identifier: email,
      password,
      callbackUrl: BASE_URL,
    }),
  });

  storeCookies(jar, response);

  const hasSession = [...jar.keys()].some((name) => name.includes("session-token"));
  assert.ok(hasSession, `no se pudo iniciar sesión como ${email}`);
}

function storeCookies(jar: Jar, response: Response): void {
  for (const header of response.headers.getSetCookie()) {
    const [pair] = header.split(";");
    const index = pair.indexOf("=");
    if (index === -1) continue;

    const name = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();

    if (value === "") jar.delete(name);
    else jar.set(name, value);
  }
}

function cookieHeader(jar: Jar): Record<string, string> {
  if (jar.size === 0) return {};
  return {
    Cookie: [...jar].map(([name, value]) => `${name}=${value}`).join("; "),
  };
}

/**
 * Envía una server action como lo haría un navegador sin JavaScript: un POST a
 * la propia página con el identificador de la acción entre los campos.
 */
async function postAction(
  path: string,
  jar: Jar,
  actionId: string,
  fields: Record<string, string>,
): Promise<number> {
  const body = new FormData();
  body.set(`$ACTION_ID_${actionId}`, "");
  for (const [key, value] of Object.entries(fields)) body.set(key, value);

  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    redirect: "manual",
    headers: cookieHeader(jar),
    body,
  });

  // El cuerpo se descarta, pero hay que consumirlo para liberar la conexión.
  await response.arrayBuffer();
  return response.status;
}

/**
 * Envía un server action "atado" (`useActionState`, vía `ActionForm`), cuyos
 * campos ocultos de identificación (`$ACTION_REF_`/`$ACTION_<n>:N`/
 * `$ACTION_KEY`) hay que reenviar tal cual los trae la página, a diferencia de
 * `postAction`, que arma el marcador simple `$ACTION_ID_<hash>` a mano.
 */
async function postBoundAction(
  path: string,
  jar: Jar,
  actionFields: Record<string, string>,
  fields: Record<string, string>,
): Promise<number> {
  const body = new FormData();
  for (const [key, value] of Object.entries(actionFields)) body.set(key, value);
  for (const [key, value] of Object.entries(fields)) body.set(key, value);

  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    redirect: "manual",
    headers: cookieHeader(jar),
    body,
  });

  await response.arrayBuffer();
  return response.status;
}

/**
 * Campos ocultos con los que React codifica una server action en un formulario
 * con estado (`useActionState`), tal como los enviaría un navegador.
 */
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
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&");
}

function formBody(fields: Record<string, string>): FormData {
  const body = new FormData();
  for (const [key, value] of Object.entries(fields)) body.set(key, value);
  return body;
}

function actionIds(html: string): string[] {
  return [
    ...new Set([...html.matchAll(/\$ACTION_ID_([a-f0-9]+)/g)].map((m) => m[1])),
  ];
}

function firstLinkId(html: string): string {
  const match = html.match(/name="linkId" value="([^"]+)"/);
  assert.ok(match, "no se encontró ningún enlace en la página");
  return match[1];
}

/**
 * Campos ocultos y valores actuales del formulario de EDICIÓN de un enlace.
 *
 * Un mismo `linkId` aparece en varios formularios de la fila (subir, bajar,
 * eliminar, editar); el de edición es el único que además declara "type", así
 * que es lo que distingue cuál de las varias apariciones hay que usar.
 */
function updateLinkForm(
  html: string,
  linkId: string,
): { fields: Record<string, string>; type: string; label: string; url: string } {
  const marker = `name="linkId" value="${linkId}"`;
  const indices: number[] = [];
  for (let from = 0; ; ) {
    const index = html.indexOf(marker, from);
    if (index === -1) break;
    indices.push(index);
    from = index + marker.length;
  }
  assert.ok(indices.length > 0, `no se encontró ningún formulario para el enlace ${linkId}`);

  let formHtml = "";
  for (const markerIndex of indices) {
    const formStart = html.lastIndexOf("<form", markerIndex);
    const formEnd = html.indexOf("</form>", markerIndex);
    const candidate = html.slice(formStart, formEnd);
    if (candidate.includes('name="type"')) {
      formHtml = candidate;
      break;
    }
  }
  assert.ok(formHtml, `no se encontró el formulario de edición del enlace ${linkId}`);

  const fields = hiddenActionFields(formHtml);
  const type = formHtml.match(/<option value="([A-Z_]+)" selected/)?.[1];
  assert.ok(type, "no se pudo leer el tipo actual del enlace");
  const label = formHtml.match(/name="label" value="([^"]*)"/)?.[1] ?? "";
  const url = formHtml.match(/name="url" value="([^"]*)"/)?.[1] ?? "";

  return { fields, type, label: decodeEntities(label), url: decodeEntities(url) };
}

/** Etiquetas de los botones que muestra una landing pública. */
async function landingLabels(code: string): Promise<string[]> {
  const html = await (await fetch(`${BASE_URL}/t/${code}`)).text();
  return [...html.matchAll(/<span class="flex-1 text-left">([^<]*)<\/span>/g)].map(
    (m) => m[1],
  );
}

/** Extrae el id interno del tag cuyo código aparece en la tabla de /app/tags. */
function findTagId(html: string, code: string): string {
  const rows = html.split("<tr");
  const row = rows.find((chunk) => chunk.includes(code));
  assert.ok(row, `no se encontró el tag ${code}; ¿corriste el seed?`);

  const match = row.match(/\/app\/tags\/([A-Za-z0-9_-]+)/);
  assert.ok(match, `no se pudo leer el id del tag ${code}`);
  return match[1];
}

function findForeignBusinessId(html: string, foreignTagId: string): string {
  const rows = html.split("<tr");
  const row = rows.find((chunk) => chunk.includes(`/app/tags/${foreignTagId}`));
  assert.ok(row, "no se encontró la fila del tag ajeno");

  const match = row.match(/\/app\/businesses\/([A-Za-z0-9_-]+)/);
  assert.ok(match, "no se pudo leer el id del negocio ajeno");
  return match[1];
}
