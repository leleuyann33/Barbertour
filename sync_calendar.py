import json
import os
import sys
from datetime import datetime
import time

try:
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
except ImportError:
    print("Erreur : Les bibliothèques Google ne sont pas installées.")
    print("Lancez : pip install google-auth google-api-python-client requests")
    sys.exit(1)

# Configuration
CALENDAR_ID_ENV = os.environ.get('CALENDAR_ID', 'primary')
CALENDAR_IDS = [cid.strip() for cid in CALENDAR_ID_ENV.split(',')]
SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']
JSON_PATH = 'dates.json'

# Known Coordinates Cache (pour Dunkerque et autres)
VENUE_COORDS = {
    "Essaïon Théâtre": [48.8596, 2.3539],
    "Espace Nino Ferrer": [48.5106, 2.6358],
    "Espace Culturel Saint-Grégoire": [48.0425, 7.1384],
    "Salle La PLéiade": [45.7333, -1.0991],
    "Centre culturel Jean-Pierre Fabrègue": [45.5132, 1.2045],
    "L'ApARTe": [45.2319, 4.6547],
    "Vianne": [44.1965, 0.3205],
    "Théâtre Jacques Bodoin": [45.0681, 4.8322],
    "Espace Agapit": [46.4111, -0.2039],
    "Le Manège": [48.5042, 2.7842],
    "Maison de la Culture": [46.9926, 3.1601],
    "La Castélorienne": [47.6975, 0.4208],
    "Théâtre Claude Debussy": [48.8049, 2.4344],
    "Les Carmes": [45.7414, 0.3861],
    "L'Azile": [46.1558, -1.1381],
    "Auditorium": [44.4839, -1.0747],
    "Théâtre Cravey": [44.6294, -1.1444],
    "Quai des Arts": [48.0583, 0.7306],
    "Le NEC": [45.4744, 4.3789],
    "Animatis": [45.5414, 3.2458],
    "Espace Brémontier": [44.7667, -1.1356],
    "Les Tanzmatten": [48.2592, 7.4475],
    "Théâtre Municipal": [48.0792, 7.3586],
    "Les Bains Douches": [47.5076, 6.7945],
    "L'Escale": [45.7533, 4.7214],
    "Dammarie-les-Lys": [48.5106, 2.6358],
    "Dunkerque": [51.0343, 2.3767],
    "Paris": [48.8566, 2.3522]
}


def geocode(location):
    """Retourne les coordonnées depuis le cache ou via Nominatim."""
    if not location:
        return None
    
    # Check cache
    for venue, coords in VENUE_COORDS.items():
        if venue.lower() in location.lower():
            return coords
            
    # Fallback Nominatim
    try:
        import requests
        time.sleep(2.5) # Délai ultra-safe (Nominatim exige max 1 req/sec)
        url = f"https://nominatim.openstreetmap.org/search?format=json&q={location}&limit=1"
        resp = requests.get(url, headers={'User-Agent': 'BarberSyncBot/3.0'}, timeout=5)
        data = resp.json()
        if data:
            return [float(data[0]['lat']), float(data[0]['lon'])]
    except Exception as e:
        print(f"  WAINING : Erreur geocoding pour '{location}': {e}")
    return None


def get_service():
    """Authentification via Service Account (clé JSON stockée en GitHub Secret)."""
    key_json = os.environ.get('GOOGLE_SERVICE_ACCOUNT_KEY')
    if not key_json:
        print("ERREUR : Variable d'environnement GOOGLE_SERVICE_ACCOUNT_KEY manquante.")
        sys.exit(1)
        
    try:
        service_account_info = json.loads(key_json)
        creds = service_account.Credentials.from_service_account_info(
            service_account_info, scopes=SCOPES
        )
        return build('calendar', 'v3', credentials=creds)
    except Exception as e:
        print(f"ERREUR : Echec de l'authentification Google Cloud : {e}")
        sys.exit(1)


def sync():
    print(f"--- Démarrage de la synchronisation ({datetime.now().strftime('%Y-%m-%d %H:%M:%S')}) ---")
    
    # 1. Charger les données existantes (Sécurité : On ne veut jamais rien perdre)
    existing_data = []
    if os.path.exists(JSON_PATH):
        try:
            with open(JSON_PATH, 'r', encoding='utf-8') as f:
                existing_data = json.load(f)
            print(f"✓ {len(existing_data)} dates chargées depuis {JSON_PATH}.")
        except Exception as e:
            print(f"ERREUR : Impossible de lire {JSON_PATH} : {e}")
            sys.exit(1)
    else:
        print(f"! {JSON_PATH} n'existe pas encore. Nouveau fichier sera créé.")

    # Créer un index des dates existantes pour une fusion rapide (clé: date + titre)
    # On normalise le titre pour la comparaison
    def get_key(ev): return f"{ev['date']}_{ev['title'].strip().upper()}"
    existing_map = {get_key(ev): ev for ev in existing_data}

    # 2. Se connecter à Google Calendar
    service = get_service()
    print(f"✓ Connecté à l'API Google Calendar.")

    # 3. Récupérer les événements de TOUS les calendriers
    all_items = []
    for calendar_id in CALENDAR_IDS:
        # A. Tentative Google API (pour agendas privés partagés)
        try:
            print(f"Récupération via API Google pour : {calendar_id}...")
            events_result = service.events().list(
                calendarId=calendar_id,
                timeMin='2025-01-01T00:00:00Z',
                maxResults=1000,
                singleEvents=True,
                orderBy='startTime'
            ).execute()
            items = events_result.get('items', [])
            print(f"  ✓ {len(items)} événements trouvés via API dans {calendar_id}.")
            all_items.extend(items)
            continue # Si ça marche, on passe au suivant
        except Exception:
            print(f"  ℹ Accès API non disponible pour {calendar_id}. Tentative via flux Public iCal...")

        # B. Tentative iCal Public (pour agendas publics sans invitation)
        try:
            import requests
            # Correction de l'email pour l'URL iCal
            safe_id = calendar_id.replace('@', '%40')
            ical_url = f"https://calendar.google.com/calendar/ical/{safe_id}/public/basic.ics"
            resp = requests.get(ical_url, timeout=10)
            if resp.status_code == 200:
                # Parsing basique de l'iCal (sans bibliothèque complexe pour rester léger)
                lines = resp.text.splitlines()
                current_ev = {}
                ical_events = 0
                for line in lines:
                    if line.startswith('BEGIN:VEVENT'): current_ev = {}
                    elif line.startswith('SUMMARY:'): current_ev['summary'] = line[8:]
                    elif line.startswith('LOCATION:'): current_ev['location'] = line[9:]
                    elif line.startswith('DTSTART'): 
                        # DTSTART;VALUE=DATE:20261225 ou DTSTART:20261225T200000Z
                        val = line.split(':')[-1]
                        current_ev['start'] = {'date': f"{val[0:4]}-{val[4:6]}-{val[6:8]}"}
                    elif line.startswith('END:VEVENT'):
                        if current_ev.get('summary'):
                            all_items.append(current_ev)
                            ical_events += 1
                print(f"  ✓ {ical_events} événements trouvés via flux Public pour {calendar_id}.")
            else:
                print(f"  ❌ Erreur flux Public pour {calendar_id} : {resp.status_code}")
        except Exception as e:
            print(f"  ⚠️ Échec total pour {calendar_id} : {e}")

    if not all_items and len(CALENDAR_IDS) > 0:
        print("WAINING : Aucun événement trouvé sur l'ensemble des calendriers.")

    # 4. Traiter et Fusionner
    new_count = 0
    update_count = 0
    
    for item in all_items:
        title = item.get('summary', '').strip()
        if not title:
            continue

        # Filtre de sécurité : seuls les titres avec BSQ, BARBER ou OPTION
        if not any(x in title.upper() for x in ['BSQ', 'BARBER', 'OPTION']):
            continue

        location = item.get('location', '')
        
        # Extraction intelligente au cas où le champ 'Lieu' est vide dans l'agenda
        if not location and '@' in title:
            loc_candidate = title.split('@', 1)[1]
            # On nettoie pour retirer tout ce qui suit une parenthèse ou un tiret
            loc_candidate = loc_candidate.split('(')[0].split('-')[0].strip()
            if loc_candidate:
                location = loc_candidate
                
        date_str = item.get('start', {}).get('dateTime', item.get('start', {}).get('date', ''))
        date = date_str.split('T')[0] if 'T' in date_str else date_str
        
        # Créer l'objet événement
        event_key = f"{date}_{title.upper()}"
        
        if event_key in existing_map:
            # Mise à jour optionnelle d'une date existante (ex: changement de lieu)
            # On ne touche PAS au manualStatus si présent
            existing_ev = existing_map[event_key]
            if location and location != existing_ev.get('location'):
                existing_ev['location'] = location
                existing_ev['coords'] = geocode(location)
                update_count += 1
                print(f"  ↻ Mis à jour : {title} ({date})")
        else:
            # Ajout d'une nouvelle date
            new_ev = {
                "date": date,
                "title": title,
                "location": location,
                "coords": geocode(location)
            }
            existing_data.append(new_ev)
            existing_map[event_key] = new_ev
            new_count += 1
            print(f"  + Nouveau : {title} ({date})")

    # 5. Sauvegarder (Fusion finale)
    # On trie par date pour garder un fichier propre
    existing_data.sort(key=lambda x: x['date'])

    try:
        with open(JSON_PATH, 'w', encoding='utf-8') as f:
            json.dump(existing_data, f, indent=2, ensure_ascii=False)
        print(f"\n--- SYNCHRONISATION RÉUSSIE ---")
        print(f"Nouvelles dates ajoutées : {new_count}")
        print(f"Dates mises à jour : {update_count}")
        print(f"Total de dates dans le fichier : {len(existing_data)}")
        print(f"Aucune date n'a été supprimée.")
    except Exception as e:
        print(f"ERREUR : Echec de l'écriture du fichier {JSON_PATH} : {e}")
        sys.exit(1)


if __name__ == "__main__":
    sync()
