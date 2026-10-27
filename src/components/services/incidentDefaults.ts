import type { Incident } from "./incidents";

export function getLatestIncidentDefaults(incidents: Incident[]) {
  let latest: Date | null = null;
  const categories = new Set<string>();

  for (const incident of incidents) {
    categories.add(incident.category ?? "Unknown");
    if (!incident.date) continue;
    const date = new Date(incident.date);
    if (!Number.isNaN(date.getTime()) && (!latest || date > latest)) {
      latest = date;
    }
  }

  return {
    years: new Set<number>(latest ? [latest.getFullYear()] : []),
    months: new Set<number>(latest ? [latest.getMonth()] : []),
    categories,
    monthStart: latest
      ? `${latest.getFullYear()}-${String(latest.getMonth() + 1).padStart(2, "0")}-01`
      : "",
  };
}
