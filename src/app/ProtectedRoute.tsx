// ProtectedRoute est un composant de sécurité frontend
// Il protège certaines routes en vérifiant si l'utilisateur est authentifié
// Définit :
//      - Ce qui est affiché si l’utilisateur est connecté
//      - Ce qui se passe s’il ne l’est pas (redirection)

// =========================================================
// IMPORTS
// =========================================================
// Composants fournis par Clerk pour détecter l’état d’authentification
// SignedIn  -> affiche son contenu si l’utilisateur est connecté
// SignedOut -> affiche son contenu si l’utilisateur n’est PAS connecté
import { SignedIn, SignedOut } from "@clerk/clerk-react";

// Navigate permet de rediriger vers une autre route
import { Navigate } from "react-router-dom";

// ReactNode permet d'accepter n’importe quel composant React en enfant
import type { ReactNode } from "react";


// =========================================================
// COMPOSANT PROTECTED ROUTE
// =========================================================
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  return (
    <>

      {/* 
        Si l’utilisateur est connecté :
        => On affiche le composant enfant (ex: DashboardPage)
      */}
      <SignedIn>{children}</SignedIn>

      {/* 
        Si l’utilisateur n’est PAS connecté :
        => On redirige vers la page de connexion
        replace empêche de revenir en arrière vers la page protégée
      */}
      <SignedOut>
        <Navigate to="/sign-in" replace />
      </SignedOut>
    </>
  );
}
