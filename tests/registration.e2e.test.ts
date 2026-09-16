/**
 * Flujo de alta pública contra un servidor en ejecución.
 *
 *   1. npm run dev   (o npm run build && npm start)
 *   2. npm run db:seed
 *   3. npm run test:e2e
 *
 * Comprueba el criterio central: registrarse crea la cuenta al instante y da
 * acceso de inmediato, con la contraseña que la persona eligió al registrarse
 * — no queda pendiente de que ROOT la apruebe a mano.
 *
 * A diferencia de las otras pruebas, esta habla directamente con la base para
 * limpiar lo que crea. Sin eso, cada corrida dejaría un cliente de más.
 */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { PrismaClient } from "../src/generated/prisma/client.ts";
import { parseConnectionString } from "../src/lib/database-url.ts";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const ROOT = {
  email: "admin@tapgocr.com",
  password: process.env.SEED_ADMIN_PASSWORD ?? "TapGoCR-demo-admin",
};

/** Datos de la solicitud de prueba. El dominio .test nunca es real. */
const APPLICANT = {
  firstName: "Ana",
  lastName: "Prueba Automatizada",
  email: "registro.e2e@ejemplo.test",
  phone: "88880000",
  password: "Registro-E2E-2026",
  businessName: "Soda de Prueba E2E",
  address: "100 m sur de la iglesia",
  province: "Cartago",
};

// Pool mínimo: la prueba solo hace consultas sueltas de preparación y limpieza,
// y no tiene sentido que compita por conexiones con el servidor que está
// probando.
const prisma = new PrismaClient({
  adapter: new PrismaMariaDb({
    ...parseConnectionString(process.env.DATABASE_URL!),
    connectionLimit: 2,
    idleTimeout: 5,
  }),
});

type Jar = Map<string, string>;

let serverUp = false;
let rootJar: Jar;

before(async () => {
  serverUp = await isServerUp();
  if (!serverUp) return;

  await cleanUp();

  rootJar = new Map();
  await login(rootJar, ROOT.email, ROOT.password);
});

after(async () => {
  if (serverUp) await cleanUp();
  await prisma.$disconnect();

  if (!serverUp) {
    console.warn(`\n  Servidor no disponible en ${BASE_URL}: pruebas saltadas.\n`);
  }
});

describe("registro público", () => {
  it("la página de alta es pública", async (t) => {
    if (!serverUp) return t.skip("servidor no disponible");

    const response = await request("/registro", new Map());
    assert.equal(response.status, 200);
    assert.match(await response.text(), /Registrá tu negocio/);
  });

  it("registrarse crea la cuenta al instante y permite iniciar sesión", async (t) => {
    if (!serverUp) return t.skip("servidor no disponible");

    const status = await submitRegistration(APPLICANT);
    assert.equal(status, 200);

    const registration = await prisma.registration.findUnique({
      where: { email: APPLICANT.email },
      select: { status: true, businessName: true },
    });

    assert.ok(registration, "no se guardó la solicitud");
    assert.equal(registration.status, "APPROVED");
    assert.equal(registration.businessName, APPLICANT.businessName);

    const user = await prisma.user.findUnique({
      where: { email: APPLICANT.email },
      select: { clientCode: true, role: true, memberships: true },
    });

    assert.ok(user, "el registro debería crear la cuenta de una vez");
    assert.equal(user.role, "CLIENT");
    assert.match(user.clientCode ?? "", /^TGC-\d{4}$/, "no se asignó código de cliente");
    assert.equal(user.memberships.length, 1, "no quedó vinculada a un negocio");

    const jar: Jar = new Map();
    await login(jar, APPLICANT.email, APPLICANT.password);
    assert.equal(hasSession(jar), true, "debería poder iniciar sesión de inmediato");

    const dashboard = await request("/client/dashboard", jar);
    assert.equal(dashboard.status, 200);
    assert.match(await dashboard.text(), new RegExp(APPLICANT.businessName));
  });

  it("no acepta dos veces el mismo correo", async (t) => {
    if (!serverUp) return t.skip("servidor no disponible");

    await submitRegistration(APPLICANT);

    const count = await prisma.registration.count({
      where: { email: APPLICANT.email },
    });
    assert.equal(count, 1, "se duplicó la solicitud");
  });

  it("descarta el envío de un robot que completa el campo trampa", async (t) => {
    if (!serverUp) return t.skip("servidor no disponible");

    const email = "robot.e2e@ejemplo.test";
    await submitRegistration({ ...APPLICANT, email }, { website: "https://spam.test" });

    const registration = await prisma.registration.findUnique({
      where: { email },
      select: { id: true },
    });
    assert.equal(registration, null, "se guardó un envío de robot");
  });
});

describe("aprobación manual (respaldo)", () => {
  it("un CLIENT no llega a las solicitudes de alta", async (t) => {
    if (!serverUp) return t.skip("servidor no disponible");

    const clientJar: Jar = new Map();
    await login(
      clientJar,
      "burgerlab@tapgocr.com",
      process.env.SEED_CLIENT_PASSWORD ?? "TapGoCR-demo-client",
    );

    const response = await request("/app/registrations", clientJar);
    assert.equal(response.status, 307);
  });

  it("también puede entrar con su código de cliente", async (t) => {
    if (!serverUp) return t.skip("servidor no disponible");

    const user = await prisma.user.findUnique({
      where: { email: APPLICANT.email },
      select: { clientCode: true },
    });

    if (!user?.clientCode) return t.skip("el alta automática no llegó a ejecutarse");

    const jar: Jar = new Map();
    await login(jar, user.clientCode, APPLICANT.password);
    assert.equal(hasSession(jar), true, "el código de cliente debería servir");
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

/** Borra todo lo que la prueba pueda haber creado, en orden de dependencia. */
async function cleanUp(): Promise<void> {
  const emails = [APPLICANT.email, "robot.e2e@ejemplo.test"];

  const users = await prisma.user.findMany({
    where: { email: { in: emails } },
    select: { id: true },
  });

  const businesses = await prisma.business.findMany({
    where: { name: APPLICANT.businessName },
    select: { id: true },
  });

  await prisma.registration.deleteMany({ where: { email: { in: emails } } });
  await prisma.business.deleteMany({
    where: { id: { in: businesses.map((b) => b.id) } },
  });
  await prisma.user.deleteMany({ where: { id: { in: users.map((u) => u.id) } } });
}

function request(path: string, jar: Jar): Promise<Response> {
  return fetch(`${BASE_URL}${path}`, {
    redirect: "manual",
    headers: cookieHeader(jar),
  });
}

async function submitRegistration(
  applicant: typeof APPLICANT,
  extra: Record<string, string> = {},
): Promise<number> {
  const page = await (await request("/registro", new Map())).text();
  const action = actionFields(page);
  assert.ok(
    Object.keys(action).length > 0,
    "no se encontró la acción del formulario de registro",
  );

  const body = new FormData();
  for (const [key, value] of Object.entries(action)) body.set(key, value);
  body.set("firstName", applicant.firstName);
  body.set("lastName", applicant.lastName);
  body.set("email", applicant.email);
  body.set("phone", applicant.phone);
  body.set("password", applicant.password);
  body.set("passwordConfirm", applicant.password);
  body.set("businessName", applicant.businessName);
  body.set("address", applicant.address);
  body.set("province", applicant.province);
  for (const [key, value] of Object.entries(extra)) body.set(key, value);

  const response = await fetch(`${BASE_URL}/registro`, {
    method: "POST",
    redirect: "manual",
    headers: { Origin: BASE_URL },
    body,
  });

  await response.arrayBuffer();
  return response.status;
}

async function login(jar: Jar, identifier: string, password: string): Promise<void> {
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
      identifier,
      password,
      callbackUrl: BASE_URL,
    }),
  });

  storeCookies(jar, response);
}

function hasSession(jar: Jar): boolean {
  return [...jar.keys()].some((name) => name.includes("session-token"));
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
 * Campos ocultos con los que React codifica una server action.
 *
 * Los formularios con `useActionState` no usan `$ACTION_ID_`, sino una
 * referencia repartida en varios campos. Se reenvían tal cual llegan.
 */
function actionFields(formHtml: string): Record<string, string> {
  const fields: Record<string, string> = {};

  // Se recorre el HTML sin expresiones regulares: los nombres traen `$` y las
  // etiquetas se autocierran, y escapar todo eso es más frágil que buscar los
  // atributos a mano.
  for (const chunk of formHtml.split("<input").slice(1)) {
    const name = attribute(chunk, "name");
    if (!name || !name.startsWith("$ACTION")) continue;
    fields[name] = attribute(chunk, "value") ?? "";
  }

  return fields;
}

/** Valor de un atributo dentro del fragmento de una etiqueta. */
function attribute(chunk: string, name: string): string | null {
  const marker = ` ${name}="`;
  const at = chunk.indexOf(marker);
  if (at === -1) return null;

  const start = at + marker.length;
  const end = chunk.indexOf('"', start);

  return end === -1 ? null : decodeEntities(chunk.slice(start, end));
}

function decodeEntities(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&");
}

