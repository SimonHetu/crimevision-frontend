# 🧿 CrimeVision

Application full-stack développée dans le cadre du cours **Services Web 1 (420-941-MA)**  
Collège de Maisonneuve — Hiver 2026

---

#  Description

CrimeVision est une application web permettant de visualiser des incidents criminels sur une carte interactive et d’effectuer un filtrage géospatial avancé.

L’objectif est de démontrer :

- Une intégration complète Frontend + Backend
- Un système d’authentification sécurisé
- Une architecture client-serveur moderne
- Une gestion propre des appels API et de la sécurité

---

# 🏗 Architecture

## Backend
- Node.js
- Express
- Prisma ORM
- PostgreSQL (Neon)
- Middleware JWT (Clerk)
- API REST sécurisée

## Frontend
- React 18
- Vite
- TypeScript
- React Router DOM
- React Leaflet
- Clerk Authentication

---

# 🔐 Authentification

Le projet utilise **Clerk** pour :

- Inscription
- Connexion
- Déconnexion
- Gestion sécurisée des sessions
- Protection des routes frontend
- Vérification JWT côté backend

Les routes protégées redirigent automatiquement vers `/sign-in` si l’utilisateur n’est pas authentifié.

---

# 🌍 Fonctionnalités

## ✔ Authentification complète
- Inscription
- Connexion
- Persistance de session
- Protection des routes

## ✔ Dashboard utilisateur
- Gestion de la localisation domicile
- Sauvegarde en base de données
- Suppression de la localisation

## ✔ Filtrage géospatial (Near You)
- Bounding box pour optimisation
- Calcul de distance (formule de Haversine)
- Rayon configurable
- Requêtes limitées côté serveur

## ✔ Carte interactive
- Affichage dynamique des incidents
- Gestion des chevauchements (jitter algorithm)
- Synchronisation hover liste ↔ carte
- Toggle satellite / streets

## ✔ Filtres dynamiques
- Année
- Mois
- Catégorie

---

# 🔁 CRUD Implémenté

Ressource : `UserProfile`

- CREATE → Enregistrement de la localisation domicile
- READ → Récupération via `/api/me`
- UPDATE → Modification rayon / position
- DELETE → Suppression logique (remise à null)

---

# ⚙ Prérequis

- Node.js 18+
- npm 9+
- Backend CrimeVision en cours d’exécution (http://localhost:3000)
- Compte Clerk configuré

---

# 🚀 Installation (Frontend)

## 1. Cloner le projet

git clone https://github.com/SimonHetu/crimevision.git
cd crimevision/frontend

## 2. Installation des dépendances
npm install

## 3. Creation du .env
cp .env.example .env

## 4. ajout de clé clerk dans le .env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_API_BASE=http://localhost:3000

## 5. Demarrage
npm run dev