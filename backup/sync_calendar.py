import requests
import json
import os
import time

# Configuration
CALENDAR_ID = 'compagniebarbershopquartet@gmail.com'
API_KEY = 'AIzaSyDOtGM5jr8bNp1utVpG2_gSRH03RNGBkI8'
JSON_PATH = 'dates.json'

# Known Coordinates Cache
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
    "Paris": [48.8566, 2.3522]
}

def geocode(location):
    if not location: return None
    
    # Check cache first
    for venue, coords in VENUE_COORDS.items():
        if venue.lower() in location.lower():
            return coords
            
    # API Fallback (Nominatim) - use carefully in automated scripts
    try:
        url = f"https://nominatim.openstreetmap.org/search?format=json&q={location}&limit=1"
        resp = requests.get(url, headers={'User-Agent': 'BarberSyncBot/1.0'})
        data = resp.json()
        if data:
            return [float(data[0]['lat']), float(data[0]['lon'])]
    except:
        pass
    return None

def sync():
    print("Fetching calendar...")
    url = f"https://www.googleapis.com/calendar/v3/calendars/{CALENDAR_ID}/events?key={API_KEY}&singleEvents=true&orderBy=startTime&timeMin=2025-01-01T00:00:00Z&maxResults=500"
    
    resp = requests.get(url)
    if resp.status_code != 200:
        print(f"Error fetching: {resp.status_code}")
        return

    items = resp.json().get('items', [])
    processed_events = []
    
    # Load existing to preserve manualStatus if possible (advanced)
    existing_data = []
    if os.path.exists(JSON_PATH):
        with open(JSON_PATH, 'r', encoding='utf-8') as f:
            existing_data = json.load(f)

    for item in items:
        title = item.get('summary', 'Date de tournée')
        if not any(x in title.upper() for x in ['BSQ', 'BARBER', 'OPTION']):
            continue
            
        location = item.get('location', '')
        date = item.get('start', {}).get('dateTime', item.get('start', {}).get('date', ''))
        
        # Geocoding
        coords = geocode(location)
        
        event = {
            "date": date.split('T')[0] if 'T' in date else date,
            "title": title,
            "location": location,
            "coords": coords
        }
        
        # Preserve manualStatus if this date/title exists in existing_data
        for old in existing_data:
            if old['date'] == event['date'] and old['title'] == event['title']:
                if 'manualStatus' in old:
                    event['manualStatus'] = old['manualStatus']
                break
                
        processed_events.append(event)

    with open(JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(processed_events, f, indent=2, ensure_ascii=False)
    
    print(f"Sync complete. {len(processed_events)} events saved.")

if __name__ == "__main__":
    sync()
