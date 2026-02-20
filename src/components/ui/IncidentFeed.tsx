// IncidentFeed.tsx affiche une liste (feed) des incidents sous forme de lignes
// Définit :
//   - Un tri des incidents (plus récent -> plus ancien)
//   - Un affichage compact (catégorie + date)
//   - Une interaction “hover” : survol d’une ligne -> on informe le parent (ex: MapView highlight)
//   - Un reset du hover quand la souris quitte le panneau

// =========================================================
// IMPORTS
// =========================================================

// useMemo : mémorise le tri pour éviter de re-trier à chaque render inutilement
import { useMemo } from "react";
// Type Incident : structure de données d’un incident (id, date, category, etc.)
import type { Incident } from "../services/incidents";

// =========================================================
// TYPES : Props
// =========================================================

type Props = {
  // Liste d’incidents à afficher dans le feed
  incidents: Incident[];

  // Callback optionnel : appelé lors du survol d’une ligne
  // - id : l’incident survolé
  // - null : aucun incident (ex: souris sortie du feed)
  onHover?: (id: number | string | null) => void;
};

// =========================================================
// COMPOSANT : IncidentFeed
// =========================================================

export default function IncidentFeed({ incidents, onHover }: Props) {

  // =========================================================
  // TRI : incidents du plus récent au plus ancien
  // =========================================================
  // useMemo évite de recalculer le tri si incidents n’a pas changé.
  // On clone le tableau avec [...incidents] pour ne pas modifier la prop originale.

  const sorted = useMemo(() => {
    return [...incidents].sort((a, b) => {

      // Convertit date -> timestamp (ms) pour comparer
      // ?? 0 : si date manquante, on utilise 0 (très ancien)
      const ta = new Date((a as any).date ?? 0).getTime();
      const tb = new Date((b as any).date ?? 0).getTime();

      // tb - ta : ordre décroissant (plus récent en premier)
      return tb - ta;
    });
  }, [incidents]);


  // =========================================================
  // RENDER : UI du feed
  // =========================================================

  return (

    // onMouseLeave : quand la souris quitte le feed -> on reset le hover (null)
    <div className="incident-feed" onMouseLeave={() => onHover?.(null)}>

      {/* Header : compteur */}
      <div className="incident-feed-header">
        <small style={{ opacity: 0.75 }}>Showing {sorted.length}</small>
      </div>

      {/* Cas vide */}
      {sorted.length === 0 && <p>No incidents found.</p>}

      {/* Liste des incidents */}
      {sorted.map((it) => (
        <div

          // key : identifiant stable requis par React pour les listes
          key={String((it as any).id)}
          className="incident-row"

          // Quand on survole une ligne :
          // -> on informe le parent quel incident est survolé
          // -> typiquement, le parent “highlight” l’incident sur la carte
          onMouseEnter={() => onHover?.((it as any).id)}
        > 

          {/* Catégorie */}
          <b>{String((it as any).category ?? "Unknown")}</b>

          {/* Date affichée en format lisible local */}
          <small>{new Date((it as any).date).toLocaleString()}</small>
        </div>
      ))}
    </div>
  );
}
