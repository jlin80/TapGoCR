import { LinkType } from "@/generated/prisma/enums";

/**
 * Contenido de las landings por rubro (/restaurantes, /barberias, …).
 *
 * Es el mismo producto con distinto copy y un orden de botones sugerido, no
 * seis productos diferentes: `flujo` solo referencia tipos de enlace que ya
 * existen (`LinkType`), nunca una función que TapGoCR no tenga construida.
 */

export type Industry = {
  slug: string;
  name: string;
  /** Plural con artículo, para armar frases: "para {article}". */
  article: string;
  headline: string;
  tagline: string;
  problema: string;
  solucion: string;
  /** Orden de botones sugerido para este rubro, en el que aparecerían en la landing. */
  flujo: LinkType[];
  beneficios: string[];
  faq: Array<{ q: string; a: string }>;
};

export const INDUSTRIES: Industry[] = [
  {
    slug: "restaurantes",
    name: "Restaurantes",
    article: "restaurantes",
    headline: "El menú, el pedido por WhatsApp y la reseña, en una sola placa",
    tagline: "Una placa en cada mesa reemplaza el menú de papel y facilita la reseña.",
    problema:
      "El menú en papel se atrasa apenas cambia un precio o se acaba un plato, y pedirle a un cliente satisfecho que deje una reseña en Google es incómodo si no le das el enlace en la mano.",
    solucion:
      "Una placa NFC + QR en cada mesa abre el menú actualizado, un botón directo a WhatsApp para pedidos o consultas, y el enlace que abre el formulario de reseña de Google sin que el cliente tenga que buscar tu negocio.",
    flujo: [
      LinkType.MENU,
      LinkType.WHATSAPP,
      LinkType.GOOGLE_REVIEWS,
      LinkType.GOOGLE_MAPS,
    ],
    beneficios: [
      "Cambiás un precio o un plato agotado desde el panel, se ve al instante en todas las mesas",
      "El botón de WhatsApp reduce la fricción para pedidos y reservas de mesa",
      "El enlace directo a reseñas hace más fácil pedirla justo cuando el cliente quedó contento",
    ],
    faq: [
      {
        q: "¿Reemplaza el menú impreso por completo?",
        a: "Podés mantener el impreso mientras probás, pero la placa te deja actualizar precios y platos sin reimprimir nada.",
      },
      {
        q: "¿Puedo tener un menú distinto por sucursal?",
        a: "Sí: cada placa apunta al mismo negocio, y si tenés varias sucursales, el plan Business o Chain te da páginas separadas por sucursal.",
      },
    ],
  },
  {
    slug: "cafeterias",
    name: "Cafeterías",
    article: "cafeterías",
    headline: "Tu carta, tus redes y tus promos, con un solo toque",
    tagline: "Ideal para la barra o la mesa: menú, Instagram y promociones del día.",
    problema:
      "Una cafetería vive de la repetición: quien vuelve quiere ver rápido qué hay nuevo, y comunicar una promo del día por redes no sirve de nada si el cliente ya está sentado sin seguirte todavía.",
    solucion:
      "La placa en la barra o la mesa abre tu carta, tu Instagram (para que te sigan ahí mismo) y tu WhatsApp para pedidos para llevar, todo editable desde el panel cuando cambia la carta de temporada.",
    flujo: [LinkType.MENU, LinkType.INSTAGRAM, LinkType.WHATSAPP, LinkType.GOOGLE_REVIEWS],
    beneficios: [
      "Sumás seguidores reales de gente que ya está en tu local",
      "La carta de temporada se actualiza sin reimprimir nada",
      "Un botón de WhatsApp para pedidos para llevar o encargos",
    ],
    faq: [
      {
        q: "¿Puedo mostrar promociones del día?",
        a: "Sí, desde la descripción de tu página pública o agregando un enlace personalizado que apunte a tu promo del momento.",
      },
    ],
  },
  {
    slug: "barberias",
    name: "Barberías y salones",
    article: "barberías y salones",
    headline: "Que agendar una cita sea un WhatsApp de distancia",
    tagline: "Placa en el mostrador o el espejo: WhatsApp, Instagram y reseñas.",
    problema:
      "El trabajo de una barbería o salón se muestra mejor en fotos que en texto, y la mayoría de las citas se coordinan por WhatsApp, no por un formulario.",
    solucion:
      "La placa lleva directo a WhatsApp para agendar, a tu Instagram para que vean cortes o trabajos recientes, y al enlace de reseñas de Google para pedirla apenas termina el servicio.",
    flujo: [LinkType.WHATSAPP, LinkType.INSTAGRAM, LinkType.GOOGLE_REVIEWS, LinkType.GOOGLE_MAPS],
    beneficios: [
      "Agendar una cita queda a un toque de WhatsApp, sin llamar",
      "Instagram muestra el trabajo real del local, no un texto describiéndolo",
      "Pedir la reseña es más fácil justo al terminar el servicio",
    ],
    faq: [
      {
        q: "¿TapGoCR agenda las citas por mí?",
        a: "No: la placa abre WhatsApp para que coordinés la cita como ya lo hacés hoy. Lo que cambia es que el cliente llega a ese chat con un toque, no buscando tu número.",
      },
    ],
  },
  {
    slug: "hoteles",
    name: "Hoteles y hospedajes",
    article: "hoteles y hospedajes",
    headline: "La información de la estadía, siempre a mano del huésped",
    tagline: "En la habitación o la recepción: servicios, WhatsApp, ubicación y reseñas.",
    problema:
      "Un huésped llega sin saber el WiFi, los horarios o qué hay cerca, y preguntar todo en recepción hace perder tiempo a los dos lados.",
    solucion:
      "Una placa en la habitación o la recepción abre una página con la información del hospedaje, un botón de WhatsApp directo a recepción, cómo llegar para quien todavía no llegó, y el enlace de reseñas para pedirla al hacer el check-out.",
    flujo: [LinkType.WHATSAPP, LinkType.GOOGLE_MAPS, LinkType.GOOGLE_REVIEWS, LinkType.INSTAGRAM],
    beneficios: [
      "Menos preguntas repetidas en recepción",
      "El huésped pide lo que necesita por WhatsApp sin bajar a preguntar",
      "Pedir la reseña al check-out, cuando la experiencia está fresca",
    ],
    faq: [
      {
        q: "¿Puedo tener una placa por habitación?",
        a: "Sí, cada placa es independiente: podés poner el WiFi y los datos de esa habitación en la descripción o en un enlace personalizado.",
      },
    ],
  },
  {
    slug: "gimnasios",
    name: "Gimnasios",
    article: "gimnasios",
    headline: "Horarios, redes y WhatsApp, sin depender del cartel de la entrada",
    tagline: "En la entrada o el mostrador: información, Instagram y WhatsApp.",
    problema:
      "El horario de clases y las promociones cambian seguido, y un cartel impreso o un post viejo de Instagram terminan mostrando información atrasada.",
    solucion:
      "La placa en la entrada abre la información actualizada del gimnasio, tu Instagram para las rutinas y el ambiente, y un botón de WhatsApp para consultas de membresía.",
    flujo: [LinkType.WHATSAPP, LinkType.INSTAGRAM, LinkType.GOOGLE_MAPS, LinkType.GOOGLE_REVIEWS],
    beneficios: [
      "El horario de clases se actualiza sin reimprimir el cartel de la entrada",
      "WhatsApp directo para consultas de membresía o clases de prueba",
      "Instagram conecta con gente que ya está físicamente en el gimnasio",
    ],
    faq: [
      {
        q: "¿Sirve para varias sedes?",
        a: "Sí: con el plan Chain cada sede tiene su propia página y sus propias placas, con analytics comparado entre sucursales.",
      },
    ],
  },
  {
    slug: "tiendas",
    name: "Tiendas",
    article: "tiendas",
    headline: "Tu catálogo, tus redes y cómo llegar, en el mostrador",
    tagline: "En la vitrina o la caja: catálogo, WhatsApp, ubicación y redes.",
    problema:
      "Mostrar todo el catálogo en el local es imposible, y un cliente que vio algo en redes no siempre sabe cómo llegar a la tienda física.",
    solucion:
      "La placa en el mostrador o la vitrina abre tu catálogo completo, un botón de WhatsApp para consultar disponibilidad, cómo llegar y tus redes para que sigan viendo novedades.",
    flujo: [LinkType.CATALOG, LinkType.WHATSAPP, LinkType.GOOGLE_MAPS, LinkType.INSTAGRAM],
    beneficios: [
      "El catálogo completo está siempre disponible, no solo lo que entra en la vitrina",
      "Consultas de disponibilidad directo por WhatsApp",
      "Cómo llegar para quien te encontró en redes y quiere pasar",
    ],
    faq: [
      {
        q: "¿El catálogo se actualiza solo?",
        a: "Vos lo actualizás desde tu panel cuando cambia el stock o los precios; se ve al instante en la placa sin reimprimir nada.",
      },
    ],
  },
];

export function industryBySlug(slug: string): Industry | undefined {
  return INDUSTRIES.find((item) => item.slug === slug);
}
