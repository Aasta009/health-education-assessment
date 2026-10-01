// Every timestamp shown anywhere in the app (or exported to Excel) goes
// through this — minute precision, fixed to Taipei time regardless of where
// the server or the viewer's browser happens to be.
export function formatTaipei(d: string | Date | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(date).replace(/\//g, "/");
}
