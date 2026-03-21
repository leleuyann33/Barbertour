# 🏗️ ARCHITECTURE DU SYSTÈME

## Stack Technique
- **Frontend** : HTML5, CSS3, JavaScript (Vanilla).
- **Cartographie** : [Leaflet.js](https://leafletjs.com/).
- **Données** : JSON (`dates.json`) servant de base de données plate.
- **Automatisation** : Script Python (`sync_calendar.py`) pour la synchronisation avec Google Calendar (via GitHub Actions).

## Structure des Fichiers
- `index.html` : Structure de la page unique (SPA-like).
- `style.css` : Design, animations et layout (thème vintage/théâtre).
- `script.js` : Logique principale (Map, Radio, Admin, Rendu).
- `dates.json` : Stockage des événements de la tournée.
- `layout-editor.js` : Outil utilitaire pour l'ajustement du layout (si actif).

## Composants Clés
1. **Initialisation de la Carte** : Utilisation de Leaflet avec un fond de carte OpenStreetMap/Custom.
2. **Système de Markers** : Différenciation visuelle par statut (Rouge=Confirmé, Jaune=Prévu, Gris=Passé).
3. **Le "Coffre Secret"** : Modal d'administration accessible via un trigger discret dans le footer (Pass: BARBER2025).
4. **Radio Barber** : Composant SVG interactif gérant un flux audio (Radio Swiss Jazz par défaut) ou des fichiers locaux.
