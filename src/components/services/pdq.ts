import { apiGet } from "./api";

export type Pdq = {
  id: number;
  name?: string;
  latitude: number;
  longitude: number;
};

type ApiResponse<T> = { success: boolean; data: T };

export async function fetchPdqs() {
  const res = await apiGet<ApiResponse<Pdq[]>>("/api/pdq");
  return res.data;
}
