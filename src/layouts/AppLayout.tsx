
// AppLayout définit la structure globale partagée par toutes les pages.
// Il contient le header, la navigation conditionnelle selon l’authentification et le footer.
// Le composant Outlet est essentiel : il agit comme un placeholder où React Router injecte dynamiquement la page active.
// L’authentification est gérée côté UI avec SignedIn et SignedOut, ce qui permet d’afficher des éléments différents selon l’état de connexion.

// AppLayout.tsx définit la structure globale de l'application.
// Définit :
//   - Le header (topbar)
//   - La navigation (Home, Sign in, Dashboard)
//   - L’intégration Clerk (SignedIn / SignedOut / UserButton)
//   - L’espace dynamique pour les pages via <Outlet />
//   - Le Footer global

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
        - "/" -> HomePage
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
