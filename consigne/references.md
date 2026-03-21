# 📌 RÉFÉRENCES DU PROJET — Liens & Accès Importants

Ce fichier centralise **toutes les informations d'accès** au projet pour ne jamais avoir à chercher.

---

## 🌐 Site Web & Hébergement

| Élément | URL / Info |
|---|---|
| **Site en ligne (GitHub Pages)** | https://leleuyann33.github.io/Barbertour/ |
| **Serveur local de test** | http://localhost:8000 |
| **Lancer le serveur local** | Double-cliquer sur `Lancer Serveur.bat` |

---

## 🐙 GitHub

| Élément | URL / Info |
|---|---|
| **Dépôt GitHub** | https://github.com/leleuyann33/Barbertour |
| **Branche principale** | `main` |
| **GitHub Actions (robot sync)** | https://github.com/leleuyann33/Barbertour/actions |
| **Fichier workflow** | `.github/workflows/sync.yml` |
| **Compte GitHub** | `leleuyann33` — email : `leleuyanntv@outlook.fr` |

---

## 🖥️ GitHub CLI (`gh`)

| Élément | Info |
|---|---|
| **Statut** | ✅ Installé et connecté (2026-03-21) |
| **Compte connecté** | `leleuyann33` |
| **Déclencher le sync manuellement** | `gh workflow run sync.yml --repo leleuyann33/Barbertour` |
| **Voir les runs en cours** | `gh run list --workflow="sync.yml" --repo leleuyann33/Barbertour` |

---

## 📅 Google Calendar (Synchronisation Automatique)

| Élément | URL / Info |
|---|---|
| **Calendrier public (vue web)** | https://calendar.google.com/calendar/embed?src=compagniebarbershopquartet%40gmail.com&ctz=Europe%2FParis |
| **ID du calendrier** | `compagniebarbershopquartet@gmail.com` |
| **Clé API Google** | `AIzaSyDOtGM5jr8bNp1utVpG2_gSRH03RNGBkI8` |
| **Accès** | Public (lecture seule) |
| **Script de sync** | `sync_calendar.py` |
| **Heure du robot** | Chaque nuit à **04h00 UTC** (06h00 heure de Paris en été) |

> [!IMPORTANT]
> Le robot GitHub Actions filtre les événements : seuls les titres contenant **BSQ**, **BARBER** ou **OPTION** sont importés dans `dates.json`.

> [!NOTE]
> **Problème connu (2026-03-21)** : Le robot retourne une erreur 404 en accédant à l'API, malgré le calendrier déclaré public. Piste à investiguer : la clé API ou la configuration de visibilité exacte du calendrier Google.

---

## 🔐 Accès Administrateur (Site)

| Élément | Valeur |
|---|---|
| **Trigger** | Cliquer sur le `©` dans le footer |
| **Mot de passe** | `BARBER2025` |

---

## 📂 Fichiers Clés du Projet

| Fichier | Rôle |
|---|---|
| `index.html` | Structure de la page |
| `style.css` | Design & animations (thème vintage) |
| `script.js` | Logique principale (carte, radio, admin) |
| `dates.json` | Base de données des dates de tournée |
| `sync_calendar.py` | Script de synchronisation avec Google Calendar |
| `layout-editor.js` | Outil d'ajustement du layout (utilitaire) |
| `poster.jpg` | Affiche du spectacle |

---

*Dernière mise à jour : 2026-03-21*
