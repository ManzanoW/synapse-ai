/**
 * Utilitários puros para formatação de Calendário (RFC 5545 iCalendar e Google Calendar)
 */

export const DAY_INDEX_TO_BYDAY: Record<number, string> = {
  0: "MO",
  1: "TU",
  2: "WE",
  3: "TH",
  4: "FR",
  5: "SA",
  6: "SU",
};

/**
 * Escapa caracteres reservados para especificações RFC 5545
 */
export function escapeIcsText(text: string): string {
  if (!text) return "";
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/**
 * Formata data para timestamp UTC padrão iCalendar (ex: 20261003T120000Z)
 */
export function formatUtcIcs(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

/**
 * Formata data no formato local flutuante iCalendar (ex: 20261005T190000)
 */
export function formatFloatingIcs(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

/**
 * Gera URL direta para criar evento no Google Calendar Web
 */
export function generateGoogleCalendarUrl(params: {
  title: string;
  details: string;
  startDate: Date;
  endDate: Date;
  recurWeekly?: boolean;
  byDay?: string;
}): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const formatUtc = (d: Date) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

  const baseUrl = "https://calendar.google.com/calendar/render";
  const searchParams = new URLSearchParams({
    action: "TEMPLATE",
    text: params.title,
    details: params.details,
    dates: `${formatUtc(params.startDate)}/${formatUtc(params.endDate)}`,
  });

  if (params.recurWeekly && params.byDay) {
    searchParams.set("recur", `RRULE:FREQ=WEEKLY;BYDAY=${params.byDay}`);
  }

  return `${baseUrl}?${searchParams.toString()}`;
}
