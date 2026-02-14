// -----------------------------
// Point d’entrée principal React
// -----------------------------
// - Boot de l'application
// - Démarre React et configure tous les configure les 

import React from "react";
import ReactDOM from "react-dom/client";

// Router SPA (Single Page Application)
// Permet la navigation côté client sans recharger la page
import { BrowserRouter } from "react-router-dom";

// Composant racine de l'application (structure globale + routes)
import App from "./app/App";

// Styles globaux de l'application
import "./styles/globals.css";

// Styles pour la carte Leaflet
import "leaflet/dist/leaflet.css";

import { ClerkProvider } from "@clerk/clerk-react";


// -----------------------------
// Configuration
// -----------------------------

// Clé publique Clerk 
// - récupérée depuis les variables d'environnement
const pk = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;


// -----------------------------
// Démarrage de l'application
// -----------------------------

// Création de la racine React dans le <div id="root"> du index.html
ReactDOM.createRoot(document.getElementById("root")!).render(

  // Active des vérification supplémentaires en développement
  <React.StrictMode>

    {/* Fournisseur d'authentification globale */}
    <ClerkProvider publishableKey={pk}>

      {/* Router SPA (Single Page Application) */}
      <BrowserRouter>

        {/* Composant racine de l'application */}
        <App />

      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>
);