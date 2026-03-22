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
- [x] **Committer la modification locale** : Le fichier `sync_calendar.py` a été modifié en local (le Fallback par défaut `CALENDAR_ID` est désormais `leyannpro@gmail.com`). L'IA l'a committé et poussé sur GitHub.
- [ ] **Mettre à jour le secret GitHub** : Si l'utilisateur a déjà configuré le secret GitHub `CALENDAR_ID` dans le passé, vérifier et s'assurer qu'il contient bien `leyannpro@gmail.com` (sinon il écrasera la nouvelle valeur par défaut).
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

## Terminé (sessions précédentes)
- [x] Création du dossier `/consigne`
- [x] Création de `system.md`, `journal.md`, `projet.md`, `architecture.md`
- [x] Analyse initiale du code source
