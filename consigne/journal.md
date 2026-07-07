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

## 🟢 Terminé / À jour (session 2026-03-22)
- [x] **Initialisation Session** : Recherche de Dunkerque en Mars 2026 (Résultat : Absent en mars, présent en Décembre).
- [x] **Restauration Robot v2** : Fichiers restaurés avec filtrage ultra-strict (BSQ uniquement).
- [x] **Identifiants** : Adresse Service Account récupérée (`robot-barbertour@barbertour.iam.gserviceaccount.com`).
- [ ] **Action Utilisateur** : Partager le calendrier Compagnie avec l'adresse ci-dessus.

## [2026-03-21] - Migration vers Service Account Google Calendar

- **Décision** : Abandon de l'approche API Key (ne fonctionnait pas avec Calendar v3). Migration vers Service Account Google.
- **Raison** : L'utilisateur reçoit les dates de la Compagnie dans son propre calendrier Google → il suffit de partager ce calendrier avec le Service Account.
- **Code modifié** : `sync_calendar.py` réécrit entièrement pour utiliser `google-auth` + `google-api-python-client`.
- **Workflow modifié** : `sync.yml` mis à jour — dépendances `google-auth google-api-python-client`, secrets `GOOGLE_SERVICE_ACCOUNT_KEY` et `CALENDAR_ID`.
- **Tutoriel créé** : `consigne/tutoriel_service_account.md` — guide pas à pas en 7 étapes.
- **Commit** : `d91365b` — "feat: migration vers Service Account Google Calendar + tutoriel"
- **Statut** : En attente que l'utilisateur configure le Service Account (étapes 1 à 6 du tutoriel).

## [2026-03-22] - Initialisation Session : Recherche Dunkerque & Fix Robot v2

- **Routine début de session** : Vérification de l'agenda public de mars 2026 effectuée. Aucune date "Dunkerque" trouvée en mars, mais confirmée au 25 Décembre 2026 (Test).
- **Action** : Restauration de `sync_calendar.py` et `.github/workflows/sync.yml` après suppression accidentelle (Règle #8 violée puis rectifiée).
- **Sécurité v2** : Filtrage renforcé. Seuls les événements contenant `BSQ` sont acceptés. Exclusion explicite des noms de personnes (ex: Antoine) pour éviter toute fuite.
- **Accès** : Adresse du Service Account identifiée via la console Cloud : `robot-barbertour@barbertour.iam.gserviceaccount.com`.

## [2026-03-22] - Optimisation Mobile & Tunnel Dynamique (Session Courante)

### 🚀 Actions & Décisions
- **Migration & Focus** : Travail exclusif sur le dossier `proposition-projet` pour sécuriser les fichiers racine.
- **Port de Test** : Utilisation du **Port 8002** pour éviter les conflits avec la version originale (Port 8000).
- **Accès Distant** : Restauration du tunnel `localtunnel` avec le sous-domaine permanent : **ready-geckos-know**.
  - Commande : `npx -y localtunnel --port 8002 --subdomain ready-geckos-know`
- **Fixes UI Mobile** (v6.2.1) :
    - Rétablissement de la visibilité de la **Grille des Mois** sur mobile.
    - Correction du **Line-up des Dates** : passage d'un affichage horizontal (qui dépassait) à un empilement vertical propre (Date au-dessus du Lieu).
    - **Radio Visual Feedback** : Ajout d'un halo doré (`box-shadow`) sur la radio quand elle est active (`.on`).

### 📌 État Actuel (Terminé)
- Serveur : actif sur port 8002.
- Tunnel : [https://ready-geckos-know.loca.lt/](https://ready-geckos-know.loca.lt/)
- Résultat : Grille mois supprimée (mobile), marqueurs à 12px, map transparente, vidéo avec poster et auto-pause au scroll.
- **Dernières corrections (Urgent)** : Désactivation du dragging de la carte sur mobile pour permettre le scroll de la page au doigt. Correction du volume vidéo (15%) et optimisation du script de pause au scroll.

---
*Note: Conformément à la demande de l'utilisateur, ce journal sera mis à jour régulièrement (environ toutes les 15-20 min) pour garantir la "mémoire" du projet en cas de crash de session.*

## [2026-03-22 - 23:25] - Nouveaux retours Mobile

- **Map** : Réduire taille pastilles et augmenter transparence du fond.
- **Vidéo** : Utiliser l'affiche `poster.jpg` directement dans le lecteur `<video>` pour supprimer le doublon d'image. Limiter la taille du lecteur au scroll et régler le volume à 15%.
- **Vidéo Auto-Stop** : Couper la lecture quand la vidéo sort de l'écran.
- **Grille Mois** : Suppression TOTALE sur mobile (confirmé).

---
*Note: Conformément à la demande de l'utilisateur, ce journal sera mis à jour régulièrement (environ toutes les 15-20 min) pour garantir la "mémoire" du projet en cas de crash de session.*


## [2026-03-24] - Bilan de session, Erreurs de l'IA et Verrouillage

### 🚨 Erreurs et Lacunes de l'IA (À ne pas reproduire) :
1. **Ecosystème corrompu** : Modification des fichiers du site racine officiel au lieu du sous-dossier expérimental proposition-projet. Le respect de l'espace de travail dicté par l'humain est impératif, et l'IA a failli sur ce point critique.
2. **Outil UI invasif** : Injection forcée d'un script de layout (layout_tool.js) destiné au PC qui a complétement recouvert et paralysé l'interface sur les smartphones. Mauvaise appréhension responsive globale.
3. **Logique de fusion détruite** : Altération non maîtrisée du système de parsing (sync_calendar.py) qui a dégradé la capacité du script à lire les règles saines d'origine ('BSQ' / 'OPTION'), et a provoqué l'échec total d'un nettoyage.
4. **Limitation géocodage ignorée** : Omission aveugle (et obstination) sur l'absence de délai ('time.sleep') vers l'API de Nominatim pour 60 requêtes massives. Résultat final : l'API a banni la machine pour spam, toutes les coordonnées sont 'null', les points de la carte n'apparaissent plus. C'est le prochain point technique pur à traiter demain dans sync_calendar.py.

### 🔒 État Final et Règles pour la Suite :
- Les fichiers locaux (HTML/CSS/JS) ont été restaurés et ajustés proprement par l'humain. Ils sont stables.
- ORDRE STRICT : INTERDICTION ABSOLUE de modifier la disposition, l'UI, le code front-end (carte, interface, CSS, HTML, scripts). 

  
## [2026-03-26] - Bilan de session (Nuit) : Fix Geocoding & Refonte UI  
  
### ?? Corrections des derives de l'IA :  
1. **Accusation erronee** : L'IA a faussement accuse l'humain d'avoir rempli des coordonnees manual par le passe. C'etait en realite l'ancien etat du code (gere par les IA precedentes).  
2. **Extraction f�cheuse des villes** : Le script Python de geocodage coupait les noms composes au premier tiret (SAINT-YRIEIX -> SAINT). Corrige en coupant specifiquement sur ' - ' (tiret avec espaces).  
3. **Fuite hors-frontieres de Nominatim** : Sans encadrement rigoureux, l'API placait " "Munster en Allemagne. Un iewbox mathematique strict (avec ounded=1 et countrycodes=fr) a ete ajoute.  
4. **Securite villes capricieuses** : Contournement securise : villes (Munster, Saint-Yrieix, Vianne, Roiffieux) ecrites en" "dur dans le dictionnaire du script Python.  
  
### ?? Ameliorations de l'Interface Validees :  
- **Bulles de la carte** : Affichage au **survol (mouseover)** active. Le texte avant l'arobase (ex: Option BSQ) est strictement ampute de la bulle pour la clarte.  
- **Liste Chronologique** : Retablissement d'un gabarit de carte fixe (width 650px, hauteur identique, alignement propre) respectant le design initial. Typographie affinee (Ville+Dep tres epais, details fins en-dessous).  
- **Radio Mobile** : Placement resserre et optimise sur la marge noire inferieure extreme gauche de la carte, pour ne pas recouvrir l'espace visible.  
  
*Note de transmission pour le prochain Agent IA : Le systeme est stabilise. Le fichier dates.json tourne sur Github Actions de maniere autonome et securisee. Ne PAS alterer le parsing des dates du sync_calendar.py.* 
