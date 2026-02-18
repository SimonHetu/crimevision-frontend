import React from "react";
import type { Incident } from "../components/services/incidents";
import type { Pdq } from "../components/services/pdq";
import logo from "../assets/crimevision_logo_10.png";


type Filters = {
  years: Set<number>;
  months: Set<number>;
  categories: Set<string>;
};

type Props = {
  incidents: Incident[];
  pdqs: Pdq[];
  loading: boolean;

  availableYears: number[];
  availableCategories: string[];

  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;

  filteredCount: number;

  // PDQ toggle
  showPdqs: boolean;
  setShowPdqs: React.Dispatch<React.SetStateAction<boolean>>;

  // "All" as a toggle (checked = everything selected)
  isAllYearsSelected: boolean;
  isAllMonthsSelected: boolean;
  isAllCategoriesSelected: boolean;

  toggleAllYears: () => void;
  toggleAllMonths: () => void;
  toggleAllCategories: () => void;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function toggleInSet<T>(set: Set<T>, value: T) {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

export default function Sidebar({
  incidents,
  pdqs,
  loading,
  availableYears,
  availableCategories,
  filters,
  setFilters,
  filteredCount,

  showPdqs,
  setShowPdqs,

  isAllYearsSelected,
  isAllMonthsSelected,
  isAllCategoriesSelected,
  toggleAllYears,
  toggleAllMonths,
  toggleAllCategories,
}: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title">CrimeVision</div>
        <div className="sidebar-subtitle">Montréal map</div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-label">Status</div>
        <div className="sidebar-card">
          {loading ? (
            <div>Loading…</div>
          ) : (
            <div>
              <div>
                {incidents.length} incidents • {pdqs.length} PDQs
              </div>
              <div style={{ marginTop: 6, opacity: 0.8 }}>
                Showing: <b>{filteredCount}</b>
              </div>
            </div>
          )}
        </div>
      </div>

      {/*  Map layers / PDQ toggle */}
      <div className="sidebar-section">
        <div className="sidebar-label">Map layers</div>
        <div className="sidebar-card">
          <label className="check" style={{ justifyContent: "space-between" }}>
            <span>PDQs</span>
            <input
              type="checkbox"
              checked={showPdqs}
              onChange={() => setShowPdqs((v) => !v)}
            />
          </label>
        </div>
      </div>

      {/* Year */}
      <div className="sidebar-section">
        <div className="sidebar-label">Year</div>
        <div className="sidebar-card">
          <label className="check">
            <input type="checkbox" checked={isAllYearsSelected} onChange={toggleAllYears} />
            <span>All</span>
          </label>

          <div className="check-grid">
            {availableYears.map((y) => (
              <label key={y} className="check">
                <input
                  type="checkbox"
                  checked={filters.years.has(y)}
                  onChange={() => setFilters((f) => ({ ...f, years: toggleInSet(f.years, y) }))}
                />
                <span>{y}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Month */}
      <div className="sidebar-section">
        <div className="sidebar-label">Month</div>
        <div className="sidebar-card">
          <label className="check">
            <input type="checkbox" checked={isAllMonthsSelected} onChange={toggleAllMonths} />
            <span>All</span>
          </label>

          <div className="check-grid">
            {MONTHS.map((m, idx) => (
              <label key={m} className="check">
                <input
                  type="checkbox"
                  checked={filters.months.has(idx)}
                  onChange={() =>
                    setFilters((f) => ({ ...f, months: toggleInSet(f.months, idx) }))
                  }
                />
                <span>{m}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Category */}
      <div className="sidebar-section">
        <div className="sidebar-label">Category</div>
        <div className="sidebar-card">
          <label className="check">
            <input
              type="checkbox"
              checked={isAllCategoriesSelected}
              onChange={toggleAllCategories}
            />
            <span>All</span>
          </label>

          <div className="check-list">
            {availableCategories.map((c) => (
              <label key={c} className="check">
                <input
                  type="checkbox"
                  checked={filters.categories.has(c)}
                  onChange={() =>
                    setFilters((f) => ({ ...f, categories: toggleInSet(f.categories, c) }))
                  }
                />
                <span>{c}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="sidebar-section">
        <button
          className="map-btn"
          onClick={() =>
            setFilters({ years: new Set(), months: new Set(), categories: new Set() })
          }
        >
          Clear all (show none)
        </button>
      </div>
    </aside>
  );
}
