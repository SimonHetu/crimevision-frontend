import { apiGet } from "./api";

export type Incident = {
  id: string | number;
  latitude: number;
  longitude: number;
  category?: string;
  source?: string;
  sourceId?: string;
  sourceCategory?: string;
  date?: string;
  occurredAt?: string | null;
  reportedAt?: string | null;
  pdqId?: number | null;
  city?: string | null;
  borough?: string | null;
  precinct?: string | null;
  locationType?: string | null;
  premiseType?: string | null;
  suspectRace?: string | null;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

export async function fetchIncidents(params?: {
  timePeriod?: string;
  pdqId?: number;
  source?: string;
  city?: string;
  date?: string;
  dateMode?: "day" | "month";
  limit?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.timePeriod) qs.set("timePeriod", params.timePeriod);
  if (params?.pdqId != null) qs.set("pdqId", String(params.pdqId));
  if (params?.source) qs.set("source", params.source);
  if (params?.city) qs.set("city", params.city);
  if (params?.date) qs.set("date", params.date);
  if (params?.dateMode) qs.set("dateMode", params.dateMode);
  if (params?.limit != null) qs.set("limit", String(params.limit));
  const path = `/api/incidents${qs.toString() ? `?${qs}` : ""}`;
  const res = await apiGet<ApiResponse<Incident[]>>(path);
  return res.data;
}
