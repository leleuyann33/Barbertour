# 📓 JOURNAL DU PROJET

Journal chronologique des actions, décisions et changements notables.

## [2026-03-21] - Recadrage sur le projet Carte Barber

- **Action** : Recentrage exclusif sur le projet "Carte Barber".
- **Décision** : Les informations liées au projet "audio_player" sont mises de côté pour cette session.
- **Statut** : Prêt pour les commandes liées à la Carte Barber.

## [2026-03-21] - Centralisation des références & Diagnostic sync

- **Action** : Création du fichier `consigne/references.md` centralisant toutes les URLs et accès du projet (GitHub, Google Calendar, site en ligne, admin).
- **Diagnostic** : Identification que le robot GitHub Actions retournait une 404 sur l'API Google Calendar. Cause : calendrier déclaré public mais la clé API simple a des limites. À surveiller à l'avenir.
- **Nouveau fichier** : `consigne/references.md`

## [2026-03-21] - Installation et connexion GitHub CLI + Déclenchement manuel du sync

- **Action** : Installation du GitHub CLI (`gh`) sur la machine. Authentification via code `F0CB-1BFD` (navigateur).
- **Action** : Déclenchement manuel du workflow "Sync Tour Dates" via `gh workflow run sync.yml`.
- **Résultat** : Workflow lancé avec succès. ID de run : `23370258425`. URL : https://github.com/leleuyann33/Barbertour/actions/runs/23370258425
- **Commande pour déclencher à l'avenir** : `gh workflow run sync.yml --repo leleuyann33/Barbertour`

## [2026-03-21] - Correction bug critique dans sync.yml

- **Bug identifié** : `actions/set-up-python` (inexistant) au lieu de `actions/setup-python`. C'était la vraie cause des échecs depuis le début.
- **Correction** : `actions/set-up-python@v2` → `actions/setup-python@v4`, `actions/checkout@v2` → `actions/checkout@v4`, `python_version` → `python-version`.
- **Résultat** : Workflow relancé avec succès — toutes les étapes ✅. Run ID : `23370291176`.
- **Commit** : `9dc64ad` — "fix: corrige typo setup-python et versions des actions"

## [2026-03-21] - Fin de session — État et pistes pour reprendre

- **Objectif non atteint** : La date **BSQ "GB" @ DUNKERQUE (59)** du **22 mars 2026** n'est pas dans `dates.json`.
- **Contrainte** : Ne pas ajouter cette date manuellement. Le robot DOIT la trouver seul.
- **Cause probable** : L'API Google Calendar retourne probablement une 404 ou 403 dans le script `sync_calendar.py` malgré le calendrier déclaré public.
- **Piste 1** : Vérifier les logs du run `23370291176` sur l'étape "Run sync script" pour voir le code HTTP exact retourné par l'API.
- **Piste 2** : Tester l'URL de l'API depuis PowerShell local une fois `requests` installé (`pip install requests`) ou via `Invoke-WebRequest`.
- **Piste 3** : Il se peut que le calendrier Google nécessite d'être partagé explicitement via **Paramètres → Partager ce calendrier → Rendre disponible au public** (pas juste l'embed).
- **Commande pour relancer** : `& "C:\Program Files\GitHub CLI\gh.exe" workflow run sync.yml --repo leleuyann33/Barbertour`
- **Commande pour voir les logs** : `& "C:\Program Files\GitHub CLI\gh.exe" run view --repo leleuyann33/Barbertour --log-failed`

## [2026-03-21] - Migration vers Service Account Google Calendar

- **Décision** : Abandon de l'approche API Key (ne fonctionnait pas avec Calendar v3). Migration vers Service Account Google.
- **Raison** : L'utilisateur reçoit les dates de la Compagnie dans son propre calendrier Google → il suffit de partager ce calendrier avec le Service Account.
- **Code modifié** : `sync_calendar.py` réécrit entièrement pour utiliser `google-auth` + `google-api-python-client`.
- **Workflow modifié** : `sync.yml` mis à jour — dépendances `google-auth google-api-python-client`, secrets `GOOGLE_SERVICE_ACCOUNT_KEY` et `CALENDAR_ID`.
- **Tutoriel créé** : `consigne/tutoriel_service_account.md` — guide pas à pas en 7 étapes.
- **Commit** : `d91365b` — "feat: migration vers Service Account Google Calendar + tutoriel"
- **Statut** : En attente que l'utilisateur configure le Service Account (étapes 1 à 6 du tutoriel).
