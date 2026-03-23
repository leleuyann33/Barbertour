# ✅ TÂCHES

Liste des tâches terminées et à venir.

## 🔴 En attente de l'utilisateur (session 2026-03-21)
- [ ] **PRIORITÉ** : L'utilisateur doit configurer le Service Account Google (suivre `consigne/tutoriel_service_account.md`).
  - Étape 1 : Créer projet Google Cloud
  - Étape 2 : Activer Google Calendar API
  - Étape 3 : Créer le Service Account et noter son email
  - Étape 4 : Télécharger la clé JSON
  - Étape 5 : Partager le calendrier avec l'email du Service Account
  - Étape 6 : Ajouter les 2 Secrets GitHub (`GOOGLE_SERVICE_ACCOUNT_KEY` et `CALENDAR_ID`)
  - Étape 7 : Lancer le robot et vérifier que DUNKERQUE est bien récupérée

## 🟠 Travail inachevé (Modèle IA précédent)
- [x] **Committer la modification locale** : Le fichier `sync_calendar.py` a été modifié en local. L'IA l'a committé et poussé sur GitHub.
- [x] **Mettre à jour le secret GitHub** : Le secret GitHub `CALENDAR_ID` a été mis à jour avec `compagniebarbershopquartet@gmail.com`.
## À faire (futur)
- [ ] Vérifier que DUNKERQUE (22 mars 2026) apparaît bien sur la carte après fix.
- [ ] Valider que le robot tourne bien chaque nuit à 4h UTC.

## Terminé (cette session)
- [x] Création de `consigne/references.md` avec toutes les URLs du projet.
- [x] Installation et authentification de GitHub CLI (`gh`).
- [x] Identification et correction du bug critique dans `.github/workflows/sync.yml` :
  - `actions/set-up-python` → `actions/setup-python@v4`
  - `actions/checkout@v2` → `actions/checkout@v4`
  - `python_version` → `python-version`
- [x] Déclenchement manuel du workflow — workflow OK, mais DUNKERQUE non récupérée (API issue).

## Terminé (session 2026-03-22 - v6.2.2)
- [x] **Focus Sécurisé** : Travail exclusif dans le dossier `proposition-projet`.
- [x] **Optimisation Mobile Pixel Perfect** :
    - Suppression de la grille des mois sur mobile.
    - Réduction de la taille des marqueurs (12px).
    - Augmentation de la transparence de la carte.
    - Désactivation du déplacement de la carte sur mobile (pour faciliter le scroll de la page).
- [x] **Optimisation Vidéo** :
    - Intégration de l'affiche `poster.jpg` dans le lecteur.
    - Implémentation de la **mise en pause automatique au scroll**.
    - Volume par défaut réglé à **15%**.
- [x] **Accès Distant** : Restauration du tunnel `localtunnel` avec subdomain `ready-geckos-know`.
- [x] **Journal de Bord** : Mise à jour en temps réel dans `consigne/journal.md`.

## Terminé (sessions précédentes)
- [x] Création du dossier `/consigne`
- [x] Création de `system.md`, `journal.md`, `projet.md`, `architecture.md`
- [x] Analyse initiale du code source
