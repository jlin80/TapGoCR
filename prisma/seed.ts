/**
 * Datos de demostración de TapGoCR.
 *
 * Es idempotente: se puede ejecutar varias veces sobre la misma base sin
 * duplicar nada. Los eventos de analytics sí se regeneran en cada corrida para
 * que las gráficas muestren siempre los últimos 30 días.
 *
 * Las contraseñas son de demostración y están documentadas en el README.
 * Nunca deben usarse en un entorno real: definí SEED_ADMIN_PASSWORD y
 * SEED_CLIENT_PASSWORD si necesitás otras.
 */
import "dotenv/config";

import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";

import { PrismaClient } from "../src/generated/prisma/client.ts";
import { parseConnectionString } from "../src/lib/database-url.ts";
import {
  ChipModel,
  ChipStatus,
  DeviceType,
  DomainStatus,
  EventSource,
  LinkType,
  MenuMode,
  Plan,
  RequestPriority,
  RequestStatus,
  RequestType,
  ScanEventType,
  ServiceStatus,
  ServiceType,
  UserRole,
} from "../src/generated/prisma/enums.ts";

const DEMO_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "TapGoCR-demo-admin";
const DEMO_CLIENT_PASSWORD = process.env.SEED_CLIENT_PASSWORD ?? "TapGoCR-demo-client";

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(parseConnectionString(process.env.DATABASE_URL!)),
});

const TAGS = [
  { name: "Mesa 1", code: "A8F3K29X", locationLabel: "Salón principal" },
  { name: "Mesa 2", code: "B4M7P52T", locationLabel: "Salón principal" },
  { name: "Mesa 3", code: "C9R2H86V", locationLabel: "Salón principal" },
  { name: "Barra", code: "D5T8N34Q", locationLabel: "Barra" },
  { name: "Entrada", code: "E2W6J71Z", locationLabel: "Entrada" },
];

const LINKS: Array<{ type: LinkType; label: string; url: string }> = [
  { type: LinkType.MENU, label: "Ver menú", url: "https://burgerlab.example/menu.pdf" },
  { type: LinkType.WHATSAPP, label: "WhatsApp", url: "https://wa.me/50688887777" },
  {
    type: LinkType.INSTAGRAM,
    label: "Instagram",
    url: "https://instagram.com/burgerlab",
  },
  { type: LinkType.TIKTOK, label: "TikTok", url: "https://tiktok.com/@burgerlab" },
  { type: LinkType.FACEBOOK, label: "Facebook", url: "https://facebook.com/burgerlab" },
  {
    type: LinkType.GOOGLE_REVIEWS,
    label: "Dejanos tu reseña",
    url: "https://g.page/r/burgerlab-demo/review",
  },
  {
    type: LinkType.GOOGLE_MAPS,
    label: "Cómo llegar",
    url: "https://maps.google.com/?q=9.9333,-84.0833",
  },
  { type: LinkType.WEBSITE, label: "Sitio web", url: "https://burgerlab.example" },
];

/** Peso relativo de cada destino en los clicks simulados. */
const CLICK_WEIGHTS: Array<[LinkType, number]> = [
  [LinkType.MENU, 44],
  [LinkType.WHATSAPP, 18],
  [LinkType.INSTAGRAM, 12],
  [LinkType.GOOGLE_MAPS, 9],
  [LinkType.GOOGLE_REVIEWS, 7],
  [LinkType.TIKTOK, 4],
  [LinkType.FACEBOOK, 3],
  [LinkType.WEBSITE, 3],
];

const DEVICE_WEIGHTS: Array<[DeviceType, number]> = [
  [DeviceType.IPHONE, 52],
  [DeviceType.ANDROID, 41],
  [DeviceType.DESKTOP, 5],
  [DeviceType.UNKNOWN, 2],
];

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.SEED_ALLOW_PRODUCTION !== "true") {
    throw new Error(
      "El seed crea cuentas con contraseñas de demostración públicas y no debe " +
        "correr en producción. Para la cuenta real usá: npm run root:set. " +
        "Si de verdad querés datos de demostración acá, definí SEED_ALLOW_PRODUCTION=true.",
    );
  }

  console.log("Sembrando datos de demostración de TapGoCR…");

  const admin = await prisma.user.upsert({
    where: { email: "admin@tapgocr.com" },
    update: {},
    create: {
      email: "admin@tapgocr.com",
      name: "Equipo TapGoCR",
      role: UserRole.ROOT,
      passwordHash: await bcrypt.hash(DEMO_ADMIN_PASSWORD, 12),
    },
  });

  const client = await prisma.user.upsert({
    where: { email: "burgerlab@tapgocr.com" },
    update: {},
    create: {
      email: "burgerlab@tapgocr.com",
      name: "Burger Lab",
      role: UserRole.CLIENT,
      passwordHash: await bcrypt.hash(DEMO_CLIENT_PASSWORD, 12),
    },
  });

  const business = await prisma.business.upsert({
    where: { slug: "burger-lab" },
    update: {},
    create: {
      slug: "burger-lab",
      name: "Burger Lab",
      description: "Hamburguesas artesanales en Barrio Escalante",
      category: "Restaurante",
      brandColor: "#c1121f",
      // Burger Lab se queda en modo enlace: su botón de menú abre el PDF. El
      // menú digital nativo lo demuestra Café Central, más abajo. Así la demo
      // enseña las dos opciones sin que ningún negocio tenga las dos a la vez,
      // que sería una configuración contradictoria.
      plan: Plan.BUSINESS,
      ownerId: client.id,
      phone: "+506 8888 7777",
      whatsapp: "+506 8888 7777",
      address: "Barrio Escalante, San José, Costa Rica",
      latitude: 9.9333,
      longitude: -84.0833,
      websiteUrl: "https://burgerlab.example",
    },
  });

  await prisma.businessUser.upsert({
    where: { businessId_userId: { businessId: business.id, userId: client.id } },
    update: {},
    create: { businessId: business.id, userId: client.id, role: "OWNER" },
  });

  // Un segundo negocio permite comprobar en la demo que el cliente de Burger Lab
  // no puede verlo: es el criterio de aceptación del aislamiento multi-tenant.
  const other = await prisma.business.upsert({
    where: { slug: "cafe-central" },
    update: {},
    create: {
      slug: "cafe-central",
      name: "Café Central",
      description: "Café de especialidad",
      category: "Cafetería",
      brandColor: "#7c3f1d",
      menuMode: MenuMode.NATIVE,
      address: "Avenida Central, San José, Costa Rica",
    },
  });

  await seedMenu(other.id);

  // Café Central necesita al menos un tag y un enlace propios: son los que usan
  // las pruebas de aislamiento para comprobar que el cliente de Burger Lab
  // recibe 403 al pedirlos.
  await prisma.tag.upsert({
    where: { code: "F7Y4X93M" },
    update: {},
    create: {
      code: "F7Y4X93M",
      name: "Mostrador",
      locationLabel: "Entrada",
      businessId: other.id,
    },
  });

  const otherHasLink = await prisma.businessLink.findFirst({
    where: { businessId: other.id },
    select: { id: true },
  });

  if (!otherHasLink) {
    await prisma.businessLink.create({
      data: {
        businessId: other.id,
        type: LinkType.INSTAGRAM,
        label: "Instagram",
        url: "https://instagram.com/cafecentral",
        position: 0,
      },
    });
  }

  for (const [index, link] of LINKS.entries()) {
    const existing = await prisma.businessLink.findFirst({
      where: { businessId: business.id, type: link.type },
      select: { id: true },
    });

    if (existing) continue;

    await prisma.businessLink.create({
      data: { ...link, businessId: business.id, position: index },
    });
  }

  for (const tag of TAGS) {
    await prisma.tag.upsert({
      where: { code: tag.code },
      update: {},
      create: { ...tag, businessId: business.id },
    });
  }

  await prisma.domain.upsert({
    where: { domain: "burgerlab.example" },
    update: {},
    create: {
      businessId: business.id,
      domain: "burgerlab.example",
      status: DomainStatus.ACTIVE,
      registrar: "Registrador de demostración",
      expiresAt: addDays(new Date(), 240),
      autoRenew: true,
      notes: "DNS apuntando al VPS de TapGoCR.",
    },
  });

  const services: Array<{ type: ServiceType; status: ServiceStatus; notes: string }> = [
    { type: ServiceType.NFC, status: ServiceStatus.ACTIVE, notes: "5 placas NTAG215." },
    { type: ServiceType.QR, status: ServiceStatus.ACTIVE, notes: "QR impreso en mesas." },
    { type: ServiceType.LANDING, status: ServiceStatus.ACTIVE, notes: "Landing publicada." },
    { type: ServiceType.DOMAIN, status: ServiceStatus.ACTIVE, notes: "burgerlab.example" },
    {
      type: ServiceType.WEBSITE,
      status: ServiceStatus.ACTIVE,
      notes: "Sitio desarrollado por TapGoCR.",
    },
  ];

  for (const service of services) {
    const existing = await prisma.businessService.findFirst({
      where: { businessId: business.id, type: service.type },
      select: { id: true },
    });

    if (existing) continue;

    await prisma.businessService.create({
      data: {
        ...service,
        businessId: business.id,
        startDate: addDays(new Date(), -60),
        renewalDate: addDays(new Date(), 305),
      },
    });
  }

  const existingRequest = await prisma.serviceRequest.findFirst({
    where: { businessId: business.id, type: RequestType.WEBSITE },
    select: { id: true },
  });

  if (!existingRequest) {
    await prisma.serviceRequest.create({
      data: {
        businessId: business.id,
        type: RequestType.WEBSITE,
        title: "Crear página web",
        description:
          "Cliente necesita página web con menú, WhatsApp, Instagram, ubicación y formulario de contacto.",
        status: RequestStatus.IN_PROGRESS,
        priority: RequestPriority.HIGH,
      },
    });
  }

  await seedEvents(business.id);
  await seedChips(business.id, other.id);

  console.log(`
Listo.

  ROOT     admin@tapgocr.com      / ${DEMO_ADMIN_PASSWORD}
  CLIENT   burgerlab@tapgocr.com  / ${DEMO_CLIENT_PASSWORD}

  Negocios: ${business.name}, ${other.name}
  Tags:     ${TAGS.map((t) => t.code).join(", ")}
  Admin:    ${admin.email}
`);
}

/**
 * Regenera 30 días de actividad. Se borran los eventos anteriores del negocio
 * para que la demo no acumule datos de corridas previas.
 */
/**
 * Carta de demostración del menú digital nativo.
 *
 * Idempotente como el resto del seed: si la categoría ya existe no se vuelve a
 * cargar, para no duplicar productos en cada corrida.
 */
async function seedMenu(businessId: string) {
  const existing = await prisma.menuCategory.findFirst({
    where: { businessId },
    select: { id: true },
  });
  if (existing) return;

  type SeedItem = {
    name: string;
    description?: string;
    priceCents?: number;
    available?: boolean;
  };

  const MENU: Array<{
    name: string;
    description?: string;
    items: SeedItem[];
  }> = [
    {
      name: "Café",
      description: "Grano de Tarrazú tostado cada semana",
      items: [
        { name: "Espresso", priceCents: 130000 },
        { name: "Capuchino", description: "Con leche espumada y canela", priceCents: 195000 },
        { name: "Chorreado", description: "Método tradicional, servido en jarra", priceCents: 160000 },
        // Un producto agotado deja ver que se oculta de la carta sin borrarse.
        { name: "Cold brew", description: "24 horas de infusión en frío", priceCents: 240000, available: false },
      ],
    },
    {
      name: "Repostería",
      items: [
        { name: "Queque de banano", priceCents: 180000 },
        { name: "Croissant de almendra", priceCents: 210000 },
      ],
    },
    {
      name: "Desayunos",
      items: [
        { name: "Gallo pinto con huevo", description: "Con natilla, queso y plátano maduro", priceCents: 350000 },
        // Sin precio: hay cartas que dicen "precio del día".
        { name: "Especial de la casa" },
      ],
    },
  ];

  for (const [index, category] of MENU.entries()) {
    await prisma.menuCategory.create({
      data: {
        businessId,
        name: category.name,
        description: category.description,
        position: index,
        items: {
          create: category.items.map((item, position) => ({
            name: item.name,
            description: item.description,
            priceCents: item.priceCents ?? null,
            available: item.available ?? true,
            position,
          })),
        },
      },
    });
  }
}

async function seedEvents(businessId: string) {
  await prisma.scanEvent.deleteMany({ where: { businessId } });

  const tags = await prisma.tag.findMany({
    where: { businessId },
    select: { id: true, name: true },
  });

  const now = new Date();
  const rows: Array<{
    businessId: string;
    tagId: string;
    eventType: ScanEventType;
    target: string | null;
    timestamp: Date;
    deviceType: DeviceType;
    source: EventSource;
  }> = [];

  for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
    const day = addDays(now, -daysAgo);
    // Fin de semana más movido que entre semana.
    const weekend = day.getDay() === 0 || day.getDay() === 6;
    const scans = randomInt(weekend ? 190 : 110, weekend ? 260 : 175);

    for (let i = 0; i < scans; i++) {
      const tag = weighted(
        tags.map((t, index) => [t, index === 0 ? 30 : index === 4 ? 25 : 15] as const),
      );
      const device = weighted(DEVICE_WEIGHTS);
      const timestamp = withBusinessHours(day);
      // Una cuarta parte llega por el QR impreso; el resto por NFC.
      const source = Math.random() < 0.25 ? EventSource.QR : EventSource.TAP;

      rows.push({
        businessId,
        tagId: tag.id,
        eventType: ScanEventType.SCAN,
        target: null,
        timestamp,
        deviceType: device,
        source,
      });

      // Alrededor del 70 % de los escaneos terminan en al menos un click.
      if (Math.random() < 0.7) {
        rows.push({
          businessId,
          tagId: tag.id,
          eventType: ScanEventType.CLICK,
          target: weighted(CLICK_WEIGHTS),
          timestamp: new Date(timestamp.getTime() + randomInt(2, 90) * 1000),
          deviceType: device,
          source,
        });
      }
    }
  }

  // Se insertan por lotes: una sola sentencia con decenas de miles de filas
  // agota los parámetros permitidos por PostgreSQL.
  const BATCH = 2000;
  for (let i = 0; i < rows.length; i += BATCH) {
    await prisma.scanEvent.createMany({ data: rows.slice(i, i + BATCH) });
  }

  console.log(`  ${rows.length} eventos de analytics generados.`);
}

/**
 * Chips de demostración.
 *
 * Es solo el inventario de hardware: la cuota de taps que muestra la demo (un
 * negocio al día, otro cerca del tope u otro superado) sale del plan de cada
 * negocio, no de estos chips — ver `Business.plan` en el alta más arriba y los
 * eventos de analytics generados en `seedAnalytics`.
 */
async function seedChips(businessId: string, otherBusinessId: string) {
  const tags = await prisma.tag.findMany({
    where: { businessId },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });

  for (const [index, tag] of tags.entries()) {
    const uid = `04${String(index + 1).padStart(2, "0")}A1B2C3D4E5`;

    await prisma.chip.upsert({
      where: { uid },
      update: {},
      create: {
        uid,
        model: ChipModel.NTAG215,
        status: ChipStatus.INSTALLED,
        batch: "DEMO-2026-01",
        tagId: tag.id,
        notes: `Placa instalada en ${tag.name}.`,
      },
    });
  }

  // Un chip del otro negocio y dos sin asignar, para ver el inventario completo.
  const otherTag = await prisma.tag.findFirst({
    where: { businessId: otherBusinessId },
    select: { id: true },
  });

  if (otherTag) {
    await prisma.chip.upsert({
      where: { uid: "0499A1B2C3D4E5" },
      update: {},
      create: {
        uid: "0499A1B2C3D4E5",
        model: ChipModel.NTAG213,
        status: ChipStatus.INSTALLED,
        batch: "DEMO-2026-01",
        tagId: otherTag.id,
      },
    });
  }

  for (const uid of ["04F1A1B2C3D4E5", "04F2A1B2C3D4E5"]) {
    await prisma.chip.upsert({
      where: { uid },
      update: {},
      create: {
        uid,
        model: ChipModel.NTAG216,
        status: ChipStatus.IN_STOCK,
        batch: "DEMO-2026-02",
      },
    });
  }

  console.log(`  ${tags.length + 3} chips de demostración registrados.`);
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function withBusinessHours(day: Date): Date {
  const copy = new Date(day);
  copy.setHours(randomInt(11, 22), randomInt(0, 59), randomInt(0, 59), 0);
  return copy;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function weighted<T>(entries: ReadonlyArray<readonly [T, number]>): T {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let threshold = Math.random() * total;

  for (const [value, weight] of entries) {
    threshold -= weight;
    if (threshold <= 0) return value;
  }

  return entries[entries.length - 1][0];
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
