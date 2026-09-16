/**
 * Cortes de día en la zona horaria del negocio.
 *
 * Los eventos se guardan en UTC, pero "hoy" y "últimos 7 días" deben medirse en
 * hora local: si no, el día cambiaría a las 6 p. m. en Costa Rica. Estas
 * funciones no dependen de la zona en la que corra el proceso, para que la
 * agregación en SQL y la serie construida en JavaScript coincidan siempre.
 */

/** Diferencia, en milisegundos, entre UTC y `timeZone` en un instante dado. */
function zoneOffsetMs(timeZone: string, at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);

  const read = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");

  // `hour` puede venir como 24 a medianoche según el motor.
  const asUtc = Date.UTC(
    read("year"),
    read("month") - 1,
    read("day"),
    read("hour") % 24,
    read("minute"),
    read("second"),
  );

  return at.getTime() - asUtc;
}

/** Fecha `YYYY-MM-DD` de un instante, leída en la zona indicada. */
export function zonedDateKey(timeZone: string, at: Date = new Date()): string {
  // `en-CA` produce exactamente el formato ISO de fecha.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

/** Instante UTC en el que empieza el día `YYYY-MM-DD` de esa zona. */
export function startOfZonedDay(timeZone: string, dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  const naive = Date.UTC(year, month - 1, day, 0, 0, 0);

  // El offset se evalúa en el instante aproximado y se aplica; basta una
  // pasada porque el desfase de una zona no cambia dentro del mismo día salvo
  // en el salto de horario de verano, que Costa Rica no tiene.
  return new Date(naive + zoneOffsetMs(timeZone, new Date(naive)));
}

/**
 * Lista de los últimos `days` días naturales de la zona, del más antiguo al más
 * reciente, incluyendo hoy.
 */
export function lastZonedDays(timeZone: string, days: number): string[] {
  const todayKey = zonedDateKey(timeZone);
  const [year, month, day] = todayKey.split("-").map(Number);
  const keys: string[] = [];

  for (let offset = days - 1; offset >= 0; offset--) {
    // Se opera sobre una fecha UTC pura: solo se manipulan año/mes/día, así que
    // no interviene ningún desfase horario.
    const date = new Date(Date.UTC(year, month - 1, day - offset));
    keys.push(date.toISOString().slice(0, 10));
  }

  return keys;
}

/** Inicio de la ventana de `days` días naturales que termina hoy. */
export function startOfLastZonedDays(timeZone: string, days: number): Date {
  const [first] = lastZonedDays(timeZone, days);
  return startOfZonedDay(timeZone, first);
}
