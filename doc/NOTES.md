## Notes:

React   → UI / interface
Vite    → outil de dev / build
Leaflet → moteur de carte
OSM     → données de carte (images/tuiles)

### REACT 🔮
React est une librairie JavaScript pour construire des interfaces utilisateur dynamiques avec des composants réutilisables.
Chaque composant gère son état (state) et React met automatiquement l’écran à jour quand les données changent.
🧿 Dans CrimeVision : gère toute l’UI (pages, boutons, filtres, cartes, listes, stats).

### VITE ⚡
Vite est un outil de développement et de build ultra rapide pour projets frontend modernes (React, Vue, etc.).
Il lance un serveur local instantané avec Hot Reload et compile l’app optimisée pour la production.
🧿 Dans CrimeVision : sert à démarrer le projet, builder, et lancer npm run dev

### LEAFLET 🗺️
Leaflet est une librairie JavaScript légère pour afficher des cartes interactives dans le navigateur.
Elle permet d’ajouter des marqueurs, popups, couches, heatmaps, géolocalisation, etc.
🧿 Dans CrimeVision : affiche les crimes directement sur la carte.


### OpenStreetMap (OSM) 🌍
OpenStreetMap est une base de données cartographique libre et collaborative (routes, bâtiments, villes…)
Elle fournit les tuiles de carte que Leaflet utilise comme fond visuel.