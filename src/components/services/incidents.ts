import { apiGet } from "./api";

export type Incident = {
  id: string | number;
  latitude: number;
  longitude: number;
  category?: string;
  date?: string;
  pdqId?: number;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

export async function fetchIncidents(params?: {
  timePeriod?: string;
  pdqId?: number;
  limit?: number;
}) {
  const qs = new URLSearchParams();

  if (params?.timePeriod) qs.set("timePeriod", params.timePeriod);
  if (params?.pdqId != null) qs.set("pdqId", String(params.pdqId));
  if (params?.limit != null) qs.set("limit", String(params.limit));

  const path = `/api/incidents${qs.toString() ? `?${qs}` : ""}`;

  const res = await apiGet<ApiResponse<Incident[]>>(path);
  return res.data;
}
