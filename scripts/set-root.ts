/**
 * Crea o actualiza la cuenta ROOT de TapGoCR.
 *
 *   npm run root:set
 *
 * Pide el usuario y la contraseña por teclado, sin dejarlos en el historial del
 * shell ni en ningún archivo. La contraseña no se muestra al escribirla ni se
 * escribe en los logs.
 *
 * El usuario por defecto es `root`, sin arroba. La cuenta ROOT es del equipo de
 * TapGoCR y no recibe correo del sistema, así que exigirle un correo válido no
 * aportaba nada y obligaba a inventar una dirección. Los clientes sí se
 * registran con su correo real, y esa validación no cambia.
 *
 * Es idempotente: si la cuenta ya existe, actualiza la contraseña y se asegura
 * de que el rol sea ROOT y de que esté activa. Sirve tanto para el alta inicial
 * como para recuperar el acceso si se pierde la contraseña.
 *
 * Para despliegues automatizados existen las variables ROOT_USER y
 * ROOT_PASSWORD, que evitan la interacción.
 */
import "dotenv/config";

import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";

import { PrismaClient } from "../src/generated/prisma/client.ts";
import { UserRole } from "../src/generated/prisma/enums.ts";
import { normalizeClientCode } from "../src/lib/client-code.ts";
import { parseConnectionString } from "../src/lib/database-url.ts";

const BCRYPT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 12;

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(parseConnectionString(process.env.DATABASE_URL!)),
});

/** Lee una línea ocultando lo que se escribe. */
async function askHidden(question: string): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdout, terminal: true });

  // `readline` no trae entrada oculta: se silencia la salida mientras dura la
  // pregunta, de modo que el eco de las teclas no aparezca en pantalla.
  const originalWrite = stdout.write.bind(stdout);
  let muted = false;

  stdout.write = ((chunk: unknown, ...rest: unknown[]) => {
    if (muted) return true;
    return (originalWrite as (...args: unknown[]) => boolean)(chunk, ...rest);
  }) as typeof stdout.write;

  const pending = rl.question(question);
  muted = true;

  try {
    return (await pending).trim();
  } finally {
    muted = false;
    stdout.write = originalWrite;
    originalWrite(String.fromCharCode(10));
    rl.close();
  }
}

async function ask(question: string, fallback?: string): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const answer = (await rl.question(question)).trim();
    return answer || fallback || "";
  } finally {
    rl.close();
  }
}

const DEFAULT_ROOT_USER = "root";

/**
 * Identificador de la cuenta ROOT.
 *
 * Se admiten dos formas: un usuario simple como `root` o un correo completo,
 * por si preferís usar uno. Lo que no se admite es cualquier cosa: el valor
 * viaja en el formulario de login y se guarda en la columna única de usuarios,
 * así que se acota a letras, dígitos y los separadores habituales.
 *
 * El mínimo son 3 caracteres porque es lo que exige el esquema del login: uno
 * más corto crearía una cuenta imposible de usar.
 */
function isValidRootIdentifier(value: string): boolean {
  if (value.length < 3 || value.length > 254) return false;

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
  const isUsername = /^[a-z0-9][a-z0-9._-]*$/.test(value);

  return isEmail || isUsername;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("Falta DATABASE_URL. Revisá tu archivo .env.");
  }

  const existing = await prisma.user.findFirst({
    where: { role: UserRole.ROOT },
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true },
  });

  console.log("\nCuenta ROOT de TapGoCR");
  console.log(
    existing
      ? `  Cuenta actual: ${existing.email}\n`
      : "  Todavía no hay ninguna cuenta ROOT.\n",
  );

  // ROOT_EMAIL se mantiene por compatibilidad con despliegues que ya la usaban.
  const envUser = (process.env.ROOT_USER ?? process.env.ROOT_EMAIL)?.trim();
  const envPassword = process.env.ROOT_PASSWORD;
  const nonInteractive = Boolean(envUser && envPassword);

  const fallback = existing?.email ?? DEFAULT_ROOT_USER;

  const email = (
    nonInteractive
      ? envUser!
      : await ask(`Usuario de la cuenta ROOT [${fallback}]: `, fallback)
  )
    .trim()
    .toLowerCase();

  if (!isValidRootIdentifier(email)) {
    throw new Error(
      `"${email}" no sirve como usuario. Usá letras, dígitos, punto, guion o guion bajo (por ejemplo: root), o un correo completo.`,
    );
  }

  // Un identificador con forma de código de cliente lo interpreta el login como
  // tal y lo busca en otra columna, así que la cuenta nunca podria iniciar
  // sesion. Se rechaza acá en lugar de crear una cuenta rota.
  if (normalizeClientCode(email)) {
    throw new Error(
      `"${email}" tiene forma de código de cliente (TGC-0001) y el login lo interpretaría como tal. Elegí otro usuario.`,
    );
  }

  let password: string;

  if (nonInteractive) {
    password = envPassword!;
  } else {
    password = await askHidden("Contraseña nueva: ");
    const confirmation = await askHidden("Repetila: ");

    if (password !== confirmation) {
      throw new Error("Las contraseñas no coinciden.");
    }
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
    );
  }

  // Si el identificador ya pertenece a una cuenta de cliente, no se la convierte
  // en ROOT por accidente: sería una escalada de privilegios silenciosa.
  const taken = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });

  if (taken && taken.role !== UserRole.ROOT) {
    throw new Error(
      `"${email}" ya pertenece a una cuenta de cliente. Usá otro usuario.`,
    );
  }

  const name = existing
    ? undefined
    : nonInteractive
      ? "Equipo TapGoCR"
      : await ask("Nombre para mostrar [Equipo TapGoCR]: ", "Equipo TapGoCR");

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: UserRole.ROOT, active: true },
    create: {
      email,
      name: name ?? "Equipo TapGoCR",
      role: UserRole.ROOT,
      passwordHash,
    },
    select: { email: true, createdAt: true, updatedAt: true },
  });

  const created = user.createdAt.getTime() === user.updatedAt.getTime();

  console.log(
    `\n  ${created ? "Cuenta ROOT creada" : "Contraseña actualizada"}: ${user.email}`,
  );

  // Si el usuario cambió, la cuenta anterior queda sin uso: conviene avisarlo en
  // lugar de dejar dos cuentas ROOT en silencio.
  if (existing && existing.email !== email) {
    console.log(
      `\n  Atención: la cuenta ${existing.email} sigue existiendo y sigue siendo ROOT.`,
    );
    console.log("  Suspendela desde el panel si ya no la vas a usar.");
  }

  console.log("\n  Ingresá en /login con ese usuario.\n");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(`\n  Error: ${error instanceof Error ? error.message : error}\n`);
    await prisma.$disconnect();
    process.exit(1);
  });
