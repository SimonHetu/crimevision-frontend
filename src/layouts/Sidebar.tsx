// Sidebar.tsx = panneau de filtres + état global visible (statut / couches / filtres)
// Rôle :
//  - Afficher le nombre d’incidents/PDQs + le nombre filtré
//  - Permettre de toggler l’affichage des PDQs (layer map)
//  - Gérer les filtres (année, mois, catégorie) via des checkboxes
//  - Supporter "All" (tout sélectionner/désélectionner) pour chaque groupe
//  - Fournir un bouton "Clear all" (reset des filtres à vide)

// =========================================================
// IMPORTS + TYPES
// =========================================================
import React from "react";
import type { Incident } from "../components/services/incidents";
import type { Pdq } from "../components/services/pdq";

// Filters = état des filtres : on utilise des Set pour des tests rapides
type Filters = {
  years: Set<number>;
  months: Set<number>;      // months stocke les index 0..11
  categories: Set<string>;
};


// Props = tout vient du parent (Sidebar est "dumb UI"):
// - données (incidents/pdqs) + loading
// - options (availableYears/categories)
// - état filtres + setFilters (state lifté dans le parent)
// - info de rendu (filteredCount)
// - toggle PDQ (showPdqs + setShowPdqs)
// - helpers "All" calculés par le parent + fonctions toggleAll*

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

// Labels de mois affichés à l’écran (index = mois dans filters.months)
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];


// Helper immuable : on ne modifie pas le Set reçu (important pour React state)
// -> on clone (new Set) puis on add/delete
function toggleInSet<T>(set: Set<T>, value: T) {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}


// =========================================================
// COMPOSANT
// =========================================================
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
    // <aside> = élément sémantique "sidebar"
    <aside className="sidebar">

      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-title">CrimeVision</div>
        <div className="sidebar-subtitle">Montréal map</div>
      </div>

      {/* STATUS : loading + compteurs */}
      <div className="sidebar-section">
        <div className="sidebar-label">Status</div>
        <div className="sidebar-card">
          {loading ? (
            <div>Loading…</div>
          ) : (
            <div>

              {/* total brut */}
              <div>
                {incidents.length} incidents • {pdqs.length} PDQs
              </div>

              {/* nombre après filtres */}
              <div style={{ marginTop: 6, opacity: 0.8 }}>
                Showing: <b>{filteredCount}</b>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MAP LAYERS : toggle PDQ */}
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

      {/* YEAR : "All" + liste des années disponibles */}
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

      {/* MONTH : "All" + 12 mois (index 0..11) */}
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

      {/* CATEGORY : "All" + liste des catégories disponibles */}
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
      
      {/* RESET : remet tous les sets à vide (aucun filtre sélectionné) */}
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
