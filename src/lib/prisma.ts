import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { PrismaClient } from "@/generated/prisma/client";
import { parseConnectionString } from "@/lib/database-url";

/**
 * Cliente Prisma único por proceso. En desarrollo Next.js recarga los módulos,
 * por lo que se reutiliza la instancia guardada en globalThis para no agotar el
 * pool de conexiones.
 */
function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Falta DATABASE_URL. Copiá .env.example a .env y completala.");
  }

  // Se acota el pool a propósito. Sin tope, varias páginas pesadas en paralelo
  // abren decenas de conexiones y el servidor las cierra: el síntoma es un 500
  // con "Server has closed the connection". Con este tope, las consultas hacen
  // cola en la aplicación en lugar de tumbar la base.
  const poolMax = Number(process.env.DATABASE_POOL_MAX ?? 5);

  return new PrismaClient({
    adapter: new PrismaMariaDb({
      ...parseConnectionString(connectionString),
      connectionLimit: poolMax,
      // Muchos servidores MySQL/MariaDB cierran las conexiones ociosas por su
      // cuenta. Si el pool las conserva más tiempo que el servidor, entrega
      // una conexión ya muerta y la petición falla. Reciclándolas antes,
      // siempre se entrega una viva.
      idleTimeout: 10,
      connectTimeout: 10_000,
    }),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
