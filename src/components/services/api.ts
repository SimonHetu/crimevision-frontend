// =========================================================
// CONFIGURATION API
// =========================================================

// API_BASE définit l’URL de base du backend
// - import.meta.env.VITE_API_BASE : variable d’environnement injectée par Vite
// - Permet d’utiliser une URL différente en développement et en production
// - "??" signifie : si la variable n’existe pas → fallback vers localhost

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000";


// =========================================================
// FONCTION GÉNÉRIQUE POUR REQUÊTES GET
// =========================================================

// apiGet est une fonction utilitaire pour simplifier les appels GET vers le backend.
// <T> est un type générique TypeScript :
//   → permet de typer dynamiquement la réponse attendue.
//   → exemple : apiGet<Incident[]>("/incidents")

export async function apiGet<T>(path: string): Promise<T> {

  // fetch envoie une requête HTTP GET vers :
  // API_BASE + path (ex: http://localhost:3000/incidents)
  // credentials: "include" permet d’envoyer les cookies (session Clerk, etc.)
  const res = await fetch(`${API_BASE}${path}`, { credentials: "include" });

  // Vérification HTTP :
  // res.ok est true si le status est entre 200 et 299.
  // Sinon on lance une erreur explicite.
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);

  // res.json() transforme la réponse en objet JavaScript.
  // "as Promise<T>" indique à TypeScript que la réponse sera du type attendu.
  return res.json() as Promise<T>;
}
