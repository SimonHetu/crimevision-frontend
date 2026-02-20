
## Installation (commandes)

### Vite et React 
npm create vite@latest . -- --template react-ts

### React Router
npm install react-router-dom

### Leaflet
npm install leaflet react-leaflet axios
npm install -D @types/leaflet

### Clerk
npm i @clerk/clerk-react

---




## Définitions

### Vite
Est un **outil** de `Build` et `Bundler` qui sert à démarrer et builder le projet React rapidement avec un environnement moderne et optimisé.
- Un `Bundler` est un outil qui prend tous tes fichiers (JS, TS, CSS, images, modules, etc.) et les regroupe (“bundle”) en fichiers optimisés pour le navigateur.
- Un outil de `Build` prépare ton projet pour la production.
    - Compiler TypeScript → JavaScript
    - Optimiser les assets

### React
Est un **librairie UI** permet de construire un interface utilisateur avec des composants réutilisables et une gestion efficace du state.

### React Router
Est une **librairie de routage** qui permet de g/rer la navigation entre les pages de l'application sans recharger le navigateur.

### Leaflet et React-Leaflet
Leafletest une **librairie de cartographie** qui permet d'afficher des cartes interactives et React-Leaflet permet de les integrer proprement dans un environnement React

### Axios
Est une librairie HTTP qui simplifie les requetes HTTP vers le backend

### Clerk
Clerk est un service d’authentification qui permet de gérer le login, l’inscription, les sessions et les tokens JWT sans avoir à développer tout le système d’authentification soi-même.  
Il simplifie la mise en place d’un système sécurisé en prenant en charge le hashing des mots de passe, la gestion des sessions et l’intégration avec des fournisseurs OAuth (ex: Google, Discord).

### OpenStreetMap (OSM) 
OpenStreetMap est une base de données cartographique libre et collaborative (routes, bâtiments, villes…)
Elle fournit les tuiles de carte que Leaflet utilise comme fond visuel.
