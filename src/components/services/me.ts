import { authedFetch, type GetTokenFn } from "./authedFetch";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000";

export type MeResponse = {
  success: boolean;
  user: {
    id: number;
    clerkId: string;
    email: string | null;
    profile: null | {
      id: number;
      homeLat: number | null;
      homeLng: number | null;
      homeRadiusM: number | null;
    };
  };
};

export type UpdateHomeBody = {
  homeLat: number | null;
  homeLng: number | null;
  homeRadiusM: number | null;
};

export async function fetchMe(getToken: GetTokenFn) {
  const res = await authedFetch(`${API_BASE}/api/me`, getToken);
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as MeResponse;
}

export async function updateHome(getToken: GetTokenFn, body: UpdateHomeBody) {
  const res = await authedFetch(`${API_BASE}/api/me/home`, getToken, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function clearHome(getToken: GetTokenFn) {
  return updateHome(getToken, { homeLat: null, homeLng: null, homeRadiusM: null });
}
