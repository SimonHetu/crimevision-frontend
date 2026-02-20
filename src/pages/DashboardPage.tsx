import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";

type Profile = {
  id: number;
  homeLat: number | null;
  homeLng: number | null;
  homeRadiusM: number | null;
};

export default function DashboardPage() {
  const { getToken } = useAuth();
  const apiBase = import.meta.env.VITE_API_BASE ?? "http://localhost:3000";

  const [profile, setProfile] = useState<Profile | null>(null);

  // UI inputs
  const [address, setAddress] = useState(""); // input texte (label pour l’instant)
  const [radius, setRadius] = useState<number>(400);

  const [status, setStatus] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // helpers
  async function authedJson(url: string, init: RequestInit = {}) {
    const token = await getToken();
    if (!token) throw new Error("No Clerk token (not signed in)");

    const res = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(init.headers ?? {}),
      },
    });

    const text = await res.text();
    let json: any = null;

    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      // ignore parsing error
    }

    if (!res.ok) throw new Error(json?.message ?? text ?? `HTTP ${res.status}`);
    return json;
  }

  function fmtHome(p: Profile | null) {
    if (p?.homeLat == null || p?.homeLng == null) return "null";
    return `${p.homeLat.toFixed(6)}, ${p.homeLng.toFixed(6)} (r=${p.homeRadiusM ?? 400}m)`;
  }

  function getBrowserLocation() {
    return new Promise<{ lat: number; lng: number }>((resolve, reject) => {
      if (!("geolocation" in navigator)) {
        reject(new Error("Geolocation not supported by this browser"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }

  function clampRadius(v: number) {
    // mêmes limites que l'input
    const min = 50;
    const max = 5000;
    if (!Number.isFinite(v)) return 400;
    return Math.max(min, Math.min(max, v));
  }

  // load profile on mount
  useEffect(() => {
    (async () => {
      try {
        setStatus("Loading profile...");
        const json = await authedJson(`${apiBase}/api/me`);
        const p = (json?.user?.profile ?? null) as Profile | null;

        setProfile(p);
        setRadius(clampRadius(p?.homeRadiusM ?? 400));
        setStatus("");
      } catch (e: any) {
        setStatus(`Failed to load: ${e?.message ?? String(e)}`);
      }
    })();
    
  }, []);

  // ---- actions ----
  async function saveHomeWithGPS() {
    try {
      setSaving(true);
      setStatus("Getting GPS location...");

      const { lat, lng } = await getBrowserLocation();

      setStatus("Saving home location...");
      const json = await authedJson(`${apiBase}/api/me/home`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeLat: lat,
          homeLng: lng,
          homeRadiusM: clampRadius(radius),
        }),
      });

      setProfile(json?.profile ?? null);
      setStatus("Saved ✅");
      setTimeout(() => setStatus(""), 1500);
    } catch (e: any) {
      setStatus(`Save failed: ${e?.message ?? String(e)}`);
    } finally {
      setSaving(false);
    }
  }

  async function clearHome() {
    try {
      setSaving(true);
      setStatus("Clearing home location...");

      const json = await authedJson(`${apiBase}/api/me/home`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeLat: null,
          homeLng: null,
          homeRadiusM: clampRadius(radius), //
        }),
      });

      setProfile(json?.profile ?? null);
      setStatus("Cleared ✅");
      setTimeout(() => setStatus(""), 1500);
    } catch (e: any) {
      setStatus(`Clear failed: ${e?.message ?? String(e)}`);
    } finally {
      setSaving(false);
    }
  }

  async function refresh() {
    try {
      setStatus("Refreshing...");
      const json = await authedJson(`${apiBase}/api/me`);
      const p = (json?.user?.profile ?? null) as Profile | null;

      setProfile(p);
      setRadius(clampRadius(p?.homeRadiusM ?? radius));
      setStatus("");
    } catch (e: any) {
      setStatus(`Refresh failed: ${e?.message ?? String(e)}`);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Dashboard</h2>
        <button onClick={refresh} disabled={saving} style={{ opacity: saving ? 0.6 : 1 }}>
          Refresh
        </button>
      </div>

      <div style={{ marginTop: 10, opacity: 0.85 }}>
        <div>
          <b>Current home:</b> {fmtHome(profile)}
        </div>
        {status ? (
          <div style={{ marginTop: 6, fontSize: 13, opacity: 0.9 }}>{status}</div>
        ) : null}
      </div>

      <div
        style={{
          marginTop: 18,
          padding: 16,
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 12,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 10 }}>Set home location</div>

        {/* Address input (label only for now) */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter your address... (label for now)"
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "transparent",
              color: "inherit",
              outline: "none",
            }}
          />

          {/* Radius */}
          <input
            type="number"
            value={radius}
            min={50}
            max={5000}
            step={50}
            onChange={(e) => {
              const v = Number(e.target.value);
              setRadius(clampRadius(v));
            }}
            style={{
              width: 120,
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "transparent",
              color: "inherit",
              outline: "none",
            }}
            title="Radius in meters"
          />

          <button
            onClick={saveHomeWithGPS}
            disabled={saving}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.12)",
              opacity: saving ? 0.6 : 1,
            }}
          >
            Save (use GPS)
          </button>
        </div>

        <div style={{ marginTop: 12 }}>
          <button
            onClick={clearHome}
            disabled={saving}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.12)",
              opacity: saving ? 0.6 : 1,
            }}
          >
            Clear home location
          </button>

          <div style={{ marginTop: 10, fontSize: 13, opacity: 0.75 }}>
            Note: l’input “address” est un label pour l’instant. Pour convertir une adresse en lat/lng,
            il faudra ajouter un geocoding (Mapbox/Google/Nominatim) ou un picker sur la map.
          </div>
        </div>
      </div>
    </div>
  );
}
