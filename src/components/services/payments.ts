import { authedFetch, type GetTokenFn } from "./authedFetch";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000";

export type SupportTier = "support_1" | "support_5" | "support_10";

type CheckoutResponse = {
  success: boolean;
  id: string;
  url: string | null;
};

async function startCheckout(path: string, getToken: GetTokenFn, body: unknown) {
  const res = await authedFetch(`${API_BASE}${path}`, getToken, {
    method: "POST",
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as Partial<CheckoutResponse> & { message?: string };

  if (!res.ok || !data.url) {
    throw new Error(data.message ?? "Unable to start Stripe Checkout.");
  }

  window.location.assign(data.url);
}

export function startAlertsCheckout(getToken: GetTokenFn) {
  return startCheckout("/api/payments/checkout-session", getToken, {});
}

export async function startSupportCheckout(getToken: GetTokenFn, tier: SupportTier) {
  const headers = new Headers({ "Content-Type": "application/json" });
  const token = await getToken().catch(() => null);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}/api/payments/support-checkout-session`, {
    method: "POST",
    headers,
    body: JSON.stringify({ tier }),
  });

  const data = (await res.json()) as Partial<CheckoutResponse> & { message?: string };

  if (!res.ok || !data.url) {
    throw new Error(data.message ?? "Unable to start Stripe Checkout.");
  }

  window.location.assign(data.url);
}

