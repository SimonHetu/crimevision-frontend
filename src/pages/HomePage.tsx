// =========================================================
// HOME PAGE — CrimeVision
// Rôle: page centrale "exploration" (carte + filtres + feed).
// - Charge le dataset "Latest" (base) + PDQs pour la carte et le sidebar
// - Offre un onglet "Near you" (incidents autour de la position Home du user)
// - Applique des filtres (année, mois, catégorie) via des Sets
// - Synchronise le survol feed <=> surbrillance sur la carte (highlightedId)
// =========================================================

import { useEffect, useMemo, useState } from "react"; // Hooks React: state + effets + memoization
import { useAuth } from "@clerk/clerk-react"; // Clerk: auth front (isSignedIn + getToken)

import MapView from "../components/map/MapView"; // Carte Leaflet (incidents + PDQs)
import Sidebar from "../layouts/Sidebar"; // UI filtres + infos (count, toggles, etc.)
import IncidentFeed from "../components/ui/IncidentFeed"; // Liste des incidents (hover sync)

import { fetchIncidents, type Incident } from "../components/services/incidents"; // Service API incidents
import { fetchPdqs, type Pdq } from "../components/services/pdq"; // Service API PDQs



// =========================================================
// TYPES
// =========================================================

// Filtres: Sets = pour "toggle" sans doublons
type Filters = {
  years: Set<number>;
  months: Set<number>;
  categories: Set<string>;
};


// Helper de parsing date: protège l'app contre date null/invalid
// Retourne null si date absente ou invalide (évite NaN / crash)
function parseIncidentDate(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Profil utilisateur utilisé pour le mode "Near you"
// homeLat/homeLng = centre (domicile)
// homeRadiusM = rayon
type Profile = {
  id: number;
  homeLat: number | null;
  homeLng: number | null;
  homeRadiusM: number | null;
};

// Type utilitaire: objet quelconque (pour parse JSON non typé)
type AnyObj = Record<string, unknown>;

// État de "home":
// - unknown : pas encore déterminé / erreur
// - unset : user n'a pas de home défini
// - set : home défini et exploitable
type HomeStatus = "unknown" | "set" | "unset";


// =========================================================
// COMPONENT
// =========================================================
export default function HomePage() {

  // Clerk auth
  // isSignedIn = bool pour UI (Near tab lock)
  // getToken = récupère un JWT Clerk valide
  const { isSignedIn, getToken } = useAuth();

  // Base URL backend via Vite env (fallback local)
  const apiBase = import.meta.env.VITE_API_BASE ?? "http://localhost:3000";

  // =========================================================
  // DATASETS (BASE / LATEST)
  // =========================================================

  // Dataset principal ("Latest"):
  // sert pour:
  //  - afficher la carte en mode Latest
  //  - générer les options de filtres dans le Sidebar (years/categories)

  const [allIncidents, setAllIncidents] = useState<Incident[]>([]);
  const [pdqs, setPdqs] = useState<Pdq[]>([]);
  const [loading, setLoading] = useState(true);

  // =========================================================
  // DATASETS (NEAR YOU / HOME)
  // =========================================================

  // Dataset Near you:
  // utilisé uniquement quand l'onglet "Near you" est actif
  // (ça évite de charger cette donnée inutilement)

  const [nearIncidents, setNearIncidents] = useState<Incident[]>([]);
  const [nearLoading, setNearLoading] = useState(false);
  const [nearError, setNearError] = useState<string>("");
  const [nearRefresh, setNearRefresh] = useState(0);

  // =========================================================
  // UI STATE / INTERACTIONS
  // =========================================================

  // ID de l'incident survolé dans le feed
  // -> MapView peut le mettre en highlight

  const [highlightedId, setHighlightedId] = useState<number | null>(null);

  // Tabs du panneau de droite:
  // - latest: liste globale
  // - home: near you
  const [feedTab, setFeedTab] = useState<"latest" | "home">("latest");

  // Flag pour synchroniser le user avec la DB une seule fois par session
  const [syncedUser, setSyncedUser] = useState(false);

   // On stocke le radius pour l'afficher dans l'UI (Near you)
  const [homeRadiusM, setHomeRadiusM] = useState<number | null>(null);

  // Status: home set/unset/unknown (utile pour UI + décisions dataset)
  const [homeStatus, setHomeStatus] = useState<HomeStatus>("unknown");


  // Toggle d'affichage des PDQs sur la map
  const [showPdqs, setShowPdqs] = useState(true);


  // =========================================================
  // 1) SYNC USER TO DB (une fois)
  // =========================================================
  // Objectif:
  // Quand l'utilisateur se connecte (Clerk),
  // on veut s'assurer qu'il existe côté DB (Prisma) aussi.
  //
  // Ça évite le problème:
  // - user présent dans Clerk mais pas encore créé dans ta DB
  // - donc /api/me pourrait ne pas trouver de profile

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

        // Si le backend répond pas ok -> on log l'erreur
        if (!res.ok) throw new Error(text);
        
        // Synchronisation validée une fois
        setSyncedUser(true);
      } catch (err) {
        console.error("Failed to sync user to DB:", err);
      }
    })();
  }, [isSignedIn, getToken, syncedUser, apiBase]);


  // =========================================================
  // 2) IF USER SIGNS OUT WHILE ON NEAR TAB
  // =========================================================
  // UX + sécurité:
  // si user se déconnecte pendant Near you:
  // - on revient à latest
  // - on reset les states near

  useEffect(() => {
    if (!isSignedIn && feedTab === "home") {
      setFeedTab("latest");
      setHomeStatus("unknown");
      setNearIncidents([]);
      setNearError("");
      setHomeRadiusM(null);
    }
  }, [isSignedIn, feedTab]);

  // =========================================================
  // FILTERS STATE
  // =========================================================
  // Sets -> idéal pour toggle immuable
  const [filters, setFilters] = useState<Filters>({
    years: new Set<number>(),
    months: new Set<number>(),
    categories: new Set<string>(),
  });

  // =========================================================
  // 3) LOAD BASE DATA (INCIDENTS + PDQs)
  // =========================================================
  // On charge la base (Latest) au montage:
  // - incidents (limit 30000)
  // - pdqs
  // On nettoie latitude/longitude pour éviter données invalides

  useEffect(() => {
    setLoading(true);

    Promise.all([fetchIncidents({ limit: 30000 }), fetchPdqs()])
      .then(([incData, pdqData]) => {

        // Nettoyage incidents: force latitude/longitude en Number
        // + filtre ceux qui sont NaN / invalides
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
        
        // Nettoyage PDQs: même logique
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
        
        // Mise à jour states base
        setAllIncidents(cleanedIncidents);
        setPdqs(cleanedPdqs);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);


  // =========================================================
  // 4) AVAILABLE FILTER OPTIONS (FROM BASE)
  // =========================================================
  // useMemo = évite recalculer à chaque render
  // On dérive les options de filtre depuis allIncidents

  const availableYears = useMemo(() => {
    const s = new Set<number>();
    for (const inc of allIncidents) {
      const d = parseIncidentDate((inc as any).date);
      if (d) s.add(d.getFullYear());
    }

    // tri décroissant (années récentes en premier)
    return Array.from(s).sort((a, b) => b - a);
  }, [allIncidents]);

  const availableCategories = useMemo(() => {
    const s = new Set<string>();
    for (const inc of allIncidents) {
      const c = (inc as any).category ?? "Unknown";
      s.add(String(c));
    }

    // tri alpha pour UI stable
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [allIncidents]);


  // =========================================================
  // 5) DEFAULT FILTERS
  // =========================================================
  // But: au premier load, si aucun filtre sélectionné,
  // on initialise une sélection "par défaut".
  //
  // On fait intentionnellement un reset à empty sets
  // (ce qui rend filteredIncidents vide)
  //
  // Les lignes commentées montrent l’intention possible de "select all".
  // => si on veut que "tout" s’affiche par défaut,
  // il faut activer les sets préremplis.

  useEffect(() => {
    if (!allIncidents.length) return;

    setFilters((f) => {

      // Si déjà des filtres sélectionnés, ne pas écraser (respect user)
      if (f.years.size || f.months.size || f.categories.size) return f;

      // Actuellement: reset à vide (=> filteredIncidents retourne [])
      return { years: new Set(), months: new Set(), categories: new Set() };
        
      // Option "Select ALL" (à activer si désiré)
      // return {
      //   years: new Set(availableYears),
      //   months: new Set<number>([0,1,2,3,4,5,6,7,8,9,10,11]),
      //   categories: new Set(availableCategories),

    });
  }, [allIncidents.length, availableYears, availableCategories]);


  // =========================================================
  // 6) SIDEBAR "ALL" HELPERS
  // =========================================================

  // Set constant des 12 mois (0=Jan ... 11=Déc)
  const allMonthsSet = useMemo(
    () => new Set<number>([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]),
    []
  );

  // Est-ce que tous les years disponibles sont sélectionnés?
  const isAllYearsSelected = useMemo(() => {
    if (availableYears.length === 0) return false;
    if (filters.years.size !== availableYears.length) return false;
    for (const y of availableYears) if (!filters.years.has(y)) return false;
    return true;
  }, [filters.years, availableYears]);

  // Est-ce que tous les months (12) sont sélectionnés?
  const isAllMonthsSelected = useMemo(() => {
    if (filters.months.size !== 12) return false;
    for (const m of allMonthsSet) if (!filters.months.has(m)) return false;
    return true;
  }, [filters.months, allMonthsSet]);

  // Est-ce que toutes les catégories disponibles sont sélectionnées?
  const isAllCategoriesSelected = useMemo(() => {
    if (availableCategories.length === 0) return false;
    if (filters.categories.size !== availableCategories.length) return false;
    for (const c of availableCategories) if (!filters.categories.has(c)) return false;
    return true;
  }, [filters.categories, availableCategories]);

  // Toggle "All years"s
  const toggleAllYears = () => { // si all => clear
    setFilters((f) => ({  // sinon => select all
      ...f,
      years: isAllYearsSelected
        ? new Set<number>()
        : new Set<number>(availableYears),
    }));
  };

  // Toggle "All months"
  const toggleAllMonths = () => {
    setFilters((f) => ({
      ...f,
      months: isAllMonthsSelected
        ? new Set<number>()
        : new Set<number>(allMonthsSet),
    }));
  };

  // Toggle "All categories"
  const toggleAllCategories = () => {
    setFilters((f) => ({
      ...f,
      categories: isAllCategoriesSelected
        ? new Set<string>()
        : new Set<string>(availableCategories),
    }));
  };

  // =========================================================
  // 7) AUTHED FETCH HELPER
  // =========================================================
  // Helper qui centralise les appels API nécessitant une authentification
  // - récupère token Clerk
  // - fetch avec Bearer
  // - parse json
  // - normalise les erreurs HTTP

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

  // =========================================================
  // 8) FETCH NEAR YOU (WHEN TAB ACTIVE)
  // =========================================================
  // Déclenché quand:
  // - l'utilisateur est signed in
  // - feedTab = home
  // - nearRefresh change (clic sur tab)
  //
  // Flow:
  // 1) GET /api/me -> récupérer profile (home)
  // 2) si home absent => message d'erreur UX
  // 3) sinon GET /api/me/incidents?mode=home&limit=...&radiusM=...
  // 4) nettoyage lat/lng
  useEffect(() => {
    if (!isSignedIn || feedTab !== "home") return;

    (async () => {
      try {
        setNearError("");
        setNearLoading(true);

        // Récupère le profil user (homeLat/homeLng)
        const meJson = await authedJson(`${apiBase}/api/me`);
        const prof = (meJson as any)?.user?.profile as Profile | null;
        
        // Home non défini => UX guidance vers Dashboard
        if (!prof || prof.homeLat == null || prof.homeLng == null) {
          setHomeStatus("unset");
          setHomeRadiusM(null);
          setNearIncidents([]);
          setNearError("Home location not set. Go to Dashboard => Save (use GPS).");
          return;
        }
        
        // Home ok
        setHomeStatus("set");
        setHomeRadiusM(prof.homeRadiusM ?? null);

        // Build query string vers route backend
        const qs = new URLSearchParams();
        qs.set("mode", "home");
        qs.set("limit", "1000");
        if (prof.homeRadiusM != null) qs.set("radiusM", String(prof.homeRadiusM));

        // Récupère incidents near
        const json = await authedJson(`${apiBase}/api/me/incidents?${qs.toString()}`);

        // Route retourne: { success, mode, home, items }
        const items = Array.isArray((json as any)?.items) ? (json as any).items : [];

        // Nettoyage coords pour MapView
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
        // Erreur réseau / token / backend
        setHomeStatus("unknown");
        setNearIncidents([]);
        setNearError(e?.message ?? String(e));
      } finally {
        setNearLoading(false);
      }
    })();
  }, [feedTab, isSignedIn, apiBase, nearRefresh]);


  // =========================================================
  // 9) ACTIVE DATASET FOR MAP
  // =========================================================
  // Objectif:
  // - si onglet Near actif + home set => utiliser nearIncidents
  // - sinon => base allIncidents

  const inNearTab = feedTab === "home" && isSignedIn;
  const canShowNear = inNearTab && homeStatus === "set";

  const activeIncidents = canShowNear ? nearIncidents : allIncidents;
  const activeLoading = inNearTab ? nearLoading : loading;


  // =========================================================
  // 10) FILTER INCIDENTS FOR MAP (SETS)
  // =========================================================
  // On appliques les filtres au dataset actif.
  // - si l'un des Sets est vide => retour []
  //   (logique "aucun filtre choisi => rien à afficher")

  const filteredIncidents = useMemo(() => {
    if (filters.years.size === 0) return [];
    if (filters.months.size === 0) return [];
    if (filters.categories.size === 0) return [];

    return activeIncidents.filter((inc) => {
      const d = parseIncidentDate((inc as any).date);
      const year = d ? d.getFullYear() : null;
      const month = d ? d.getMonth() : null;
      const category = String((inc as any).category ?? "Unknown");

      // Filtrage strict (must match)
      if (year === null || !filters.years.has(year)) return false;
      if (month === null || !filters.months.has(month)) return false;
      if (!filters.categories.has(category)) return false;

      return true;
    });
  }, [activeIncidents, filters]);

  // =========================================================
  // RENDER
  // =========================================================
  // Layout:
  // - Sidebar (gauche): filtres + toggles + stats
  // - Main: MapView (centre) + right-panel (feed + tabs)
  return (
    <div className="shell">
      <Sidebar
        incidents={filteredIncidents} // sidebar reçoit déjà filtré
        pdqs={pdqs}
        loading={loading}  // On passes loading base, pas activeLoading
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
          incidents={filteredIncidents} // Carte affiche la version filtrée
          pdqs={pdqs}
          loading={activeLoading} // Carte reçoit le loading actif (latest vs near)
          highlightedId={highlightedId} // Hover feed -> highlight map
          showPdqs={showPdqs} // Toggle layer PDQs
        />

        <div className="right-panel">
          {/* Tabs "Latest" vs "Near you" */}
          <div className="right-tabs">
            <button
              className={`right-tab ${feedTab === "latest" ? "is-active" : ""}`}
              type="button"
              onClick={() => {
                // reset error UX + switch dataset
                setNearError("");
                setFeedTab("latest");
              }}
            >
              🧿 Latest
            </button>

            <button
              className={`right-tab ${feedTab === "home" ? "is-active" : ""}`}
              type="button"
              onClick={() => {

                // reset error + switch tab + trigger refresh
                setNearError("");
                setFeedTab("home");
                setNearRefresh((n) => n + 1);
              }}
              disabled={!isSignedIn} // Lock si pas signed in
              title={!isSignedIn ? "Sign in to use Near you" : undefined}
            >
              🔊 Near you {!isSignedIn ? "🔒" : ""}
            </button>

          </div>
          
          {/* Message d'erreur Near tab */}
          {inNearTab && nearError ? (
            <div style={{ padding: 12, fontSize: 13, opacity: 0.9 }}>
              {nearError}
            </div>
          ) : null}

          {/* Affiche le radius si home set */}
          {inNearTab && homeStatus === "set" ? (
            <div style={{ padding: "0 12px 12px", fontSize: 13, opacity: 0.9 }}>
              Radius: {homeRadiusM ?? "default"} m
            </div>
          ) : null}

          {/* Feed: même data filtrée que la carte */}
          <IncidentFeed
            incidents={filteredIncidents}
            onHover={(id) => {

              // Le feed peut renvoyer string/number/null
              // On normalise en number ou null
              if (id == null) return setHighlightedId(null);
              const n = typeof id === "string" ? Number(id) : id;
              setHighlightedId(Number.isFinite(n) ? n : null);
            }}
          />

        </div>
      </main>
    </div>
  );
}
