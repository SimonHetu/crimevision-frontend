// Raison d'etre du module:
// Ce module gère la récupération des postes de quartier.
// J’ai défini un type Pdq pour sécuriser la structure des données.
// La fonction fetchPdqs appelle une route backend via une fonction générique apiGet, puis retourne uniquement les données utiles.
// Cela permet de garder la couche UI découplée du format exact de la réponse backend.


// =========================================================
// IMPORT
// =========================================================

// apiGet est une fonction utilitaire générique pour faire des requêtes GET
// Elle centralise la logique réseau (URL, erreurs, typage)

import { apiGet } from "./api";


// =========================================================
// TYPE : Pdq
// =========================================================

// Représente un poste de quartier (PDQ).
// Ce type garantit la structure des données reçues du backend.

export type Pdq = {
  id: number;          // identifiant unique du PDQ
  name?: string;       // nom optionnel (peut être absent selon la source)
  latitude: number;    // position géographique
  longitude: number;   // position géographique
};

// =========================================================
// TYPE : ApiResponse générique
// =========================================================

// Format standard des réponses backend.
// success = indique si l’opération a réussi
// data = contient les données utiles

type ApiResponse<T> = { success: boolean; data: T };


// =========================================================
// FONCTION : fetchPdqs
// =========================================================

// Récupère la liste des PDQs depuis le backend.
// Appelle GET /api/pdq

export async function fetchPdqs() {

  // On indique à TypeScript que la réponse attendue est :
  // ApiResponse<Pdq[]>
  const res = await apiGet<ApiResponse<Pdq[]>>("/api/pdq");

  // On retourne uniquement le tableau de PDQs (pas le wrapper success)
  return res.data;
}
