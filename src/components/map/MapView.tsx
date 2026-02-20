// MapView.tsx affiche la carte principale de l’application (Leaflet)
// Définit :
//   - Le fond de carte (streets / satellite)
//   - L’affichage des incidents (points rouges) + un incident “highlight”
//   - L’affichage optionnel des PDQ (postes de quartier)
//   - Une logique “anti-overlap” (jitter) pour séparer visuellement les points identiques
//   - L’affichage optionnel d’un cercle “Near you” (rayon autour de la maison) (PRESENTEMENT SEULEMENT INCIDENT)

// =========================================================
// IMPORTS
// =========================================================

// Composants React-Leaflet pour construire une carte interactive
import { MapContainer, TileLayer, CircleMarker, Tooltip, Circle } from "react-leaflet";

// Hooks React : useState (état local), useMemo (calculs mémorisés)
import { useMemo, useState } from "react";

// Types de données (garantit la structure des objets incidents / pdqs)
import type { Pdq } from "../services/pdq";
import type { Incident } from "../services/incidents";

// =========================================================
// HOOK UTILITAIRE : lire une variable CSS en sécurité
// =========================================================
// Objectif : récupérer les couleurs définies dans :root (ex: --accent-01)
// - “safe guard” : évite bug si window n’existe pas (SSR) ou si var vide
// - “memoized” : recalcul seulement si name/fallback changent
function useCssVar(name: string, fallback: string) {
  return useMemo(() => {
    if (typeof window === "undefined") return fallback;

    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }, [name, fallback]);
}

// =========================================================
// JITTER : gérer le "jitter" (anti-overlap des points)
// =========================================================

// coordKey : crée une clé stable pour grouper les incidents
// -> deux incidents au même endroit (avec arrondi) vont dans le même groupe
function coordKey(lat: number, lng: number, decimals = 5) {
  const f = 10 ** decimals;
  return `${Math.round(lat * f) / f},${Math.round(lng * f) / f}`;
}

// hashToUnit : transforme une string (id) en nombre entre 0 et 1
// -> sert à donner un angle déterministe à chaque point (stable à chaque rendu)
function hashToUnit(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

// metersToDegrees : Leaflet utilise degrés lat/lng, mais le jitter est en mètres
// -> convertit “mètres” en “degrés” en tenant compte de la latitude
function metersToDegrees(m: number, lat: number) {
  const latDeg = m / 111_320;
  const lngDeg = m / (111_320 * Math.cos((lat * Math.PI) / 180));
  return { latDeg, lngDeg };
}


// =========================================================
// CONSTANTES : Montréal (centre + limites)
// =========================================================
const MTL_CENTER: [number, number] = [45.5017, -73.5673];

// Empêche de pan trop loin : la carte est "clamp" dans ce rectangle
const MTL_BOUNDS: [[number, number], [number, number]] = [
  [45.35, -73.95],
  [45.72, -73.35],
];


// =========================================================
// TYPES : Props du composant MapView
// =========================================================
type Props = {

  // Données à afficher
  incidents: Incident[];
  pdqs: Pdq[];
  loading: boolean;

  // ID d’un incident “survolé” depuis un panneau (sidebar / feed)
  highlightedId?: number | null;

  // Afficher/cacher les PDQ
  showPdqs?: boolean;

  // Données pour le cercle "Near you" (centre + rayon)
  homeLat?: number | null;
  homeLng?: number | null;
  homeRadiusM?: number | null;
  showHomeCircle?: boolean; // Toggle pour dessiner ou non le cercle
};


// =========================================================
// COMPOSANT MAPVIEW
// =========================================================
export default function MapView({
  incidents,
  pdqs,
  loading,
  highlightedId,
  showPdqs = true,
  homeLat = null,
  homeLng = null,
  homeRadiusM = null,
  showHomeCircle = false,
}: Props) {

  // État local : style de carte (fond)
  // - "streets"   : OpenStreetMap
  // - "satellite" : Esri imagery
  const [style, setStyle] = useState<"streets" | "satellite">("satellite");

  // Lecture des couleurs depuis CSS (évite valeurs vides -> fallback)
  const accent01 = useCssVar("--accent-01", "#2cb1fe");
  const accent02 = useCssVar("--accent-02", "#6380fe");


  // =========================================================
  // CALCUL MÉMORISÉ : incidents "jittered"
  // =========================================================
  // Objectif : si plusieurs incidents ont exactement les mêmes coords,
  // on les “écarte” légèrement (jitter) pour qu’ils soient visibles.
  // - Grouping : incidents groupés par coordKey (lat/lng arrondis)
  // - Si groupe = 1 -> pas de jitter
  // - Si groupe > 1 -> on place chaque point sur un mini cercle autour du centre
  const jitteredIncidents = useMemo(() => {
    const groups = new Map<string, Incident[]>();

    // 1) Regrouper les incidents par coordonnée (arrondie)
    for (const inc of incidents) {
      const key = coordKey(inc.latitude, inc.longitude, 5);
      const arr = groups.get(key) ?? [];
      arr.push(inc);
      groups.set(key, arr);
    }

    // 2) Construire la liste finale avec jLat/jLng (position affichée)
    const out: Array<Incident & { jLat: number; jLng: number; groupSize: number }> = [];

    for (const arr of groups.values()) {

      // Cas simple : un seul incident au point -> pas de déplacement
      if (arr.length === 1) {
        const inc = arr[0];
        out.push({ ...inc, jLat: inc.latitude, jLng: inc.longitude, groupSize: 1 });
        continue;
      }

      // Cas overlap : plusieurs incidents -> jitter en mètres
      const baseM = 12;
      const radiusM = Math.min(30, baseM + arr.length);

      for (const inc of arr) {

        // Angle stable basé sur inc.id (évite que ça bouge à chaque render)
        const u = hashToUnit(String(inc.id));
        const angle = u * Math.PI * 2;

        // Convertit le rayon (mètres) en degrés lat/lng
        const { latDeg, lngDeg } = metersToDegrees(radiusM, inc.latitude);

        // Position jittered : petite variation autour du point original
        const jLat = inc.latitude + Math.sin(angle) * latDeg;
        const jLng = inc.longitude + Math.cos(angle) * lngDeg;

        out.push({ ...inc, jLat, jLng, groupSize: arr.length });
      }
    }

    return out;
  }, [incidents]);

  // =========================================================
  // VALIDATION : est-ce qu’on peut dessiner le cercle “Near you” ?
  // =========================================================
  // On s’assure que :
  // - le toggle est activé
  // - homeLat/homeLng sont des nombres valides
  // - le rayon est un nombre > 0

  const canDrawHomeCircle =
    showHomeCircle &&
    typeof homeLat === "number" &&
    typeof homeLng === "number" &&
    Number.isFinite(homeLat) &&
    Number.isFinite(homeLng) &&
    typeof homeRadiusM === "number" &&
    Number.isFinite(homeRadiusM) &&
    homeRadiusM > 0;

  // =========================================================
  // RENDER : UI + Leaflet map
  // =========================================================
  return (
    <div className="map-wrapper">

      {/* -----------------------------------------------------
          CONTROLS (bouton style + status)
         ----------------------------------------------------- */}
      <div className="map-controls">
        <button
          className="map-btn"
          onClick={() => setStyle(style === "streets" ? "satellite" : "streets")}
          type="button"
        >
          {style === "streets" ? "Satellite" : "Streets"}
        </button>

        {loading && <span className="map-status">Loading…</span>}
        {!loading && (
          <span className="map-status">
            {incidents.length} incidents • {pdqs.length} PDQs
          </span>
        )}
      </div>
      
      {/* -----------------------------------------------------
          MAP CONTAINER (Leaflet)
         ----------------------------------------------------- */}
      <MapContainer
        center={MTL_CENTER}
        zoom={11}
        className="map"
        maxBounds={MTL_BOUNDS}
        maxBoundsViscosity={1.0}
        minZoom={11}
        maxZoom={18}
        zoomControl={false}
        attributionControl={false}
      > 
        {/* Fond de carte selon le style */}
        {style === "streets" ? (
          // Streets : OpenStreetMap
          <TileLayer
            attribution="© OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={20}
            maxNativeZoom={19}
          />
        ) : (

          // Satellite : Esri World Imagery
          <TileLayer
            attribution="Tiles © Esri"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={20}
            maxNativeZoom={19}
          />
        )}

        {/* -----------------------------------------------------
            CERCLE "Near you" (optionnel)
           ----------------------------------------------------- */}
        {canDrawHomeCircle && (
          <Circle
            center={[homeLat!, homeLng!]}
            radius={homeRadiusM!}
            pathOptions={{
              color: accent01,
              weight: 2,
              fillColor: accent01,
              fillOpacity: 0.12,
            }}
          />
        )}

        {/* -----------------------------------------------------
            INCIDENTS NORMAUX (non-highlight)
           ----------------------------------------------------- */}
        {jitteredIncidents
          .filter((inc) => inc.id !== highlightedId)
          .map((inc) => (
            <CircleMarker
              key={`inc-${inc.id}`}
              center={[inc.jLat, inc.jLng]}
              radius={5}
              pathOptions={{
                color: "#f74646",
                weight: 2,
                fillColor: "#ff2929",
                fillOpacity: 0.5,
              }}
            > 
              {/* Tooltip au survol */}
              <Tooltip direction="top" offset={[0, -6]} opacity={1}>
                <div>
                  <div>{inc.category ?? "Unknown"}</div>
                  <div>{inc.date ?? ""}</div>
                  <div>id: {inc.id}</div>

                  {/* groupSize : indique combien de points se superposaient */}
                  {(inc as any).groupSize > 1 && (
                    <div>Overlaps here: {(inc as any).groupSize}</div>
                  )}
                </div>
              </Tooltip>
            </CircleMarker>
          ))}

      {/* -----------------------------------------------------
            INCIDENT HIGHLIGHT (rendered last = au-dessus)
           ----------------------------------------------------- */}
      {jitteredIncidents
        .filter((inc) => inc.id === highlightedId)
        .map((inc) => (
          <CircleMarker
            key={`highlight-${inc.id}`}
            center={[inc.jLat, inc.jLng]}
            radius={12}
            pathOptions={{
              color: accent02,
              weight: 4,
              fillColor: accent02,
              fillOpacity: 0.95,
            }}
          >
            <Tooltip direction="top" offset={[0, -6]} opacity={1}>
              <div>
                <div>{inc.category ?? "Unknown"}</div>
                <div>{inc.date ?? ""}</div>
                <div>id: {inc.id}</div>
                {(inc as any).groupSize > 1 && (
                  <div>Overlaps here: {(inc as any).groupSize}</div>
                )}
              </div>
            </Tooltip>
          </CircleMarker>
        ))}


        {/* -----------------------------------------------------
            PDQs (toggleable)
           ----------------------------------------------------- */}
        {showPdqs &&
          pdqs.map((p) => (
            <CircleMarker
              key={`pdq-${p.id}`}
              center={[p.latitude, p.longitude]}
              radius={7}
              pathOptions={{
                color: "aqua",
                fillColor: "#4177ff",
                fillOpacity: 0.8,
                weight: 2,
              }}
            >
              <Tooltip direction="top" opacity={1}>
                PDQ {p.id}
              </Tooltip>
            </CircleMarker>
          ))}
      </MapContainer>
    </div>
  );
}
