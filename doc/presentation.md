PRÉSENTATION ORALE – CRIMEVISION

========================================
0:00 – 1:30 | INTRODUCTION
========================================

Bonjour, je vais vous présenter CrimeVision, une application full-stack développée dans le cadre du laboratoire 3 du cours Services Web.

L’objectif du projet était de compléter le backend du laboratoire 2 avec :

- Une interface React moderne
- Un système d’authentification sécurisé
- Une intégration complète frontend / backend

Le projet repose sur une architecture séparée :

Backend :
- Node.js + Express
- Prisma ORM
- PostgreSQL (Neon)
- Middleware Clerk JWT

Frontend :
- React 18 + Vite
- TypeScript
- React Router
- React Leaflet
- Clerk pour l’authentification

========================================
1:30 – 4:00 | ARCHITECTURE
========================================

Le projet est séparé en deux dossiers : backend et frontend.

Côté backend :
- API REST sécurisée
- Routes organisées
- Prisma pour l’accès aux données
- Middleware Clerk pour vérifier les tokens

Le frontend communique avec le backend via fetch.
Lors des requêtes protégées, le token JWT est envoyé dans le header Authorization.

Cette séparation respecte une architecture client-serveur claire.

========================================
4:00 – 7:00 | AUTHENTIFICATION
========================================

Le projet utilise Clerk pour :

- Inscription
- Connexion
- Déconnexion
- Persistance de session
- Protection des routes

Démo :
- Inscription
- Connexion
- Logout

Côté frontend :
useAuth() permet de récupérer le token.

Côté backend :
getAuth(req) vérifie le JWT.
Si aucun userId n’est présent, la route retourne 401 Unauthorized.

La sécurité est donc appliquée côté serveur, pas seulement côté client.

========================================
7:00 – 10:00 | FONCTIONNALITÉ PRINCIPALE – NEAR YOU
========================================

La fonctionnalité principale est le filtrage géospatial des incidents proches du domicile.

Processus :

1. L’utilisateur enregistre sa position et un rayon dans le Dashboard.
2. Le backend récupère ces données.
3. Une bounding box est calculée pour limiter la requête SQL.
4. Ensuite, la formule de Haversine calcule la distance réelle en mètres.
5. Les résultats sont filtrés selon le rayon.
6. Les résultats sont triés par distance croissante.
7. Un clamp sécurisé limite le nombre maximal de résultats.

Pourquoi bounding box avant Haversine ?
Pour éviter de calculer la distance sur toute la base de données.

Pourquoi clamp le limit ?
Pour éviter qu’un utilisateur demande 100 000 résultats.

Cela améliore la performance et
