import json
import os
from datetime import timezone

from google.oauth2 import service_account
from googleapiclient.discovery import build

# Configuration — CALENDAR_ID est stocké en GitHub Secret ou en variable d'env
CALENDAR_ID = os.environ.get('CALENDAR_ID', 'compagniebarbershopquartet@gmail.com')
SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']
JSON_PATH = 'dates.json'

# Known Coordinates Cache (identique à l'original)
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
    """Retourne les coordonnées depuis le cache, ou None."""
    if not location:
        return None
    for venue, coords in VENUE_COORDS.items():
        if venue.lower() in location.lower():
            return coords
    # Fallback Nominatim (optionnel, évite les blocages en CI)
    try:
        import requests
        url = f"https://nominatim.openstreetmap.org/search?format=json&q={location}&limit=1"
        resp = requests.get(url, headers={'User-Agent': 'BarberSyncBot/2.0'}, timeout=5)
        data = resp.json()
        if data:
            return [float(data[0]['lat']), float(data[0]['lon'])]
    except Exception:
        pass
    return None


def get_service():
    """Authentification via Service Account (clé JSON stockée en GitHub Secret)."""
    key_json = os.environ.get('GOOGLE_SERVICE_ACCOUNT_KEY')
    if not key_json:
        raise EnvironmentError(
            "Variable d'environnement GOOGLE_SERVICE_ACCOUNT_KEY manquante. "
            "Ajouter la clé JSON du Service Account dans les Secrets GitHub."
        )
    service_account_info = json.loads(key_json)
    creds = service_account.Credentials.from_service_account_info(
        service_account_info, scopes=SCOPES
    )
    return build('calendar', 'v3', credentials=creds)


def sync():
    print("Connexion au calendrier via Service Account...")
    service = get_service()

    print(f"Récupération des événements du calendrier : {CALENDAR_ID}")
    events_result = service.events().list(
        calendarId=CALENDAR_ID,
        timeMin='2025-01-01T00:00:00Z',
        maxResults=500,
        singleEvents=True,
        orderBy='startTime'
    ).execute()

    items = events_result.get('items', [])
    print(f"{len(items)} événement(s) trouvé(s) dans le calendrier.")

    # Charger l'existant pour préserver les manualStatus
    existing_data = []
    if os.path.exists(JSON_PATH):
        with open(JSON_PATH, 'r', encoding='utf-8') as f:
            existing_data = json.load(f)

    processed_events = []
    for item in items:
        title = item.get('summary', 'Date de tournée')

        # Filtre : seuls les événements BSQ / BARBER / OPTION
        if not any(x in title.upper() for x in ['BSQ', 'BARBER', 'OPTION']):
            print(f"  Ignoré (filtre) : {title}")
            continue

        location = item.get('location', '')
        date_str = item.get('start', {}).get('dateTime', item.get('start', {}).get('date', ''))
        date = date_str.split('T')[0] if 'T' in date_str else date_str

        coords = geocode(location)

        event = {
            "date": date,
            "title": title,
            "location": location,
            "coords": coords
        }

        # Préserver le manualStatus si la date existait déjà
        for old in existing_data:
            if old['date'] == event['date'] and old['title'] == event['title']:
                if 'manualStatus' in old:
                    event['manualStatus'] = old['manualStatus']
                break

        processed_events.append(event)
        print(f"  ✓ Ajouté : {title} ({date})")

    with open(JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(processed_events, f, indent=2, ensure_ascii=False)

    print(f"\nSync terminé. {len(processed_events)} événement(s) sauvegardé(s) dans {JSON_PATH}.")


if __name__ == "__main__":
    sync()
