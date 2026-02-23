
// ===============================
// IMPORTS
// ===============================

// useState : gérer l'état local (inputs, profile, loading)
// useEffect : exécuter un effet au montage (fetch initial du profil)

import { useEffect, useState } from "react";

// Hook Clerk pour récupérer le JWT côté client (auth front)
import { useAuth } from "@clerk/clerk-react";


// ===============================
// TYPES
// ===============================

// Typage du profil utilisateur côté frontend
// homeLat/homeLng/homeRadiusM sont null quand l’utilisateur n’a pas défini de "home"

type Profile = {
  id: number;
  homeLat: number | null;
  homeLng: number | null;
  homeRadiusM: number | null;
};


// ===============================
// COMPONENT
// ===============================
export default function DashboardPage() {

  // Clerk expose getToken() pour obtenir un JWT valide de l'utilisateur connecté
  // Ce token sera envoyé au backend dans Authorization: Bearer <token>
  const { getToken } = useAuth();

  // Base URL du backend (dev/local par défaut)
  // import.meta.env = variables Vite (ex: VITE_API_BASE)
  const apiBase = import.meta.env.VITE_API_BASE ?? "http://localhost:3000";

  // ===============================
  // STATE (données)
  // ===============================

  // Profil récupéré depuis /api/me (ou null si pas encore chargé / pas existant)
  const [profile, setProfile] = useState<Profile | null>(null);

  // ===============================
  // STATE (UI)
  // ===============================

  // Champ texte "address" : pour l'instant c'est juste un label (pas de geocoding)
  const [address, setAddress] = useState(""); // input texte (label pour l’instant)

  // Rayon (en mètres) utilisé pour filtrer les incidents autour du domicile
  const [radius, setRadius] = useState<number>(400);

  // Message de feedback utilisateur (loading, erreurs, succès)
  const [status, setStatus] = useState<string>("");

  // Flag pour désactiver les boutons pendant les requêtes (évite double submit)
  const [saving, setSaving] = useState(false);

  // ===============================
  // HELPERS (réseau / formatting)
  // ===============================

  // Helper générique:
  // - récupère le token Clerk
  // - fait une requête fetch avec Authorization Bearer
  // - parse la réponse JSON (ou texte)
  // - lance une erreur si HTTP non-OK
  async function authedJson(url: string, init: RequestInit = {}) {
    const token = await getToken();
    if (!token) throw new Error("No Clerk token (not signed in)");

    const res = await fetch(url, {
      ...init,
      headers: {
        // Auth backend: le backend vérifie ce JWT Clerk
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(init.headers ?? {}),
      },
    });

    // On lit en texte d'abord pour gérer proprement JSON ou non-JSON
    const text = await res.text();
    let json: any = null;

    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      // Si ce n'est pas du JSON valide, on ignore (on garde text)
    }

    // En cas d'erreur HTTP: message JSON si disponible, sinon texte brut
    if (!res.ok) throw new Error(json?.message ?? text ?? `HTTP ${res.status}`);
    return json;
  }

  // Helper d'affichage: montre "null" si home non défini,
  // sinon montre lat/lng et radius arrondi pour lecture rapide
  function fmtHome(p: Profile | null) {
    if (p?.homeLat == null || p?.homeLng == null) return "null";
    return `${p.homeLat.toFixed(6)}, ${p.homeLng.toFixed(6)} (r=${p.homeRadiusM ?? 400}m)`;
  }

  // Récupère la position GPS via l'API navigateur (permission requise)
  // Retourne une Promise pour pouvoir await (plus simple dans les actions)
  function getBrowserLocation() {
    return new Promise<{ lat: number; lng: number }>((resolve, reject) => {

      // Vérifie que le navigateur supporte la géolocalisation
      if (!("geolocation" in navigator)) {
        reject(new Error("Geolocation not supported by this browser"));
        return;
      }

      // getCurrentPosition = API asynchrone basée sur callbacks
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        (err) => reject(err),

        // Options: précision + timeout (évite bloquer indéfiniment)
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }

  // Clamp du radius pour respecter les bornes UI et éviter valeurs invalides
  // -> garantit une donnée "safe" côté frontend avant envoi au backend
  function clampRadius(v: number) {
    // mêmes limites que l'input
    const min = 50;
    const max = 5000;
    if (!Number.isFinite(v)) return 400;
    return Math.max(min, Math.min(max, v));
  }

  // ===============================
  // EFFECT (chargement initial)
  // ===============================

  // useEffect avec [] = s'exécute une seule fois au montage du composant
  // Ici: on charge le profil utilisateur depuis /api/me
  useEffect(() => {
    (async () => {
      try {
        setStatus("Loading profile...");

        // GET /api/me -> renvoie les infos user + profile
        const json = await authedJson(`${apiBase}/api/me`);

        // On extrait le profile, ou null si le backend n'en a pas
        const p = (json?.user?.profile ?? null) as Profile | null;

        // On met à jour le state React
        setProfile(p);

        // On initialise le radius UI avec celui du profil (ou défaut)
        setRadius(clampRadius(p?.homeRadiusM ?? 400));

        // On efface le message de statut
        setStatus("");
      } catch (e: any) {

        // Gestion d’erreur lisible côté UI
        setStatus(`Failed to load: ${e?.message ?? String(e)}`);
      }
    })();
    
  }, []);

  // ===============================
  // ACTIONS (CRUD UserProfile)
  // ===============================

  // UPDATE home via GPS:
  // 1) demande la position GPS (navigateur)
  // 2) PATCH /api/me/home avec homeLat/homeLng/homeRadiusM
  // 3) met à jour profile dans le state
  async function saveHomeWithGPS() {
    try {
      setSaving(true);
      setStatus("Getting GPS location...");

      // Récupère lat/lng via navigateur
      const { lat, lng } = await getBrowserLocation();

      setStatus("Saving home location...");

      // PATCH = update partiel des champs du profil
      const json = await authedJson(`${apiBase}/api/me/home`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeLat: lat,
          homeLng: lng,
          homeRadiusM: clampRadius(radius),
        }),
      });
      
      // Met à jour localement le profil sans re-fetch complet
      setProfile(json?.profile ?? null);

      // Feedback utilisateur
      setStatus("Saved ✅");
      setTimeout(() => setStatus(""), 1500);
    } catch (e: any) {
      setStatus(`Save failed: ${e?.message ?? String(e)}`);
    } finally {
      setSaving(false);
    }
  }

  // "DELETE logique":
  // Au lieu de supprimer une ligne, on reset les champs home à null
  // -> correspond à ton choix CRUD documenté (clear = unset)
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

          // On conserve un radius valide même si home est null
          // (utile si l’utilisateur réactive plus tard)
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

  // Re-fetch manuel du profil (bouton Refresh)
  // Utile si d'autres écrans ou actions modifient le profil
  async function refresh() {
    try {
      setStatus("Refreshing...");
      const json = await authedJson(`${apiBase}/api/me`);
      const p = (json?.user?.profile ?? null) as Profile | null;

      setProfile(p);

      // Si le profil a un radius on le prend,
      // sinon on garde celui déjà dans l'UI
      setRadius(clampRadius(p?.homeRadiusM ?? radius));
      setStatus("");
    } catch (e: any) {
      setStatus(`Refresh failed: ${e?.message ?? String(e)}`);
    }
  }


  // ===============================
  // RENDER (UI)
  // ===============================
  return (

    // Wrapper simple (inline styles) pour centrer et espacer
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>

      {/* Header Dashboard + bouton refresh */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Dashboard</h2>

        {/* disabled = empêche refresh pendant save/clear */}
        <button onClick={refresh} disabled={saving} style={{ opacity: saving ? 0.6 : 1 }}>
          Refresh
        </button>
      </div>

      {/* Zone d'état: home actuel + status */}
      <div style={{ marginTop: 10, opacity: 0.85 }}>
        <div>
          <b>Current home:</b> {fmtHome(profile)}
        </div>

        {/* Affiche le statut seulement si non vide */}
        {status ? (
          <div style={{ marginTop: 6, fontSize: 13, opacity: 0.9 }}>{status}</div>
        ) : null}
      </div>
      
      {/* Card "Set home location" */}
      <div
        style={{
          marginTop: 18,
          padding: 16,
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 12,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 10 }}>Set home location</div>

        {/* Section inputs: adresse + radius + bouton save */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>

          {/* Adresse (non utilisée encore): sert de futur hook pour geocoding */}
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

          {/* Radius input: borné + step pour UX stable */}
          <input
            type="number"
            value={radius}
            min={50}
            max={5000}
            step={50}
            onChange={(e) => {
              // Conversion string -> number + clamp
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

          {/* Action principale: sauvegarder via GPS */}
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
        
        {/* Action secondaire: clear (unset) */}
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
          
          {/* Note technique: justification du design / futur geocoding */}
          <div style={{ marginTop: 10, fontSize: 13, opacity: 0.75 }}>
            
          </div>
        </div>
      </div>
    </div>
  );
}
