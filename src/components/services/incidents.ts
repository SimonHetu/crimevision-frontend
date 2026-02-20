// Raison d'etre du module:
// Ce module centralise la récupération des incidents depuis le backend.
// J’ai défini un type Incident pour sécuriser la structure des données.
// La fonction fetchIncidents construit dynamiquement une query string selon les filtres fournis.
// Elle appelle ensuite une fonction générique apiGet, puis retourne uniquement les données utiles du backend.

// =========================================================
// IMPORT
// =========================================================

// apiGet est une fonction utilitaire centralisée
// Elle gère les requêtes GET vers le backend

import { apiGet } from "./api";


// =========================================================
// TYPE : Incident
// =========================================================

// Décrit la structure d’un incident reçu du backend.
// TypeScript vérifie que chaque incident possède ces propriétés.

export type Incident = {
  id: string | number;    // identifiant unique (peut venir en string ou number)
  latitude: number;       // coordonnée géographique
  longitude: number;      // coordonnée géographique
  category?: string;      // catégorie du crime (optionnel)
  date?: string;          // date de l’incident (optionnel)
  pdqId?: number;         // identifiant du poste de quartier lié (optionnel)
};


// =========================================================
// TYPE : ApiResponse générique
// =========================================================

// Structure standardisée des réponses backend.
// <T> permet d’utiliser ce format pour différents types de données.

type ApiResponse<T> = {
  success: boolean;       // indique si la requête backend a réussi
  data: T;                // contient les données utiles
};


// =========================================================
// FONCTION : fetchIncidents
// =========================================================

// Fonction responsable de récupérer les incidents depuis le backend.
// Elle accepte des filtres optionnels.

export async function fetchIncidents(params?: {
  timePeriod?: string;    // ex: "LAST_30_DAYS"
  pdqId?: number;         // filtrer par poste de quartier
  limit?: number;         // limiter le nombre de résultats
}) {

  // Création d’un objet URLSearchParams
  // Permet de construire proprement une query string
  const qs = new URLSearchParams();

  // Si un paramètre existe -> on l’ajoute à la query string
  if (params?.timePeriod) qs.set("timePeriod", params.timePeriod);
  if (params?.pdqId != null) qs.set("pdqId", String(params.pdqId));
  if (params?.limit != null) qs.set("limit", String(params.limit));


  // Construction finale du chemin API
  // Si la query string n’est pas vide → on l’ajoute après ?
  const path = `/api/incidents${qs.toString() ? `?${qs}` : ""}`;


  // Appel API via apiGet avec typage générique
  // On indique que la réponse est ApiResponse<Incident[]>
  const res = await apiGet<ApiResponse<Incident[]>>(path);

  // On retourne uniquement les données utiles
  return res.data;
}
