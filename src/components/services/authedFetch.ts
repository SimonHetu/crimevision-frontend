export type GetTokenFn = (options?: { template?: string }) => Promise<string | null>;

export async function authedFetch(
  url: string,
  getToken: GetTokenFn,
  init: RequestInit = {}
) {
  const token = await getToken();
  if (!token) throw new Error("No Clerk token");

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  return fetch(url, { ...init, headers });
}
