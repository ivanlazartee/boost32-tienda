// Formatos en castellano argentino

const moneyFmt = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const compactFmt = new Intl.NumberFormat("es-AR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const dateFmt = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short" });
const dateLongFmt = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});
const timeFmt = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" });
const weekdayFmt = new Intl.DateTimeFormat("es-AR", { weekday: "short" });

/** 239999 -> "$ 239.999" */
export const money = (value) => moneyFmt.format(value);

/** 1450000 -> "$1,5 M" (para ejes de gráficos) */
export const moneyCompact = (value) => `$${compactFmt.format(value)}`;

export const date = (iso) => dateFmt.format(new Date(iso)).replace(".", "");
export const dateLong = (iso) => dateLongFmt.format(new Date(iso));
export const time = (iso) => timeFmt.format(new Date(iso));
export const weekday = (d) => weekdayFmt.format(d).replace(".", "");

/** Hoy a las 00:00 menos N días. Con N negativo, devuelve una fecha futura. */
export function daysAgoToDate(n) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

export const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** "hace 5 min", "ayer 18:12", "28 oct" */
export function relative(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diffMin = Math.round((now - d) / 60000);

  if (diffMin >= 0 && diffMin < 60) return `hace ${Math.max(diffMin, 1)} min`;
  if (isSameDay(d, now)) return `hoy ${time(iso)}`;
  if (isSameDay(d, daysAgoToDate(1))) return `ayer ${time(iso)}`;
  return `${date(iso)} · ${time(iso)}`;
}

export const initials = (name) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

export const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
