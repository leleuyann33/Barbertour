import json
import os
from datetime import datetime

JSON_PATH = 'dates.json'
SIM_PATH = 'dates_simulation.json'

def simulate_merge():
    print(f"--- Simulation de Synchronisation Sécurisée ---")
    
    # 1. Charger les données REELLES (les 87 dates restaurées)
    if not os.path.exists(JSON_PATH):
        print("Erreur : dates.json introuvable.")
        return
        
    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        existing_data = json.load(f)
    
    initial_count = len(existing_data)
    print(f"✓ {initial_count} dates réelles chargées.")

    # 2. Créer un index pour la fusion
    def get_key(ev): return f"{ev['date']}_{ev['title'].strip().upper()}"
    existing_map = {get_key(ev): ev for ev in existing_data}

    # 3. SIMULER les événements du calendrier (Mock de l'API)
    # Imaginons que le calendrier contient ces 3 événements :
    mock_calendar_events = [
        {
            "summary": "BSQ \"GB\" @ DUNKERQUE (59)",
            "location": "Dunkerque (59)",
            "start": {"date": "2026-03-22"} # L'ancienne date
        },
        {
            "summary": "BSQ \"GB\" @ DUNKERQUE (59)",
            "location": "Dunkerque (59)",
            "start": {"date": "2026-05-15"} # La nouvelle date déplacée
        },
        {
            "summary": "UN AUTRE EVENEMENT PRIVE",
            "location": "Paris",
            "start": {"date": "2026-04-01"}
        }
    ]
    print(f"✓ Simulation de 3 événements reçus du calendrier.")

    # 4. Appliquer la logique de FUSION (identique à sync_calendar.py)
    new_count = 0
    ignored_count = 0
    
    for item in mock_calendar_events:
        title = item.get('summary', '').strip()
        
        # Filtre de sécurité
        if not any(x in title.upper() for x in ['BSQ', 'BARBER', 'OPTION']):
            ignored_count += 1
            print(f"  - Ignoré (filtre) : {title}")
            continue

        date = item.get('start', {}).get('date', '')
        event_key = f"{date}_{title.upper()}"
        
        if event_key in existing_map:
            print(f"  ↻ Date déjà présente (ignorée) : {title} ({date})")
        else:
            # AJOUT sans suppression
            new_ev = {
                "date": date,
                "title": title,
                "location": item.get('location', ''),
                "coords": [51.0343, 2.3767] if "DUNKERQUE" in title.upper() else None
            }
            existing_data.append(new_ev)
            existing_map[event_key] = new_ev
            new_count += 1
            print(f"  + NOUVEAUTÉ AJOUTÉE : {title} ({date})")

    # 5. Résultat
    existing_data.sort(key=lambda x: x['date'])
    with open(SIM_PATH, 'w', encoding='utf-8') as f:
        json.dump(existing_data, f, indent=2, ensure_ascii=False)
        
    final_count = len(existing_data)
    print(f"\n--- RÉSULTAT DE LA SIMULATION ---")
    print(f"Dates initiales : {initial_count}")
    print(f"Dates ajoutées  : {new_count}")
    print(f"Dates ignorées  : {ignored_count}")
    print(f"Dates finales    : {final_count}")
    print(f"Vérification : Dunkerque est présente ? {'OUI' if any('DUNKERQUE' in ev['title'].upper() for ev in existing_data) else 'NON'}")
    print(f"Sécurité : Est-ce que des dates ont été supprimées ? {'NON' if final_count >= initial_count else 'OUI (ERREUR)'}")
    print(f"Fichier de simulation créé : {SIM_PATH}")

if __name__ == "__main__":
    simulate_merge()
