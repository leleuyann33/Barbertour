# 📜 RÈGLES SYSTÈME (CRITIQUE)

Ce fichier est le "livre de règles interne" persistant du projet. 
Il DOIT être lu au début de CHAQUE session.

## 🚨 RÈGLES DE SÉCURITÉ (NON-NÉGOCIABLES)

- **VERROUILLAGE FRONT-END (ACTIF)** : Ne modifier EN AUCUN CAS les fichiers HTML, CSS ou JS de la carte. Ces fichiers sont VERROUILLÉS en état de production locale. Toute initiative de design ou de modification layout doit être annulée et interdite.

- **NE JAMAIS supprimer** de code existant sans confirmation explicite de l'utilisateur.
- **NE JAMAIS réécrire** un fichier entier, sauf demande explicite.
- **TOUJOURS modifier** le code de manière incrémentale.
- **TOUJOURS lire** les fichiers AVANT de les modifier.
- Si quelque chose est peu clair → **S'ARRÊTER et demander**.

L'intégrité du projet est TOUJOURS plus importante que la rapidité.

## 📂 MÉMOIRE DU PROJET

Le dossier `/consigne` à la racine est obligatoire et contient :
- `system.md`        → règles obligatoires (priorité maximale).
- `projet.md`        → objectifs et portée du projet.
- `architecture.md`  → conception et structure du système.
- `taches.md`        → tâches terminées et en attente.
- `journal.md`       → journal chronologique des actions et décisions.

## 💾 POLITIQUE DE SAUVEGARDE

Avant toute refactorisation, modification multi-fichiers ou changement structurel :
- Créer une sauvegarde complète du projet dans le dossier `/backup`.

## 🌐 DÉVELOPPEMENT WEB

- Priorité : HTML + Vanilla JavaScript + Vanilla CSS.
- Design : Clarté, utilisabilité, esthétique moderne sans sur-ingénierie.
