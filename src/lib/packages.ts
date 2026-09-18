/**
 * Paquetes comerciales de TapGoCR.
 *
 * Fuente unica: la landing arma las tarjetas con esto y cada pagina de detalle
 * lee la misma entrada. Si se agrega un paquete, aparece en los dos lados sin
 * tocar nada mas.
 *
 * No hay precios acá a proposito. TapGoCR vende un servicio que se instala y se
 * configura, y el precio depende de cuantas placas lleva el local; publicar una
 * cifra fija obligaria a poner la mas alta para cubrirse. La pagina de detalle
 * lleva a pedir una propuesta, que es como se cierra la venta hoy.
 */

export type PackageDetail = {
  /** Identificador en la URL: /paquetes/{slug}. Nunca cambiarlo una vez publicado. */
  slug: string;
  level: number;
  name: string;
  /** Una linea que resume para quien es. */
  tagline: string;
  /** Resumen corto que se muestra en la tarjeta de la landing. */
  includes: string[];
  featured?: boolean;

  /** Lo que se entrega, con el detalle que la tarjeta no puede mostrar. */
  entrega: Array<{ title: string; description: string }>;
  /** Para quien tiene sentido. */
  idealPara: string[];
  /** Lo que NO incluye. Se dice de frente para no generar expectativas falsas. */
  noIncluye: string[];
};

export const PACKAGES: PackageDetail[] = [
  {
    slug: "nfc-qr",
    level: 1,
    name: "NFC + QR",
    tagline: "Lo mínimo para que tus clientes lleguen a todo tu negocio con un toque.",
    includes: [
      "Placas con NFC y QR",
      "Landing del negocio",
      "Enlaces ilimitados",
    ],
    entrega: [
      {
        title: "Placas físicas instaladas",
        description:
          "Placas con chip NFC y código QR impreso, colocadas donde tenga sentido: mesas, barra, entrada o vitrina. Las dos vías llevan al mismo lugar, así que funciona igual con teléfonos que tienen NFC y con los que no.",
      },
      {
        title: "Tu página pública",
        description:
          "Una página propia con tu logo, tu portada, tus colores y tu descripción. Abre en menos de un segundo, con botones grandes pensados para usar con una mano. Sin registro y sin instalar nada del lado del cliente.",
      },
      {
        title: "Todos los botones que necesités",
        description:
          "Menú, WhatsApp, Instagram, TikTok, Facebook, reseñas de Google, cómo llegar, catálogo, llamada o cualquier enlace propio. Solo aparecen los que configurás: si no tenés TikTok, no hay botón de TikTok.",
      },
      {
        title: "Panel para cambiar lo que quieras",
        description:
          "Entrás y editás tus enlaces, tu descripción o tus colores. El cambio se ve al instante en todas tus placas, sin reimprimir nada y sin volver a tocar el chip.",
      },
    ],
    idealPara: [
      "Locales que hoy tienen un QR impreso y se cansaron de reimprimirlo",
      "Negocios que quieren un solo punto de entrada a todas sus redes",
      "Quien empieza y prefiere probar antes de sumar más",
    ],
    noIncluye: [
      "Estadísticas de uso (van en el Paquete 2)",
      "Dominio propio",
      "Desarrollo de sitio web",
    ],
  },
  {
    slug: "nfc-qr-analytics",
    level: 2,
    name: "NFC + QR + Analytics",
    tagline: "Lo mismo, más saber qué está pasando de verdad en tu local.",
    includes: ["Todo lo anterior", "Escaneos y clics por día", "Estadísticas por punto"],
    entrega: [
      {
        title: "Todo lo del Paquete 1",
        description:
          "Las placas, tu página pública, los botones y el panel para editarlos.",
      },
      {
        title: "Cuántos escaneos tuviste",
        description:
          "Por día, por semana y por mes. Los cortes se calculan en hora de Costa Rica, así que «hoy» significa hoy y no algo que cambia a las 6 de la tarde.",
      },
      {
        title: "Qué botón tocan más",
        description:
          "Si tus clientes van al menú, a WhatsApp o a tus redes. Sirve para decidir qué poner primero y qué sacar.",
      },
      {
        title: "Qué punto de tu local funciona",
        description:
          "Cada placa se mide por separado. Podés comparar la de la entrada contra las de las mesas y mover las que no se usan.",
      },
      {
        title: "Cifras limpias, no infladas",
        description:
          "Se descartan los rastreadores y las vistas previas que generan WhatsApp o Facebook al compartir el enlace, y las recargas del mismo visitante en pocos segundos. Lo que ves se parece a lo que pasó.",
      },
    ],
    idealPara: [
      "Locales con varias mesas que quieren saber dónde poner las placas",
      "Quien quiere medir si vale la pena empujar el menú o las reseñas",
      "Negocios que ya probaron el Paquete 1 y quieren números",
    ],
    noIncluye: ["Dominio propio", "Desarrollo de sitio web", "Hosting"],
  },
  {
    slug: "dominio-propio",
    level: 3,
    name: "Con dominio propio",
    tagline: "Tu propia dirección en internet, tramitada y configurada por nosotros.",
    includes: ["Todo lo anterior", "Elección del dominio", "Trámite y configuración de DNS"],
    entrega: [
      {
        title: "Todo lo de los paquetes anteriores",
        description: "Placas, página pública, panel y estadísticas.",
      },
      {
        title: "Elegimos el dominio con vos",
        description:
          "Revisamos qué está disponible y qué conviene para tu negocio, con la extensión que tenga sentido: .com, .cr o la que corresponda.",
      },
      {
        title: "Lo tramitamos nosotros",
        description:
          "Nos encargamos del registro y de toda la configuración de DNS. Vos no tenés que abrir cuenta en ningún lado ni entender qué es un registro A.",
      },
      {
        title: "Aviso antes de que venza",
        description:
          "Te escribimos con 60, 30, 14, 7 y 1 día de anticipación. Un dominio vencido tumba tu sitio y tu correo, y recuperarlo cuesta bastante más que renovarlo.",
      },
    ],
    idealPara: [
      "Negocios que quieren una dirección propia y no una compartida",
      "Quien piensa poner el dominio en tarjetas, rótulos o facturas",
      "Locales que además quieren correo con su propio dominio",
    ],
    noIncluye: [
      "El costo anual del dominio, que se factura aparte",
      "Desarrollo del sitio web (va en el Paquete 4)",
    ],
  },
  {
    slug: "sitio-web",
    level: 4,
    name: "Con sitio web",
    tagline: "Un sitio hecho a mano por nosotros, conectado a tu dominio.",
    includes: ["Todo lo anterior", "Sitio web hecho por nosotros", "Conectado a tu dominio"],
    entrega: [
      {
        title: "Todo lo de los paquetes anteriores",
        description: "Placas, página pública, panel, estadísticas y dominio propio.",
      },
      {
        title: "Un sitio web de verdad",
        description:
          "Lo diseñamos y lo desarrollamos nosotros, a la medida de tu negocio. No es un constructor de plantillas ni un editor que tenés que aprender a usar.",
      },
      {
        title: "Conectado a todo lo demás",
        description:
          "Queda apuntando a tu dominio, y el botón «Sitio web» aparece solo en tu página pública en cuanto está listo.",
      },
      {
        title: "Pensado para el teléfono",
        description:
          "La mayoría de tus visitas llegan desde un celular, así que se diseña primero para esa pantalla.",
      },
    ],
    idealPara: [
      "Negocios que necesitan más que una página de enlaces",
      "Quien quiere mostrar catálogo, historia, equipo o ubicación con detalle",
      "Locales que hoy solo tienen redes sociales y quieren algo propio",
    ],
    noIncluye: [
      "Hosting y mantenimiento continuo (van en el Paquete 5)",
      "Producción de fotos y textos, que se cotiza aparte",
    ],
  },
  {
    slug: "todo-administrado",
    level: 5,
    name: "Todo administrado",
    tagline: "Nos hacemos cargo de todo y vos te dedicás a tu negocio.",
    includes: ["Todo lo anterior", "Hosting", "Mantenimiento y actualizaciones"],
    featured: true,
    entrega: [
      {
        title: "Todo lo de los paquetes anteriores",
        description:
          "Placas, página pública, panel, estadísticas, dominio propio y sitio web.",
      },
      {
        title: "Hosting incluido",
        description:
          "Tu sitio corre en nuestra infraestructura. No tenés que contratar ni administrar un servidor, ni entender de certificados.",
      },
      {
        title: "Mantenimiento y actualizaciones",
        description:
          "Cambios de contenido, ajustes y actualizaciones de seguridad. Si algo se rompe, lo arreglamos nosotros.",
      },
      {
        title: "Un solo interlocutor",
        description:
          "Placas, dominio, correo, sitio y estadísticas en un mismo lugar y con una sola factura. No hay que perseguir a tres proveedores distintos.",
      },
    ],
    idealPara: [
      "Negocios que no quieren ni pensar en la parte técnica",
      "Locales con varias sucursales o mucho movimiento de contenido",
      "Quien prefiere una cuota previsible en vez de sorpresas",
    ],
    noIncluye: [
      "Campañas de publicidad y manejo de redes sociales",
      "Producción de contenido: fotos, videos y textos",
    ],
  },
];

export function packageBySlug(slug: string): PackageDetail | undefined {
  return PACKAGES.find((item) => item.slug === slug);
}
