// src/components/ui/IncidentFeed.tsx
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/clerk-react";

type IncidentItem = {
  id: number | string;
  category: string;
  date: string;
  latitude: number | null;
  longitude: number | null;
  pdqId: number | null;
};

export type Filters = {
  years: Set<number>;
  months: Set<number>; // 0-11
  categories: Set<string>;
};

type Props = {
  mode: "latest" | "home";
  category?: string;
  limit?: number;
  onHover?: (id: number | string | null) => void;
  filters: Filters;
  radiusM?: number | null; // used only in home mode
};

function parseIncidentDate(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? null : d;
}

export default function IncidentFeed({
  mode,
  category,
  limit = 500,
  onHover,
  filters,
  radiusM,
}: Props) {
  const { isSignedIn, getToken } = useAuth();
  const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000";

  const [items, setItems] = useState<IncidentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // client-side filters (keeps behavior consistent with the map)
  const filteredItems = useMemo(() => {
    const hasYearFilter = filters.years.size > 0;
    const hasMonthFilter = filters.months.size > 0;
    const hasCategoryFilter = filters.categories.size > 0;

    return items.filter((it) => {
      const d = parseIncidentDate(it.date);
      const year = d ? d.getFullYear() : null;
      const month = d ? d.getMonth() : null;
      const cat = String(it.category ?? "Unknown");

      if (hasYearFilter && (year === null || !filters.years.has(year))) return false;
      if (hasMonthFilter && (month === null || !filters.months.has(month))) return false;
      if (hasCategoryFilter && !filters.categories.has(cat)) return false;

      return true;
    });
  }, [items, filters]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const qs = new URLSearchParams();
        qs.set("mode", mode);
        qs.set("limit", String(limit));

        // Send year/month filters to backend ONLY for latest,
        // so backend can fetch the right slice of data.
        if (mode === "latest") {
          if (filters.years.size > 0) {
            qs.set("years", Array.from(filters.years).join(","));
          }
          if (filters.months.size > 0) {
            qs.set("months", Array.from(filters.months).join(","));
          }
        }

        if (category) qs.set("category", category);
        if (mode === "home" && radiusM != null) qs.set("radiusM", String(radiusM));

        const path = `/api/me/incidents?${qs.toString()}`;
        console.log("IncidentFeed URL:", `${API_BASE}${path}`);

        // latest is public, home is auth — sending token is fine either way
        const token = isSignedIn ? await getToken() : null;

        const res = await fetch(`${API_BASE}${path}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        const text = await res.text();
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);

        let json: any = null;
        try {
          json = text ? JSON.parse(text) : null;
        } catch {
          throw new Error(`Expected JSON but got non-JSON: ${text.slice(0, 200)}`);
        }

        const nextItems = Array.isArray(json?.items) ? (json.items as IncidentItem[]) : [];

        if (!cancelled) setItems(nextItems);
      } catch (e) {
        console.error("IncidentFeed load failed:", e);
        if (!cancelled) {
          setItems([]);
          setError(e instanceof Error ? e.message : "Failed to load incidents.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [mode, category, limit, radiusM, isSignedIn, getToken, filters]);

  return (
    <div className="incident-feed" onMouseLeave={() => onHover?.(null)}>
      <div className="incident-feed-header">
        <small style={{ opacity: 0.75 }}>
          Showing {filteredItems.length} / {items.length}
        </small>
      </div>

      {loading && <p>Loading…</p>}
      {!loading && error && <p style={{ opacity: 0.9 }}>⚠️ {error}</p>}
      {!loading && !error && filteredItems.length === 0 && <p>No incidents found.</p>}

      {filteredItems.map((it) => (
        <div
          key={String(it.id)}
          className="incident-row"
          onMouseEnter={() => onHover?.(it.id)}
        >
          <b>{it.category}</b>
          <small>{new Date(it.date).toLocaleString()}</small>
        </div>
      ))}
    </div>
  );
}
