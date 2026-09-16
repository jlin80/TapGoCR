/**
 * Avisos de vencimiento de dominio.
 *
 *   npm run domains:notify            envia
 *   npm run domains:notify -- --dry   solo muestra que haria
 *
 * Pensado para correr una vez al dia desde un temporizador de systemd. Es
 * idempotente: cada dominio recibe un aviso por umbral cruzado (60, 30, 14, 7,
 * 1 dias y vencido), nunca el mismo dos veces.
 *
 * Sin SMTP configurado no falla: informa y no envia nada. Una instalacion sin
 * correo debe seguir operando.
 */
import "dotenv/config";

import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { PrismaClient } from "../src/generated/prisma/client.ts";
import { parseConnectionString } from "../src/lib/database-url.ts";
import { daysUntil, shouldNotify, stageFor } from "../src/lib/domain-expiry.ts";
import {
  NOTIFIABLE_STATUSES,
  noticeBody,
  noticeSubject,
  recipientsOf,
  type NoticeTarget,
} from "../src/lib/domain-notices.ts";
import { mailerConfigured, sendMail } from "../src/lib/mailer.ts";

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(parseConnectionString(process.env.DATABASE_URL!)),
});

const dryRun = process.argv.includes("--dry") || process.argv.includes("--dry-run");

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("Falta DATABASE_URL. Revisá tu archivo .env.");
  }

  const configured = mailerConfigured();

  console.log(`\nAvisos de vencimiento de dominio — ${new Date().toISOString()}`);
  if (dryRun) console.log("  MODO PRUEBA: no se envía ningún correo.");
  if (!configured && !dryRun) {
    console.log("  SMTP no configurado: no se enviará nada.");
    console.log("  Definí SMTP_HOST, SMTP_USER, SMTP_PASSWORD y SMTP_FROM en .env.\n");
  }

  const domains = await prisma.domain.findMany({
    where: {
      expiresAt: { not: null },
      status: { in: [...NOTIFIABLE_STATUSES] },
    },
    orderBy: { expiresAt: "asc" },
    select: {
      id: true,
      domain: true,
      status: true,
      expiresAt: true,
      autoRenew: true,
      lastNoticeStage: true,
      business: {
        select: {
          name: true,
          members: { select: { user: { select: { email: true, active: true } } } },
        },
      },
    },
  });

  let enviados = 0;
  let omitidos = 0;
  let fallidos = 0;

  for (const row of domains) {
    if (!row.expiresAt) continue;

    const daysLeft = daysUntil(row.expiresAt);
    const stage = stageFor(daysLeft);

    if (!shouldNotify(stage, row.lastNoticeStage)) {
      omitidos += 1;
      continue;
    }

    const recipients = recipientsOf(row.business.members);

    if (recipients.length === 0) {
      console.log(`  ! ${row.domain}: sin destinatarios con correo válido`);
      omitidos += 1;
      continue;
    }

    const target: NoticeTarget = {
      domainId: row.id,
      domain: row.domain,
      businessName: row.business.name,
      recipients,
      expiresAt: row.expiresAt,
      daysLeft,
      stage: stage!,
      autoRenew: row.autoRenew,
      status: row.status,
    };

    const subject = noticeSubject(target);

    if (dryRun || !configured) {
      console.log(`  · ${row.domain} → ${recipients.join(", ")}`);
      console.log(`      "${subject}"`);
      continue;
    }

    const result = await sendMail({
      to: recipients.join(", "),
      subject,
      text: noticeBody(target),
    });

    if (result.sent) {
      // El umbral se guarda SOLO si el correo salio. Si fallo, el proximo dia
      // se reintenta en lugar de darlo por avisado.
      await prisma.domain.update({
        where: { id: row.id },
        data: { lastNoticeAt: new Date(), lastNoticeStage: stage },
      });
      console.log(`  ✓ ${row.domain} → ${recipients.join(", ")} (${subject})`);
      enviados += 1;
    } else {
      console.error(`  ✗ ${row.domain}: ${result.reason}`);
      fallidos += 1;
    }
  }

  console.log(
    `\n  ${domains.length} dominios revisados · ${enviados} avisados · ${omitidos} sin cambios · ${fallidos} fallidos\n`,
  );

  // Un fallo de envio debe notarse en el estado del temporizador.
  if (fallidos > 0) process.exitCode = 1;
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(`\n  Error: ${error instanceof Error ? error.message : error}\n`);
    await prisma.$disconnect();
    process.exit(1);
  });
