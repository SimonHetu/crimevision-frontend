import { MapContainer, TileLayer, CircleMarker, Tooltip, Circle } from "react-leaflet";
import { useMemo, useState } from "react";
import type { Pdq } from "../services/pdq";
import type { Incident } from "../services/incidents";


function getCssVar(name: string) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}

const accent01 = getCssVar("--accent-01");
const accent02 = getCssVar("--accent-02");


// --- jitter helpers ---
function coordKey(lat: number, lng: number, decimals = 5) {
  const f = 10 ** decimals;
  return `${Math.round(lat * f) / f},${Math.round(lng * f) / f}`;
}

function hashToUnit(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

function metersToDegrees(m: number, lat: number) {
  const latDeg = m / 111_320;
  const lngDeg = m / (111_320 * Math.cos((lat * Math.PI) / 180));
  return { latDeg, lngDeg };
}
// ----------------------

const MTL_CENTER: [number, number] = [45.5017, -73.5673];
const MTL_BOUNDS: [[number, number], [number, number]] = [
  [45.35, -73.95],
  [45.72, -73.35],
];

type Props = {
  incidents: Incident[];
  pdqs: Pdq[];
  loading: boolean;
  highlightedId?: number | null;

  showPdqs?: boolean;

  //  Near-you circle
  homeLat?: number | null;
  homeLng?: number | null;
  homeRadiusM?: number | null;
  showHomeCircle?: boolean;
};

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
  const [style, setStyle] = useState<"streets" | "satellite">("satellite");

  const jitteredIncidents = useMemo(() => {
    const groups = new Map<string, Incident[]>();

    for (const inc of incidents) {
      const key = coordKey(inc.latitude, inc.longitude, 5);
      const arr = groups.get(key) ?? [];
      arr.push(inc);
      groups.set(key, arr);
    }

    const out: Array<Incident & { jLat: number; jLng: number; groupSize: number }> = [];

    for (const arr of groups.values()) {
      if (arr.length === 1) {
        const inc = arr[0];
        out.push({ ...inc, jLat: inc.latitude, jLng: inc.longitude, groupSize: 1 });
        continue;
      }

      const baseM = 12;
      const radiusM = Math.min(30, baseM + arr.length);

      for (const inc of arr) {
        const u = hashToUnit(String(inc.id));
        const angle = u * Math.PI * 2;

        const { latDeg, lngDeg } = metersToDegrees(radiusM, inc.latitude);
        const jLat = inc.latitude + Math.sin(angle) * latDeg;
        const jLng = inc.longitude + Math.cos(angle) * lngDeg;

        out.push({ ...inc, jLat, jLng, groupSize: arr.length });
      }
    }

    return out;
  }, [incidents]);

  const canDrawHomeCircle =
    showHomeCircle &&
    typeof homeLat === "number" &&
    typeof homeLng === "number" &&
    Number.isFinite(homeLat) &&
    Number.isFinite(homeLng) &&
    typeof homeRadiusM === "number" &&
    Number.isFinite(homeRadiusM) &&
    homeRadiusM > 0;

  return (
    <div className="map-wrapper">
      <div className="map-controls">
        <button
          className="map-btn"
          onClick={() => setStyle(style === "streets" ? "satellite" : "streets")}
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
        {style === "streets" ? (
          <TileLayer
            attribution="© OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={20}
            maxNativeZoom={19}
          />
        ) : (
          <TileLayer
            attribution="Tiles © Esri"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={20}
            maxNativeZoom={19}
          />
        )}

        {/*  Home radius circle (Near you) */}
        {canDrawHomeCircle && (
          <Circle
            center={[homeLat!, homeLng!]}
            radius={homeRadiusM!} // meters
            pathOptions={{
              color: "#2cb1fe",
              weight: 2,
              fillColor: "#2cb1fe",
              fillOpacity: 0.12,
            }}
          />
        )}

        {/* Incidents (jittered) */}
        {jitteredIncidents.map((inc) => {
          const isHot = highlightedId != null && inc.id === highlightedId;

          return (
            <CircleMarker
              key={`inc-${inc.id}`}
              center={[inc.jLat, inc.jLng]}
              radius={isHot ? 11 : 5}
              pathOptions={{
                color: isHot ? accent02 : "#f74646",
                weight: isHot ? 4 : 2,
                fillColor: isHot ? accent02 : "#ff2929",
                fillOpacity: isHot ? 0.9 : 0.5,
              }}
            >
              <Tooltip direction="top" offset={[0, -6]} opacity={1}>
                <div>
                  <div>{inc.category ?? "Unknown"}</div>
                  <div>{inc.date ?? ""}</div>
                  <div>id: {inc.id}</div>
                  {(inc as any).groupSize > 1 && <div>Overlaps here: {(inc as any).groupSize}</div>}
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}

        {/* PDQs (toggleable) */}
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
