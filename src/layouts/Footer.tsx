// Import du composant Link depuis react-router-dom
// Permet de naviguer entre les routes sans recharger la page (navigation SPA (single page application))

import { Link } from "react-router-dom";


// Composant Footer affiché en bas de l'application
// Composant fonctionnel React (pas de state nécessaire ici)
export default function Footer() {
  return (

    // Élément sémantique HTML5 <footer>
    // Contient les informations secondaires du site
    <footer className="app-footer">

      {/* Conteneur interne pour structurer le contenu (flexbox en CSS probablement) */}
      <div className="footer-content">

        {/* Affichage dynamique de l'année courante */}
        {/* new Date().getFullYear() évite de devoir mettre à jour l'année manuellement */}
        <span>© {new Date().getFullYear()} CrimeVision</span>

        {/* Lien interne vers la page Privacy */}
        {/* Utilise <Link> au lieu de <a> pour éviter un refresh complet */}
        <Link to="/privacy" className="footer-link">
          Privacy Policy
        </Link>
      </div>
    </footer>
  );
}
