// =========================================================
// AppLayout.tsx
// =========================================================
//
// AppLayout définit la structure globale partagée par toutes les pages de l’application.
//
// Il centralise :
//   - Le Header (topbar)
//   - La navigation principale (Home, Sign in, Dashboard)
//   - L’intégration de l’authentification via Clerk (SignedIn / SignedOut / UserButton)
//   - L’espace dynamique pour les pages via <Outlet />
//   - Le Footer global
//
// Le composant <Outlet /> est essentiel :
// Il agit comme un placeholder où React Router injecte dynamiquement
// la page correspondant à la route active.
//
// Exemple :
//   "/"           → HomePage
//   "/dashboard"  → DashboardPage
//
// L’authentification est gérée côté UI grâce à SignedIn et SignedOut,
// ce qui permet d’afficher une navigation différente selon l’état
// de connexion de l’utilisateur.
//
// Ce layout permet d’éviter la duplication du Header et du Footer
// dans chaque page et garantit une structure cohérente dans toute l’application.
//
// AppLayout joue donc le rôle d’orchestrateur visuel global,
// tandis que les pages injectées via Outlet gèrent la logique métier spécifique.


// =========================================================
// IMPORTS
// =========================================================

// Outlet : emplacement dynamique où les routes enfants seront affichées
// Link : navigation interne sans rechargement (SPA)
import { Outlet, Link } from "react-router-dom";

// SignedIn / SignedOut : affichage conditionnel selon état auth
// UserButton : menu utilisateur Clerk (profil, logout)
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";

// Footer global de l’application
import Footer from "./Footer";

// Logo statique importé comme module (Vite gère les assets)
import logo from "../assets/crimevision_logo_10.png";


// =========================================================
// COMPOSANT : AppLayout
// =========================================================
export default function AppLayout() {
  return (
    <div className="app-layout">

      {/* =====================================================
          HEADER (Topbar)
         ===================================================== */}
      <header className="topbar">

        {/* Flex container pour aligner logo + nav + auth */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>

          {/* Logo + lien vers Home */}
          <Link to="/" className="title">
            <img src={logo} alt="CrimeVision logo" className="topbar-logo" />
            CrimeVision
          </Link>

          {/* =====================================================
              UTILISATEUR NON CONNECTÉ
             ===================================================== */}
          <SignedOut>

            {/* Lien vers page de connexion */}
            <Link to="/sign-in" style={{ color: "white" }}>Sign in</Link>
          </SignedOut>
          
          {/* =====================================================
              UTILISATEUR CONNECTÉ
             ===================================================== */}
          <SignedIn>
            {/* Lien vers Dashboard */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Link to="/dashboard" className="title-right">Dashboard</Link>
            </div>

            {/* Menu utilisateur Clerk (avatar + dropdown) */}
            <UserButton />
          </SignedIn>
        </div>
      </header>
      
      {/* =====================================================
          CONTENU PRINCIPAL
         ===================================================== */}

      {/* 
        Outlet est l’emplacement où React Router injecte
        la page correspondant à la route actuelle.
        Exemple :
        - "/"  -> HomePage
        - "/dashboard" -> DashboardPage
      */}
      <main className="page-content">
        <Outlet />
      </main>

      {/* =====================================================
          FOOTER GLOBAL
         ===================================================== */}
      <Footer />
    </div>
  );
}
