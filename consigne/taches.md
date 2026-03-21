# ✅ TÂCHES

Liste des tâches terminées et à venir.

## 🔴 En cours / À reprendre (session 2026-03-21)
- [ ] **PRIORITÉ** : Déboguer pourquoi l'API Google Calendar ne retourne pas la date DUNKERQUE.
  - Le workflow GitHub Actions fonctionne maintenant (bug sync.yml corrigé).
  - Hypothèse : le calendrier public nécessite une config spéciale pour l'API Key (vs OAuth).
  - Piste : vérifier les logs complets du run `23370291176` — étape "Run sync script" — chercher le code de retour HTTP réel de l'API.
  - **CONTRAINTE** : Ne PAS ajouter la date manuellement dans `dates.json`. Le robot doit la trouver seul.
  - Commande pour tester l'API directement : `Invoke-WebRequest "https://www.googleapis.com/calendar/v3/calendars/compagniebarbershopquartet%40gmail.com/events?key=AIzaSyDOtGM5jr8bNp1utVpG2_gSRH03RNGBkI8&singleEvents=true&timeMin=2026-03-01T00:00:00Z&maxResults=10"`
  - Pour relancer le workflow : `& "C:\Program Files\GitHub CLI\gh.exe" workflow run sync.yml --repo leleuyann33/Barbertour`

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
