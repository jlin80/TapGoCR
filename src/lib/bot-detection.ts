/**
 * Filtrado de tráfico automatizado en la landing pública.
 *
 * Motivo: cada apertura de `/t/{code}` cuenta como tap y consume la cuota
 * comercial del chip. Una previsualización de WhatsApp o Facebook al compartir
 * el enlace, o el rastreador de un buscador, inflaría las estadísticas que ve
 * el cliente y podría agotarle la cuota sin que nadie haya tocado la placa.
 *
 * Es deliberadamente conservador: ante la duda, se registra. Perder un tap real
 * es peor que colar uno falso, porque el cliente compara sus cifras con lo que
 * ve en el local.
 */

/**
 * Fragmentos que aparecen en el user agent de rastreadores y de los servicios
 * que generan la tarjeta de previsualización al compartir un enlace.
 *
 * `bot`, `crawler` y `spider` cubren la mayoría por sí solos; el resto son los
 * que no incluyen ninguna de esas palabras y sí visitan una landing compartida.
 */
const BOT_MARKERS = [
  "bot",
  "crawler",
  "spider",
  "crawling",
  "facebookexternalhit",
  "whatsapp",
  "telegrambot",
  "slackbot",
  "discordbot",
  "twitterbot",
  "linkedinbot",
  "pinterest",
  "embedly",
  "quora link preview",
  "skypeuripreview",
  "vkshare",
  "preview",
  "headlesschrome",
  "phantomjs",
  "puppeteer",
  "playwright",
  "lighthouse",
  "chrome-lighthouse",
  "pagespeed",
  "gtmetrix",
  "pingdom",
  "uptimerobot",
  "curl/",
  "wget/",
  "python-requests",
  "python-urllib",
  "go-http-client",
  "java/",
  "okhttp",
  "axios/",
  "node-fetch",
  "postman",
  "insomnia",
  "apachebench",
  "monitoring",
  "healthcheck",
];

/**
 * Un user agent ausente también se trata como automatizado: todo navegador
 * móvil envía uno, y las peticiones sin él son de scripts.
 */
export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent) return true;

  const ua = userAgent.trim().toLowerCase();
  if (ua.length === 0) return true;

  return BOT_MARKERS.some((marker) => ua.includes(marker));
}

/**
 * Ventana durante la cual una segunda apertura del mismo tag desde el mismo
 * visitante no vuelve a contar.
 *
 * Treinta segundos cubre el caso que produce duplicados de verdad: el teléfono
 * abre la URL, la persona vuelve atrás y la reabre, o el navegador reintenta.
 *
 * La ventana es corta a propósito porque la huella no es perfecta. Con
 * ANALYTICS_IP_SALT configurada distingue bien a dos visitantes; sin ella queda
 * solo el user agent, y dos iPhone del mismo modelo que toquen la placa dentro
 * de la misma media hora se contarían como uno. Es la razón de no ampliarla: el
 * error posible crece con el tamaño de la ventana, y perder un tap real es peor
 * que colar uno duplicado.
 */
export const DEDUPE_WINDOW_MS = 30_000;

/**
 * Huella efímera de un visitante para deduplicar, o `null` cuando no hay datos
 * suficientes.
 *
 * Nunca se persiste: vive solo en el proceso durante la ventana. El `ipHash`
 * que sí se guarda en ScanEvent es otra cosa y sigue su propia política.
 */
export function visitorFingerprint(
  tagId: string,
  ipHash: string | null,
  userAgent: string | null,
): string | null {
  if (!ipHash && !userAgent) return null;
  return `${tagId}|${ipHash ?? ""}|${userAgent ?? ""}`;
}
