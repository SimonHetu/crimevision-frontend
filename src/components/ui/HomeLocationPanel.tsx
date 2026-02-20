
// HomeLocationPanel.tsx permet à l’utilisateur de définir une “home location” (adresse + rayon)
// Définit :
//   - Un champ d’adresse (texte) + un champ de rayon (mètres)
//   - Un geocoding (adresse -> latitude/longitude) via Nominatim (OpenStreetMap)
//   - Un enregistrement du profil côté backend (PATCH /api/me/home) avec token Clerk
//   - Un feedback UI (Saving..., message succès/erreur) + callback onSaved pour refresh ailleurs

// =========================================================
// IMPORTS
// =========================================================

// useState : états locaux du formulaire (adresse, rayon, saving, message)
import { useState } from "react";

// useAuth (Clerk) : permet de savoir si l’utilisateur est connecté et de récupérer le token
import { useAuth } from "@clerk/clerk-react";


// =========================================================
// TYPES : Props
// =========================================================

type Props = {
  // Base URL de l’API backend (dev/prod)
  apiBase: string;              // ex: "http://localhost:3000"
  defaultRadiusM?: number;      // Rayon par défaut (si non fourni, on met 400m)
  onSaved?: () => void;         // Callback optionnel après sauvegarde (ex: refresh du feed / re-fetch profil)
};


// =========================================================
// FONCTION UTILITAIRE : geocodeAddress
// =========================================================

// Convertit une adresse texte en coordonnées (lat/lng)
// Utilise Nominatim (service OpenStreetMap) :
// - format=json : réponse JSON
// - limit=1 : on prend le meilleur match
// - q=... : adresse encodée

async function geocodeAddress(address: string) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
    address
  )}`;

  // Appel HTTP vers le service de geocoding
  const res = await fetch(url, { headers: { Accept: "application/json" } });

  // Transformation JSON -> objet JS
  const data = await res.json();

  // Si aucun résultat, on renvoie null
  if (!data?.[0]) return null;

  // Nominatim renvoie lat/lon en string, on convertit en number
  return { lat: Number(data[0].lat), lng: Number(data[0].lon) };
}

// =========================================================
// COMPOSANT : HomeLocationPanel
// =========================================================

export default function HomeLocationPanel({
  apiBase,
  defaultRadiusM = 400,
  onSaved,
}: Props) {

  // Clerk Auth :
  // - isSignedIn : état de connexion
  // - getToken : récupère un JWT pour appeler le backend protégé
  const { isSignedIn, getToken } = useAuth();

   // =========================================================
  // STATE : Formulaire + UI feedback
  // =========================================================

  // Adresse saisie par l’utilisateur
  const [address, setAddress] = useState("");

  // Rayon en mètres autour de la maison
  const [radiusM, setRadiusM] = useState(defaultRadiusM);

  // saving : empêche double clic et affiche "Saving..."
  const [saving, setSaving] = useState(false);

  // msg : message affiché (succès ou erreur)
  const [msg, setMsg] = useState<string | null>(null);

  // =========================================================
  // ACTION : save (adresse -> coords -> PATCH backend)
  // =========================================================
  const save = async () => {

    // Reset message + état loading
    setMsg(null);
    setSaving(true);

    try {

      // 1) Validation : utilisateur doit être connecté
      if (!isSignedIn) {
        throw new Error("You must be signed in to save a home location.");
      }

      // 2) Geocoding : convertir adresse en coords
      const coords = await geocodeAddress(address.trim());

      // Si aucune coord trouvée -> message clair
      if (!coords) throw new Error("Address not found. Try adding city/zipcode.");

      // 3) Auth : récupérer token Clerk (JWT)
      const token = await getToken();

      // 4) Requête backend : mise à jour du profil (PATCH)
      const res = await fetch(`${apiBase}/api/me/home`, {
        method: "PATCH",
        headers: {

          // On envoie un body JSON
          "Content-Type": "application/json",

          // Si token existe, on l’ajoute en Bearer
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          homeLat: coords.lat,
          homeLng: coords.lng,
          homeRadiusM: radiusM,
        }),
      });

      // 5) Gestion d’erreur HTTP : remonter un message utile
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text.slice(0, 200) || `HTTP ${res.status}`);
      }

      // 6) Succès : message + callback optionnel (refresh ailleurs)
      setMsg("✅ Home location saved.");
      onSaved?.();
    } catch (e) {

      // Erreur : message user-friendly (avec emoji pour visibilité)
      setMsg(e instanceof Error ? `⚠️ ${e.message}` : "⚠️ Failed to save.");
    } finally {

      // Fin : on retire l’état saving même en cas d’erreur
      setSaving(false);
    }
  };

  // =========================================================
  // RENDER : UI formulaire
  // =========================================================
  return (
    <div className="home-location-panel">
      <div className="home-location-title">Set home location</div>

      <div className="home-location-row">

        {/* Input adresse */}
        <input
          className="home-location-input"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter your address…"
        />

         {/* Input rayon (mètres) */}
        <input
          className="home-location-radius"
          type="number"
          min={50}
          step={50}
          value={radiusM}
          onChange={(e) => setRadiusM(Number(e.target.value))}
          title="Radius (meters)"
        />

        {/* Bouton Save */}
        <button
          className="home-location-save"
          onClick={save}
          disabled={saving || !address.trim()} // désactive si saving ou adresse vide
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {/* Message feedback */}
      {msg && <div className="home-location-msg">{msg}</div>}
    </div>
  );
}
