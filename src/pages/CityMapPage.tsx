import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";

import MapView from "../components/map/MapView";
import Sidebar from "../layouts/Sidebar";
import IncidentFeed from "../components/ui/IncidentFeed";

import { fetchIncidents, type Incident } from "../components/services/incidents";
import { fetchPdqs, type Pdq } from "../components/services/pdq";
import { startSupportCheckout, type SupportTier } from "../components/services/payments";
export type CityKey = "mtl" | "nyc";

type CityConfig = {
  key: CityKey;
  title: string;
  subtitle: string;
  source?: string;
  city?: string;
  center: [number, number];
  bounds: [[number, number], [number, number]];
  initialZoom: number;
  minZoom: number;
  showPdqs: boolean;
  defaultShowPdqs: boolean;
  showNear: boolean;
  showDaySelector: boolean;
  defaultDate?: string;
  defaultDateMode: "day" | "month";
  defaultSelectAll: boolean;
  limit: number;
  defaultMapStyle: "streets" | "satellite";
  dataContext: {
    title: string;
    body: string;
  };
};

const CITY_CONFIGS: Record<CityKey, CityConfig> = {
  mtl: {
    key: "mtl",
    title: "CrimeVision",
    subtitle: "Montréal map",
    city: "montreal",
    center: [45.5017, -73.5673],
    bounds: [[45.35, -73.95], [45.72, -73.35]],
    initialZoom: 11,
    minZoom: 11,
    showPdqs: true,
    defaultShowPdqs: false,
    showNear: true,
    showDaySelector: false,
    defaultDateMode: "day",
    defaultSelectAll: false,
    limit: 30000,
    defaultMapStyle: "streets",
    dataContext: {
      title: "Montréal SPVM criminal acts",
      body: "This map uses public SPVM criminal acts data for incidents registered in Montréal. The source describes the dataset as the list of criminal acts recorded by the Service de police de la Ville de Montréal; CrimeVision checks it daily and keeps a one-day buffer so late source updates can settle before they appear here. The data includes offence categories, dates, time periods, PDQ values, and privacy-protected generalized locations rather than exact addresses.",
    },
  },
  nyc: {
    key: "nyc",
    title: "CrimeVision",
    subtitle: "New York City map",
    source: "nypd_complaints",
    city: "new_york",
    center: [40.7359, -73.9866],
    bounds: [[40.52, -74.12], [40.92, -73.7]],
    initialZoom: 11,
    minZoom: 11,
    showPdqs: false,
    defaultShowPdqs: false,
    showNear: false,
    showDaySelector: true,
    defaultDate: "2026-06-30",
    defaultDateMode: "day",
    defaultSelectAll: false,
    limit: 30000,
    defaultMapStyle: "streets",
    dataContext: {
      title: "NYPD complaint incidents",
      body: "This map uses NYPD complaint incident-level data from NYC Open Data. The current feed includes valid felony, misdemeanor, and violation crimes reported to the NYPD for complete quarters in the current year, while the historic feed covers prior years and is updated annually. CrimeVision shows offense category, occurrence and report timing, borough, precinct, location and premise details, and victim or suspect fields when the source provides them.",
    },
  },
};

type Filters = {
  years: Set<number>;
  months: Set<number>;
  categories: Set<string>;
};
function parseIncidentDate(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? null : d;
}
type Profile = {
  id: number;
  homeLat: number | null;
  homeLng: number | null;
  homeRadiusM: number | null;
};
type AnyObj = Record<string, unknown>;
type HomeStatus = "unknown" | "set" | "unset";
export default function CityMapPage({ city = "mtl" }: { city?: CityKey }) {
  const cityConfig = CITY_CONFIGS[city];
  const { isSignedIn, getToken } = useAuth();
  const apiBase = import.meta.env.VITE_API_BASE ?? "http://localhost:3000";

  const [allIncidents, setAllIncidents] = useState<Incident[]>([]);
  const [pdqs, setPdqs] = useState<Pdq[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(cityConfig.defaultDate ?? "");
  const [dateMode, setDateMode] = useState<"day" | "month">(cityConfig.defaultDateMode);

  const [nearIncidents, setNearIncidents] = useState<Incident[]>([]);
  const [nearLoading, setNearLoading] = useState(false);
  const [nearError, setNearError] = useState<string>("");
  const [nearRefresh, setNearRefresh] = useState(0);

  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const [feedTab, setFeedTab] = useState<"latest" | "home">("latest");
  const [syncedUser, setSyncedUser] = useState(false);
  const [homeRadiusM, setHomeRadiusM] = useState<number | null>(null);
  const [homeStatus, setHomeStatus] = useState<HomeStatus>("unknown");
  const [showPdqs, setShowPdqs] = useState(cityConfig.defaultShowPdqs);

  const [supportLoading, setSupportLoading] = useState<SupportTier | null>(null);
  const [supportError, setSupportError] = useState("");
  const initializedDefaultsForCity = useRef<string | null>(null);

  useEffect(() => {
    setSelectedDate(cityConfig.defaultDate ?? "");
    setDateMode(cityConfig.defaultDateMode);
    setShowPdqs(cityConfig.defaultShowPdqs);
    setFeedTab("latest");
    setHomeStatus("unknown");
    setNearIncidents([]);
    setNearError("");
    setHomeRadiusM(null);
    initializedDefaultsForCity.current = null;
    setFilters({ years: new Set<number>(), months: new Set<number>(), categories: new Set<string>() });
  }, [cityConfig.key, cityConfig.defaultDate, cityConfig.defaultDateMode, cityConfig.defaultShowPdqs]);

  useEffect(() => {
    if (!isSignedIn || syncedUser) return;

    (async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const res = await fetch(`${apiBase}/api/users/me`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        const text = await res.text();
        console.log("SYNC /api/users/me", res.status, text);
        if (!res.ok) throw new Error(text);
        setSyncedUser(true);
      } catch (err) {
        console.error("Failed to sync user to DB:", err);
      }
    })();
  }, [isSignedIn, getToken, syncedUser, apiBase]);

  useEffect(() => {
    if (!isSignedIn && feedTab === "home") {
      setFeedTab("latest");
      setHomeStatus("unknown");
      setNearIncidents([]);
      setNearError("");
      setHomeRadiusM(null);
    }
  }, [isSignedIn, feedTab]);
  const [filters, setFilters] = useState<Filters>({
    years: new Set<number>(),
    months: new Set<number>(),
    categories: new Set<string>(),
  });

  useEffect(() => {
    setLoading(true);

    const incidentParams = {
      limit: cityConfig.showDaySelector && dateMode === "month" ? 100000 : cityConfig.limit,
      source: cityConfig.source,
      city: cityConfig.city,
      date: cityConfig.showDaySelector && selectedDate ? (dateMode === "month" ? selectedDate.slice(0, 7) : selectedDate) : undefined,
      dateMode: cityConfig.showDaySelector ? dateMode : undefined,
    };

    Promise.all([
      fetchIncidents(incidentParams),
      cityConfig.showPdqs ? fetchPdqs() : Promise.resolve([]),
    ])
      .then(([incData, pdqData]) => {
        const cleanedIncidents = incData
          .map((x) => ({
            ...x,
            latitude: Number((x as any).latitude),
            longitude: Number((x as any).longitude),
          }))
          .filter(
            (x) =>
              Number.isFinite((x as any).latitude) &&
              Number.isFinite((x as any).longitude)
          );
        const cleanedPdqs = pdqData
          .map((p) => ({
            ...p,
            latitude: Number((p as any).latitude),
            longitude: Number((p as any).longitude),
          }))
          .filter(
            (p) =>
              Number.isFinite((p as any).latitude) &&
              Number.isFinite((p as any).longitude)
          );
        setAllIncidents(cleanedIncidents);
        setPdqs(cleanedPdqs);

        if (cityConfig.defaultSelectAll && initializedDefaultsForCity.current !== cityConfig.key) {
          const nextYears = new Set<number>();
          const nextMonths = new Set<number>();
          const nextCategories = new Set<string>();
          for (const inc of cleanedIncidents) {
            const d = parseIncidentDate((inc as any).date);
            if (d) {
              nextYears.add(d.getFullYear());
              nextMonths.add(d.getMonth());
            }
            nextCategories.add(String((inc as any).category ?? "Unknown"));
          }
          setFilters({ years: nextYears, months: nextMonths, categories: nextCategories });
          initializedDefaultsForCity.current = cityConfig.key;
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [cityConfig.city, cityConfig.defaultSelectAll, cityConfig.limit, cityConfig.showDaySelector, cityConfig.showPdqs, cityConfig.source, selectedDate, dateMode]);

  const availableYears = useMemo(() => {
    const s = new Set<number>();
    for (const inc of allIncidents) {
      const d = parseIncidentDate((inc as any).date);
      if (d) s.add(d.getFullYear());
    }
    return Array.from(s).sort((a, b) => b - a);
  }, [allIncidents]);

  const availableCategories = useMemo(() => {
    const s = new Set<string>();
    for (const inc of allIncidents) {
      const c = (inc as any).category ?? "Unknown";
      s.add(String(c));
    }
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [allIncidents]);

  useEffect(() => {
    if (!allIncidents.length || cityConfig.defaultSelectAll) return;

    setFilters((f) => {
      if (f.years.size || f.months.size || f.categories.size) return f;
      return { years: new Set(), months: new Set(), categories: new Set() };

    });
  }, [allIncidents.length, availableYears, availableCategories, cityConfig.defaultSelectAll]);
  const allMonthsSet = useMemo(
    () => new Set<number>([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]),
    []
  );
  const isAllYearsSelected = useMemo(() => {
    if (availableYears.length === 0) return false;
    if (filters.years.size !== availableYears.length) return false;
    for (const y of availableYears) if (!filters.years.has(y)) return false;
    return true;
  }, [filters.years, availableYears]);
  const isAllMonthsSelected = useMemo(() => {
    if (filters.months.size !== 12) return false;
    for (const m of allMonthsSet) if (!filters.months.has(m)) return false;
    return true;
  }, [filters.months, allMonthsSet]);
  const isAllCategoriesSelected = useMemo(() => {
    if (availableCategories.length === 0) return false;
    if (filters.categories.size !== availableCategories.length) return false;
    for (const c of availableCategories) if (!filters.categories.has(c)) return false;
    return true;
  }, [filters.categories, availableCategories]);
  const toggleAllYears = () => {
    setFilters((f) => ({
      ...f,
      years: isAllYearsSelected
        ? new Set<number>()
        : new Set<number>(availableYears),
    }));
  };
  const toggleAllMonths = () => {
    setFilters((f) => ({
      ...f,
      months: isAllMonthsSelected
        ? new Set<number>()
        : new Set<number>(allMonthsSet),
    }));
  };
  const toggleAllCategories = () => {
    setFilters((f) => ({
      ...f,
      categories: isAllCategoriesSelected
        ? new Set<string>()
        : new Set<string>(availableCategories),
    }));
  };

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
    let json: unknown = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {}

    if (!res.ok) {
      const maybeObj =
        (json && typeof json === "object"
          ? (json as AnyObj)
          : null) as AnyObj | null;
      throw new Error((maybeObj?.message as string) ?? text ?? `HTTP ${res.status}`);
    }

    return json;
  }
  useEffect(() => {
    if (!cityConfig.showNear || !isSignedIn || feedTab !== "home") return;

    (async () => {
      try {
        setNearError("");
        setNearLoading(true);
        const meJson = await authedJson(`${apiBase}/api/me`);
        const prof = (meJson as any)?.user?.profile as Profile | null;
        if (!prof || prof.homeLat == null || prof.homeLng == null) {
          setHomeStatus("unset");
          setHomeRadiusM(null);
          setNearIncidents([]);
          setNearError("Home location not set. Go to Dashboard => Save (use GPS).");
          return;
        }
        setHomeStatus("set");
        setHomeRadiusM(prof.homeRadiusM ?? null);
        const qs = new URLSearchParams();
        qs.set("mode", "home");
        qs.set("limit", "1000");
        if (prof.homeRadiusM != null) qs.set("radiusM", String(prof.homeRadiusM));
        const json = await authedJson(`${apiBase}/api/me/incidents?${qs.toString()}`);
        const items = Array.isArray((json as any)?.items) ? (json as any).items : [];
        const cleaned: Incident[] = items
          .map((o: any) => ({
            ...o,
            latitude: Number(o.latitude),
            longitude: Number(o.longitude),
          }))
          .filter(
            (x: any) =>
              Number.isFinite(x.latitude) && Number.isFinite(x.longitude)
          );

        setNearIncidents(cleaned);
      } catch (e: any) {
        setHomeStatus("unknown");
        setNearIncidents([]);
        setNearError(e?.message ?? String(e));
      } finally {
        setNearLoading(false);
      }
    })();
  }, [feedTab, isSignedIn, apiBase, nearRefresh, cityConfig.showNear]);

  const inNearTab = cityConfig.showNear && feedTab === "home" && isSignedIn;
  const canShowNear = inNearTab && homeStatus === "set";

  const activeIncidents = canShowNear ? nearIncidents : allIncidents;
  const activeLoading = inNearTab ? nearLoading : loading;

  const filteredIncidents = useMemo(() => {
    if (filters.years.size === 0) return [];
    if (filters.months.size === 0) return [];
    if (filters.categories.size === 0) return [];

    return activeIncidents.filter((inc) => {
      const d = parseIncidentDate((inc as any).date);
      const year = d ? d.getFullYear() : null;
      const month = d ? d.getMonth() : null;
      const category = String((inc as any).category ?? "Unknown");
      if (year === null || !filters.years.has(year)) return false;
      if (month === null || !filters.months.has(month)) return false;
      if (!filters.categories.has(category)) return false;

      return true;
    });
  }, [activeIncidents, filters]);

  async function handleSupportClick(tier: SupportTier) {
    try {
      setSupportError("");
      setSupportLoading(tier);
      await startSupportCheckout(getToken, tier);
    } catch (e: any) {
      setSupportError(e?.message ?? "Unable to open Stripe Checkout.");
      setSupportLoading(null);
    }
  }
  return (
    <div className="city-page">
      <section className="data-context" aria-label={`${cityConfig.subtitle} data context`}>
        <div className="data-context-eyebrow">Data shown here</div>
        <div className="data-context-title">{cityConfig.dataContext.title}</div>
        <p>{cityConfig.dataContext.body}</p>
      </section>

      <div className="shell">
      <Sidebar
        title={cityConfig.title}
        subtitle={cityConfig.subtitle}
        incidents={activeIncidents}
        pdqs={pdqs}
        loading={loading}
        availableYears={availableYears}
        availableCategories={availableCategories}
        filters={filters}
        setFilters={setFilters}
        filteredCount={filteredIncidents.length}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        dateMode={dateMode}
        setDateMode={setDateMode}
        showDaySelector={cityConfig.showDaySelector}
        showLayerControls={cityConfig.showPdqs}
        showPdqs={showPdqs}
        setShowPdqs={setShowPdqs}
        isAllYearsSelected={isAllYearsSelected}
        isAllMonthsSelected={isAllMonthsSelected}
        isAllCategoriesSelected={isAllCategoriesSelected}
        toggleAllYears={toggleAllYears}
        toggleAllMonths={toggleAllMonths}
        toggleAllCategories={toggleAllCategories}
      />

      <main className="main">
        <MapView
          key={cityConfig.key}
          incidents={filteredIncidents}
          pdqs={pdqs}
          loading={activeLoading}
          highlightedId={highlightedId}
          showPdqs={showPdqs}
          center={cityConfig.center}
          bounds={cityConfig.bounds}
          initialZoom={cityConfig.initialZoom}
          minZoom={cityConfig.minZoom}
          defaultStyle={cityConfig.defaultMapStyle}
        />

        <div className="right-panel">
          
          <div className="right-tabs">
            <button
              className={`right-tab ${feedTab === "latest" ? "is-active" : ""}`}
              type="button"
              onClick={() => {
                setNearError("");
                setFeedTab("latest");
              }}
            >
              🧿 Latest
            </button>

            {cityConfig.showNear ? (
            <button
              className={`right-tab ${feedTab === "home" ? "is-active" : ""}`}
              type="button"
              onClick={() => {
                setNearError("");
                setFeedTab("home");
                setNearRefresh((n) => n + 1);
              }}
              disabled={!isSignedIn}
              title={!isSignedIn ? "Sign in to use Near you" : undefined}
            >
              🔊 Near you {!isSignedIn ? "🔒" : ""}
            </button>
            ) : null}

          </div>
          
          
          {inNearTab && nearError ? (
            <div style={{ padding: 12, fontSize: 13, opacity: 0.9 }}>
              {nearError}
            </div>
          ) : null}

          
          {inNearTab && homeStatus === "set" ? (
            <div style={{ padding: "0 12px 12px", fontSize: 13, opacity: 0.9 }}>
              Radius: {homeRadiusM ?? "default"} m
            </div>
          ) : null}

          <section className="support-panel" aria-label="Support CrimeVision">
            <div className="support-panel-title">Support CrimeVision</div>
            <div className="support-panel-copy">
              Help keep alerts, maps, and data imports moving.
            </div>
            <div className="support-actions">
              {[
                { tier: "support_1" as const, label: "$1" },
                { tier: "support_5" as const, label: "$5" },
                { tier: "support_10" as const, label: "$10" },
              ].map((item) => (
                <button
                  key={item.tier}
                  className="support-button"
                  type="button"
                  onClick={() => handleSupportClick(item.tier)}
                  disabled={supportLoading !== null}
                >
                  {supportLoading === item.tier ? "Opening..." : item.label}
                </button>
              ))}
            </div>
            {supportError ? <div className="support-error">{supportError}</div> : null}
          </section>

          
          <IncidentFeed
            incidents={filteredIncidents}
            onHover={(id) => {
              if (id == null) return setHighlightedId(null);
              const n = typeof id === "string" ? Number(id) : id;
              setHighlightedId(Number.isFinite(n) ? n : null);
            }}
          />

        </div>
      </main>
      </div>
    </div>
  );
}
