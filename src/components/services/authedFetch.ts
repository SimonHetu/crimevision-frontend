// =========================================================
// TYPE : Fonction getToken de Clerk
// =========================================================

// GetTokenFn décrit la signature de la fonction fournie par Clerk.
// - Elle peut recevoir des options (ex: template spécifique)
// - Elle retourne une Promise contenant :
//     - un token JWT (string)
//     - ou null si l’utilisateur n’est pas authentifié

export type GetTokenFn = (options?: { template?: string }) => Promise<string | null>;


// =========================================================
// FETCH AUTHENTIFIÉ (Bearer Token)
// =========================================================

// authedFetch est une fonction utilitaire pour faire des requêtes HTTP
// en incluant automatiquement le token Clerk dans le header Authorization.

export async function authedFetch(
  url: string,
  getToken: GetTokenFn,
  init: RequestInit = {} // paramètres optionnels (method, body, etc.)
) {

  // 1️⃣ On récupère le token JWT via Clerk
  const token = await getToken();

  // Si aucun token -> utilisateur non authentifié
  if (!token) throw new Error("No Clerk token");

  // 2️⃣ On construit les headers HTTP
  // On part des headers existants (si fournis)
  const headers = new Headers(init.headers);

  // On ajoute le header Authorization avec Bearer token
  headers.set("Authorization", `Bearer ${token}`);

  // Si Content-Type n’est pas défini -> on met JSON par défaut
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  // 3️⃣ On fait la requête fetch en injectant les headers modifiés
  return fetch(url, { ...init, headers });
}
