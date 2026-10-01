// Every timestamp shown anywhere in the app (or exported to Excel) goes
// through this — minute precision, fixed to Taipei time regardless of where
// the server or the viewer's browser happens to be.
// HTTP headers must be ASCII — a raw Chinese filename in Content-Disposition
// throws (or silently breaks) at the Node layer. RFC 5987's filename*
// (UTF-8, percent-encoded) is what lets browsers show/save the real name
// while an ASCII fallback keeps older clients happy.
export function contentDispositionHeader(filename: string, asciiFallback = "download.docx"): string {
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export function formatTaipei(d: string | Date | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(date).replace(/\//g, "/");
}
