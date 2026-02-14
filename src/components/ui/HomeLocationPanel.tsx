import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";

type Props = {
  apiBase: string;              // e.g. "http://localhost:3000"
  defaultRadiusM?: number;      // optional
  onSaved?: () => void;         // call to refresh home feed
};

async function geocodeAddress(address: string) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
    address
  )}`;

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const data = await res.json();

  if (!data?.[0]) return null;

  return { lat: Number(data[0].lat), lng: Number(data[0].lon) };
}

export default function HomeLocationPanel({
  apiBase,
  defaultRadiusM = 400,
  onSaved,
}: Props) {
  const { isSignedIn, getToken } = useAuth();

  const [address, setAddress] = useState("");
  const [radiusM, setRadiusM] = useState(defaultRadiusM);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const save = async () => {
    setMsg(null);
    setSaving(true);

    try {
      if (!isSignedIn) {
        throw new Error("You must be signed in to save a home location.");
      }

      const coords = await geocodeAddress(address.trim());
      if (!coords) throw new Error("Address not found. Try adding city/zipcode.");

      const token = await getToken();

      const res = await fetch(`${apiBase}/api/me/home`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          homeLat: coords.lat,
          homeLng: coords.lng,
          homeRadiusM: radiusM,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text.slice(0, 200) || `HTTP ${res.status}`);
      }

      setMsg("✅ Home location saved.");
      onSaved?.();
    } catch (e) {
      setMsg(e instanceof Error ? `⚠️ ${e.message}` : "⚠️ Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="home-location-panel">
      <div className="home-location-title">Set home location</div>

      <div className="home-location-row">
        <input
          className="home-location-input"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter your address…"
        />

        <input
          className="home-location-radius"
          type="number"
          min={50}
          step={50}
          value={radiusM}
          onChange={(e) => setRadiusM(Number(e.target.value))}
          title="Radius (meters)"
        />

        <button
          className="home-location-save"
          onClick={save}
          disabled={saving || !address.trim()}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {msg && <div className="home-location-msg">{msg}</div>}
    </div>
  );
}
