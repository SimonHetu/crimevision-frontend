// App.tsx est le routeur central de frontend de l'application
// Definit: 
//      - Quelles pages existe, 
//      - Lesquelles sont publiques, 
//      - lesquelles sont protégées, 
//      - Quelle structure (layout) elles utilisent

// =========================================================
// IMPORTS
// =========================================================
// React Router permet de définir les routes (navigation SPA (single page application))
import { Routes, Route } from "react-router-dom";

// Composants d’authentification fournis par Clerk
// SignIn et SignUp gèrent toute l’UI + logique d’auth
import { SignIn, SignUp } from "@clerk/clerk-react";

// Layout principal de l'application (header, footer, structure commune)
import AppLayout from "../layouts/AppLayout";

// Pages principales
import HomePage from "../pages/HomePage";
import DashboardPage from "../pages/DashboardPage";
import PrivacyPage from "../pages/PrivacyPage";

// Composant personnalisé qui protège une route
// Vérifie si l'utilisateur est authentifié avant d'accéder à la page
import ProtectedRoute from "./ProtectedRoute";



// =========================================================
// COMPOSANT PRINCIPAL DE ROUTAGE
// =========================================================
export default function App() {
  return (
    <Routes>
      {/* =====================================================
          ROUTES PUBLIQUES D'AUTHENTIFICATION
          ===================================================== */}

      {/* Page de connexion gérée par Clerk */} 
      <Route path="/sign-in/*" element={<SignIn routing="path" path="/sign-in" />} />

      {/* Page d'inscription gérée par Clerk */}
      <Route path="/sign-up/*" element={<SignUp routing="path" path="/sign-up" />} />


      {/* =====================================================
          LAYOUT GLOBAL
          ===================================================== */}
      {/* 
        Cette route sert à envelopper les routes enfants avec AppLayout.
        Toutes les routes à l’intérieur auront :
        - Header
        - Sidebar
        - Structure commune
      */}
      <Route element={<AppLayout />}>
        
        {/* Page d’accueil publique */}
        <Route path="/" element={<HomePage />} />

        {/* 
          Dashboard accessible seulement si l’utilisateur est authentifié.
          ProtectedRoute vérifie la session (Clerk).
          Si non connecté -> redirige vers sign-in.
        */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Page Privacy (publique) */}
        <Route path="/privacy" element={<PrivacyPage />} />
      </Route>
    </Routes>
  );
}
