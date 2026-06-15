# ForumJS / Yo.

Une application de forum full-stack développée avec un backend Express.js et un frontend statique.

## Description

Ce projet est un forum social qui propose :
- inscription et connexion utilisateur
- création, mise à jour, suppression de topics
- messagerie publique dans les topics
- votes sur les messages
- gestion de profils, d'amis et de notifications
- pages d'administration pour gérer les utilisateurs
- tags, recherche et pagination

Le backend Express sert le frontend statique depuis le dossier `forum/` et expose une API REST sous `/api`.

## Structure du projet

- `backend/` : serveur Node.js / Express
- `backend/router/` : routes API
- `backend/controller/` : logique métier et requêtes SQL
- `backend/DB/` : scripts de création et d'initialisation de la base de données
- `forum/` : application frontend statique (HTML/CSS/JS)

## Prérequis

- Node.js 16+ / npm
- MySQL ou MariaDB
- Navigateur moderne

## Installation

1. Cloner le dépôt :

```bash
git clone https://github.com/nikita-ynov/forumJs.git
cd forumJs/backend
```

2. Installer les dépendances :

```bash
npm install
```

3. Créer un fichier `.env` dans `backend/` avec les variables suivantes :

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=forumDb
DB_PORT=3306
PORT=8080
```

4. Initialiser la base de données MySQL :

- Exécuter `backend/DB/migration.sql` pour créer le schéma.
- Exécuter `backend/DB/insertion.sql` pour remplir les comptes et les données de démonstration.

Par exemple :

```bash
mysql -u root -p < backend/DB/migration.sql
mysql -u root -p < backend/DB/insertion.sql
```

> Adaptez `root` et les options de connexion si nécessaire.

## Démarrage

Depuis le répertoire `backend/` :

```bash
npm start
```

Ou en mode développement :

```bash
npm run dev
```

Le serveur démarrera sur `http://localhost:8080` par défaut et servira le frontend.

## Pages principales

- `index.html` : page d'accueil et liste des topics
- `pages/login.html` : connexion
- `pages/signup.html` : inscription
- `pages/create.html` : création de topic
- `pages/post.html` : affichage d'un topic et discussion
- `pages/profile.html` : profil utilisateur
- `pages/notifications.html` : notifications
- `pages/admin.html` : administration des utilisateurs
- `pages/user.html` : page de profil public

## API principales

Voici quelques routes importantes exposées par le backend :

- `POST /api/register`
- `POST /api/login`
- `GET /api/topics`
- `POST /api/topics`
- `GET /api/topics/:id`
- `PATCH /api/topics/:id`
- `DELETE /api/topics/:id`
- `GET /api/topics/:id/messages`
- `POST /api/topics/:id/messages`
- `DELETE /api/topics/:topicId/messages/:msgId`
- `POST /api/messages/:msgId/vote`
- `GET /api/profile/:userId`
- `PATCH /api/profile/:userId`
- `GET /api/friends/:userId`
- `GET /api/notifications/:userId`
- `PATCH /api/notifications/:userId`
- `GET /api/tags`
- `GET /api/admin/users`
- `PATCH /api/admin/users/:id/ban`
- `PATCH /api/admin/users/:id/unban`

## Comptes de test

| Pseudo | Mot de passe | Rôle |
|--------|--------------|------|
| admin  | Admin1!ynov  | admin |
| john   | John1!ynov   | user  |
| sarah  | Sarah1!ynov  | user  |

## Notes

- Le projet utilise des mots de passe hashés avec SHA-512 dans la base de données.
- Le frontend appelle l'API à l'adresse `http://localhost:8080/api`.
- Les images et styles sont fournis dans `forum/styles/` et `forum/js/`.

## Améliorations possibles

- ajout de sessions sécurisées / JWT
- upload d'avatar
- protection CSRF et validation côté serveur plus complète
- recherche plus avancée et filtres supplémentaires
- pagination côté frontend plus robuste
