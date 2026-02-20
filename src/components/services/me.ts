
// Raison d'etre du module:
// Ce module regroupe les appels API liés à l’utilisateur courant.
// fetchMe récupère les infos du user identifié par Clerk via un token Bearer.
// updateHome met à jour les champs de profil (latitude, longitude, rayon) via une requête PATCH.
// clearHome est un raccourci qui remet ces valeurs à null sans dupliquer de logique.


// =========================================================
// IMPORTS
// =========================================================

// authedFetch = wrapper autour de fetch qui ajoute automatiquement le token Clerk
// GetTokenFn = type de la fonction getToken() fournie par Clerk

import { authedFetch, type GetTokenFn } from "./authedFetch";


// =========================================================
// CONFIG API BASE
// =========================================================

// URL de base du backend (prod via env, sinon localhost en dev)

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000";


// =========================================================
// TYPE : MeResponse
// =========================================================

// Structure attendue pour la réponse GET /api/me
// Elle contient :
// - success : statut logique de la réponse
// - user : informations utilisateur en base
//   - id : id interne DB
//   - clerkId : identifiant Clerk (clé de liaison auth <=> DB)
//   - email : email (peut être null)
//   - profile : objet optionnel avec la config “Near you”

export type MeResponse = {
  success: boolean;
  user: {
    id: number;
    clerkId: string;
    email: string | null;
    profile: null | {
      id: number;
      homeLat: number | null;
      homeLng: number | null;
      homeRadiusM: number | null;
    };
  };
};


// =========================================================
// TYPE : UpdateHomeBody
// =========================================================

// Payload envoyé au backend pour mettre à jour la position maison + rayon
// Tous les champs peuvent être null (ex: clear/reset)

export type UpdateHomeBody = {
  homeLat: number | null;
  homeLng: number | null;
  homeRadiusM: number | null;
};


// =========================================================
// API : fetchMe
// =========================================================

// Récupère l'utilisateur courant (identifié par le token Clerk)
// -> appelle GET /api/me avec Authorization: Bearer <token>

export async function fetchMe(getToken: GetTokenFn) {
  const res = await authedFetch(`${API_BASE}/api/me`, getToken);

  // Si l’HTTP status n’est pas 2xx, on remonte le message d’erreur backend
  if (!res.ok) throw new Error(await res.text());

  // On parse le JSON et on le type comme MeResponse
  return (await res.json()) as MeResponse;
}


// =========================================================
// API : updateHome
// =========================================================

// Met à jour la position/rayon dans le profil utilisateur
// -> appelle PATCH /api/me/home avec body JSON

export async function updateHome(getToken: GetTokenFn, body: UpdateHomeBody) {
  const res = await authedFetch(`${API_BASE}/api/me/home`, getToken, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

  // Gestion d’erreur HTTP : renvoie le texte (souvent plus précis que le code)
  if (!res.ok) throw new Error(await res.text());

  // Retourne la réponse JSON (ex: profil mis à jour)
  return res.json();
}


// =========================================================
// API : clearHome
// =========================================================

// Helper : réinitialise le profil “home” en envoyant null partout
// -> réutilise updateHome pour ne pas dupliquer la logique
export async function clearHome(getToken: GetTokenFn) {
  return updateHome(getToken, { homeLat: null, homeLng: null, homeRadiusM: null });
}
