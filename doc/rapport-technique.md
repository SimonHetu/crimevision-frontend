Simon Hétu
Cours Services Web
Session Automne 2025
---

# RAPPORT TECHNIQUE

Voici une version structurée prête à mettre dans ton PDF.

---

# CrimeVision — Rapport technique

## 1. Introduction

Ce projet a été développé dans le cadre du laboratoire 3 du cours Services Web 1.  
Il constitue la phase finale d’intégration full-stack du backend réalisé au laboratoire 2.

L’objectif était de créer une application complète intégrant :

- Une interface utilisateur moderne
- Un système d’authentification sécurisé
- Une connexion stable entre frontend et backend

---

## 2. Architecture

### 2.1 Architecture générale

L’application suit une architecture client-serveur classique :

Frontend React (Vite)  
⬇  
API REST Express  
⬇  
Base de données PostgreSQL (via Prisma)

L’authentification est gérée par Clerk.

---

### 2.2 Backend

Le backend est développé avec :

- Express
- Prisma ORM
- PostgreSQL
- Middleware Clerk

Le routeur principal `/api/me` gère :

- Synchronisation utilisateur
- CRUD du profil
- Filtrage géospatial des incidents

---

### 2.3 Filtrage géospatial

La fonctionnalité "Near You" utilise :

1. Bounding Box pour réduire le nombre de requêtes SQL
2. Calcul de distance via formule de Haversine
3. Filtrage final basé sur un rayon en mètres
4. Limitation sécurisée du paramètre `limit`

Cette approche optimise la performance tout en garantissant la précision.

---

## 3. Authentification

Le système choisi est **Clerk**.

### Justification

- Simplicité d’intégration
- Gestion automatique des sessions
- Protection backend via middleware
- Sécurité professionnelle

Les routes protégées vérifient le token JWT via `getAuth()`.

---

## 4. Intégration Full-Stack

Le frontend communique avec le backend via :

- Fetch API
- Header Authorization Bearer
- Gestion des erreurs

Les états de chargement et les erreurs sont gérés côté client.

---

## 5. Défis rencontrés

### 5.1 Gestion du filtrage géospatial
Le principal défi était d’éviter de charger toute la base de données.

Solution :
- Bounding box + Haversine
- Limitation des résultats

### 5.2 Sécurisation des paramètres
Le paramètre `limit` pouvait être manipulé.

Solution :
- Clamp côté backend
- Validation stricte des paramètres

### 5.3 Synchronisation hover carte/liste
La synchronisation entre la liste d’incidents et les marqueurs Leaflet nécessitait une gestion précise de l’état React.

---

## 6. Améliorations futures

- Système de rôles (Admin/User)
- Clustering des incidents
- Notifications en temps réel
- Déploiement en production
- Optimisation mobile complète

---

## 7. Conclusion

CrimeVision démontre :

- Une intégration full-stack complète
- Une authentification sécurisée
- Un CRUD fonctionnel
- Une architecture propre
- Une logique géospatiale avancée

---

## 🔑 Variables d’environnement

### Backend (.env)

- DATABASE_URL : URL PostgreSQL (Neon)
- CLERK_SECRET_KEY : Clé secrète Clerk
- JWT_SECRET : Secret interne pour signatures

### Frontend (.env)

- VITE_CLERK_PUBLISHABLE_KEY : Clé publique Clerk
- VITE_API_BASE : URL du backend (ex: http://localhost:3000)

