# 🧿 CrimeVision

## 📌 Description du projet

CrimeVision est une application full-stack développée dans le cadre du cours **Services Web 1** (420-941-MA).

Le projet combine :

- Un backend Express (Node.js + Prisma + PostgreSQL)
- Un frontend React (Vite)
- Un système d’authentification sécurisé via Clerk
- Un filtrage géospatial avancé des incidents criminels

L’application permet aux utilisateurs de :

- S’inscrire et se connecter
- Enregistrer une localisation domicile
- Visualiser les incidents criminels sur une carte interactive
- Filtrer les incidents par année, mois et catégorie
- Afficher les incidents proches de leur domicile via un calcul de distance

---

## 🏗 Architecture

### Backend
- Node.js + Express
- Prisma ORM
- PostgreSQL (Neon)
- Middleware Clerk JWT
- API REST sécurisée

### Frontend
- React 18 + Vite
- TypeScript
- React Router
- React Leaflet (carte)
- Clerk (authentification)

---

## 🔐 Authentification

Le projet utilise **Clerk** pour :

- Inscription
- Connexion
- Déconnexion
- Persistance de session
- Protection des routes frontend et backend

Les routes protégées redirigent automatiquement les utilisateurs non authentifiés.

---

## 🌍 Fonctionnalités principales

### ✔ Module d’authentification
- Inscription / Connexion
- Gestion des sessions
- Protection des routes

### ✔ Dashboard
- CRUD complet de la localisation domicile
- Sauvegarde en base de données

### ✔ Near You (Filtrage géospatial)
- Bounding box pour filtrage rapide
- Calcul de distance via formule de Haversine
- Rayon configurable
- Limitation sécurisée des requêtes

### ✔ Carte interactive
- Affichage des incidents
- Synchronisation hover entre la liste et la carte
- Filtrage dynamique

### ✔ Filtres
- Année
- Mois
- Catégorie

---

## 🔁 CRUD implémenté

Ressource : `UserProfile`

- CREATE : Enregistrement de la localisation domicile
- READ : Récupération des données via `/api/me`
- UPDATE : Modification du rayon ou position
- DELETE : Suppression de la localisation domicile

---

## ⚙ Installation

# 1️⃣ Cloner le projet
git clone https://github.com/SimonHetu/crimevision.git
cd crimevision

# =====================================================
# BACKEND
# =====================================================

cd backend

# Installer les dépendances
npm install

# Copier le fichier d’environnement
cp .env.example .env

# Modifier le fichier .env avec vos variables :
# DATABASE_URL=
# CLERK_SECRET_KEY=
# JWT_SECRET=

# Appliquer les migrations Prisma
npx prisma migrate dev

# Lancer le serveur backend
npm run dev

# =====================================================
# FRONTEND
# =====================================================

cd ../frontend

# Installer les dépendances
npm install

# Copier le fichier d’environnement
cp .env.example .env

# Modifier le fichier .env :
# VITE_CLERK_PUBLISHABLE_KEY=
# VITE_API_BASE=http://localhost:3000

# Lancer le serveur frontend
npm run dev
