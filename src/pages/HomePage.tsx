// src/pages/HomePage.tsx
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import MapView from "../components/map/MapView";
import Sidebar from "../layouts/Sidebar";
import { fetchIncidents, type Incident } from "../components/services/incidents";
import { fetchPdqs, type Pdq } from "../components/services/pdq";
import IncidentFeed from "../components/ui/IncidentFeed";

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

export default function HomePage() {
  const { isSignedIn, getToken } = useAuth();
  const apiBase = import.meta.env.VITE_API_BASE ?? "http://localhost:3000";

  // Base datasets (Latest - used for Sidebar options)
  const [allIncidents, setAllIncidents] = useState<Incident[]>([]);
  const [pdqs, setPdqs] = useState<Pdq[]>([]);
  const [loading, setLoading] = useState(true);

  // Near-you dataset (for map when Near tab active)
  const [nearIncidents, setNearIncidents] = useState<Incident[]>([]);
  const [nearLoading, setNearLoading] = useState(false);
  const [nearError, setNearError] = useState<string>("");

  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const [feedTab, setFeedTab] = useState<"latest" | "home">("latest");
  const [syncedUser, setSyncedUser] = useState(false);

  // store radius so we can pass it to IncidentFeed
  const [homeRadiusM, setHomeRadiusM] = useState<number | null>(null);
  const [homeStatus, setHomeStatus] = useState<HomeStatus>("unknown");

  // PDQ toggle
  const [showPdqs, setShowPdqs] = useState(true);

  // ---------------------------
  // Sync user to DB once signed-in (your existing route)
  // ---------------------------
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

  // If user signs out while on Near you
  useEffect(() => {
    if (!isSignedIn && feedTab === "home") {
      setFeedTab("latest");
      setHomeStatus("unknown");
      setNearIncidents([]);
      setNearError("");
      setHomeRadiusM(null);
    }
  }, [isSignedIn, feedTab]);

  // ---------------------------
  // Filters state
  // ---------------------------
  const [filters, setFilters] = useState<Filters>({
    years: new Set<number>(),
    months: new Set<number>(),
    categories: new Set<string>(),
  });

  // ---------------------------
  // Load base incidents + PDQs (options + latest map)
  // ---------------------------
  useEffect(() => {
    setLoading(true);

    Promise.all([fetchIncidents({ limit: 20000 }), fetchPdqs()])
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
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // ---------------------------
  // Available options (from base)
  // ---------------------------
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

  // Default select ALL once we have data
  useEffect(() => {
    if (!allIncidents.length) return;

    setFilters((f) => {
      if (f.years.size || f.months.size || f.categories.size) return f;

      return {
        years: new Set(availableYears),
        months: new Set<number>([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]),
        categories: new Set(availableCategories),
      };
    });
  }, [allIncidents.length, availableYears, availableCategories]);

  // ---------------------------
  // Sidebar "All" helpers
  // ---------------------------
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

  // ---------------------------
  // Auth helper
  // ---------------------------
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

  // ---------------------------
  // Fetch Near you when tab is active (for the MAP)
  // - uses your backend route: GET /api/me/incidents?mode=home&limit=...
  // - backend already caps limit to 200
  // ---------------------------
  useEffect(() => {
    if (!isSignedIn || feedTab !== "home") return;

    (async () => {
      try {
        setNearError("");
        setNearLoading(true);

        // /api/me returns { success, user: { profile } }
        const meJson = await authedJson(`${apiBase}/api/me`);
        const prof = (meJson as any)?.user?.profile as Profile | null;

        if (!prof || prof.homeLat == null || prof.homeLng == null) {
          setHomeStatus("unset");
          setHomeRadiusM(null);
          setNearIncidents([]);
          setNearError("Home location not set. Go to Dashboard → Save (use GPS).");
          return;
        }

        setHomeStatus("set");
        setHomeRadiusM(prof.homeRadiusM ?? null);

        const qs = new URLSearchParams();
        qs.set("mode", "home");
        qs.set("limit", "200");
        if (prof.homeRadiusM != null) qs.set("radiusM", String(prof.homeRadiusM));

        const json = await authedJson(`${apiBase}/api/me/incidents?${qs.toString()}`);

        // your route returns: { success, mode, home, items }
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
  }, [feedTab, isSignedIn, apiBase]);

  // ---------------------------
  // Active dataset for MAP:
  // - Near tab + home set => show near incidents
  // - otherwise show base incidents
  // ---------------------------
  const inNearTab = feedTab === "home" && isSignedIn;
  const canShowNear = inNearTab && homeStatus === "set";

  const activeIncidents = canShowNear ? nearIncidents : allIncidents;
  const activeLoading = inNearTab ? nearLoading : loading;

  // ---------------------------
  // Filter incidents for MAP
  // ---------------------------
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

  return (
    <div className="shell">
      <Sidebar
        incidents={allIncidents}
        pdqs={pdqs}
        loading={loading}
        availableYears={availableYears}
        availableCategories={availableCategories}
        filters={filters}
        setFilters={setFilters}
        filteredCount={filteredIncidents.length}
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
          incidents={filteredIncidents}
          pdqs={pdqs}
          loading={activeLoading}
          highlightedId={highlightedId}
          showPdqs={showPdqs}
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

            <button
              className={`right-tab ${feedTab === "home" ? "is-active" : ""}`}
              type="button"
              onClick={() => setFeedTab("home")}
              disabled={!isSignedIn}
              title={!isSignedIn ? "Sign in to use Near you" : undefined}
            >
              🔊 Near you {!isSignedIn ? "🔒" : ""}
            </button>
          </div>

          {inNearTab && nearError ? (
            <div style={{ padding: 12, fontSize: 13, opacity: 0.9 }}>
              {nearError}
            </div>
          ) : null}

          <IncidentFeed
            mode={!isSignedIn && feedTab === "home" ? "latest" : feedTab}
            radiusM={feedTab === "home" ? homeRadiusM : null}
            onHover={(id) => {
              if (id == null) return setHighlightedId(null);
              const n = typeof id === "string" ? Number(id) : id;
              setHighlightedId(Number.isFinite(n) ? n : null);
            }}
            filters={filters}
            limit={500}
          />
        </div>
      </main>
    </div>
  );
}
