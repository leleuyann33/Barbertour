// Map initialization
const map = L.map('map', {
    center: [46.603354, 1.888334], // Center of France
    zoom: 6,
    zoomSnap: 0.5,
    zoomDelta: 0.5,
    wheelPxPerZoomLevel: 200,  // 🔧 Molette plus douce (plus grand = plus lent)
    minZoom: 5.5,              // 🔧 Limite de dézoom (on reste sur la France)
    maxZoom: 10,               // 🔧 Limite de zoom (on ne peut plus rentrer "dans les immeubles")
    zoomControl: false
});

// Add zoom control to top right
L.control.zoom({
    position: 'topright'
}).addTo(map);

// 🔧 Isolation du scroll molette : empêche la molette de défiler la page quand on est sur la carte
document.getElementById('map').addEventListener('wheel', function(e) {
    e.stopPropagation();
}, { passive: false });

// Automated Aspiration: Data will be fetched live from Google Calendar
let tourDates = []; // Dynamic container
const CORS_PROXY = "https://corsproxy.io/?";
const markersLayer = L.layerGroup().addTo(map);
const FUTURE_MESSAGES = ["On a hâte !", "Ça va swinguer !", "Préparez vos oreilles !", "Une dose de bonne humeur !", "Vite, réservez !"];
const PAST_MESSAGES = ["Une soirée mémorable !", "Quel accueil !", "Encore des chansons dans la tête !", "Souvenirs de scène"];


// Venue Coordinates Cache (to bypass CORS blocks for known locations)
const VENUE_COORDS = {
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
    "Paris": [48.8566, 2.3522],
    // Villes courantes (pour les nouvelles dates saisies manuellement)
    "AVIGNON": [43.9493, 4.8055],
    "Avignon": [43.9493, 4.8055],
    "BORDEAUX": [44.8378, -0.5792],
    "Bordeaux": [44.8378, -0.5792],
    "LYON": [45.7640, 4.8357],
    "Lyon": [45.7640, 4.8357],
    "MARSEILLE": [43.2965, 5.3698],
    "TOULOUSE": [43.6047, 1.4442],
    "NANTES": [47.2184, -1.5536],
    "STRASBOURG": [48.5734, 7.7521],
    "MONTPELLIER": [43.6112, 3.8767],
    "RENNES": [48.1173, -1.6778],
    "LILLE": [50.6292, 3.0573],
    "NICE": [43.7102, 7.2620],
    "GRENOBLE": [45.1885, 5.7245]
};

// Primary Data Loader
async function updateCalendarData() {
    try {
        // 1. Charger depuis le fichier local
        const res = await fetch('dates.json');
        if (res.ok) {
            const localEvents = await res.json();

            // 2. Vérifier si un cache localStorage plus récent existe (modifs du Coffre)
            const cached = localStorage.getItem('tourDates_cache');
            if (cached) {
                try {
                    const cachedData = JSON.parse(cached);
                    tourDates = cachedData;
                    console.log("✅ Cache localStorage utilisé (modifications du Coffre conservées).");
                } catch(e) {
                    tourDates = localEvents;
                }
            } else {
                tourDates = localEvents;
                console.log("✅ Données chargées depuis dates.json.");
            }

            refreshMarkers(tourDates);
            renderChronologicalList(tourDates);
        }
    } catch (e) {
        console.error("Erreur lors du chargement des dates de tournée.", e);
    }
}





async function refreshMarkers(events) {
    if (!events || !events.length) {
        console.warn("Pas d'événements à afficher.");
        return;
    }
    console.log("Démarrage du rendu pour", events.length, "événements.");
    markersLayer.clearLayers();

    // Grouping by title and location for residencies (like Avignon)
    const showOptions = false; // Options hidden by default for visitors
    const groups = {};
    
    events.forEach(event => {
        if (event.manualStatus === 0) return;
        
        let loc = event.location || event.venue || "Inconnu";
        let title = event.summary || event.title || "Date";
        
        // Status determination
        let status = event.manualStatus;
        if (status === undefined) {
            status = title.toUpperCase().includes('OPTION') ? 2 : 1;
        }

        // Phase 3: Filter out options if toggle is OFF
        if (!showOptions && status === 2) return;

        // Clean title for consistent grouping key
        let cleanTitle = title.replace(/Option/gi, "").replace(/BSQ/gi, "").replace(/"GB"/gi, "").replace(/À VENIR/gi, "").replace(/  +/g, " ").trim().toUpperCase();
        let cleanLoc = loc.trim().toUpperCase();
        const key = cleanTitle + "|" + cleanLoc;
        
        if (!groups[key]) {
            groups[key] = { ...event, allDates: [], calcStatus: status };
        }
        const dStr = event.start?.dateTime || event.start?.date || event.date;
        if (dStr) {
            const d = new Date(dStr);
            if (!isNaN(d.getTime())) groups[key].allDates.push(d);
        }
    });


    const groupKeys = Object.keys(groups);
    for (const key of groupKeys) {
        try {
            const group = groups[key];
            if (group.allDates.length === 0) continue;

            group.allDates.sort((a, b) => a - b);
            
            if (group.allDates.length > 1) {
                const start = group.allDates[0];
                const end = group.allDates[group.allDates.length - 1];
                const opt = { day: 'numeric', month: 'long' };
                
                if (start.getFullYear() === end.getFullYear()) {
                    group.dateRange = `Du ${start.toLocaleDateString('fr-FR', opt)} au ${end.toLocaleDateString('fr-FR', { ...opt, year: 'numeric' })}`;
                } else {
                    group.dateRange = `Du ${start.toLocaleDateString('fr-FR', { ...opt, year: 'numeric' })} au ${end.toLocaleDateString('fr-FR', { ...opt, year: 'numeric' })}`;
                }
                group.date = start.toISOString();
            } else {
                group.date = group.allDates[0].toISOString();
            }

            if (!group.coords) {
                await addTourMarker(group);
            } else {
                placeMarker(group.coords, group);
            }
        } catch (e) {
            console.error("Erreur de rendu pour le groupe :", key, e);
        }
    }
}





async function addTourMarker(event) {
    const location = (event.location || event.venue || "").trim();
    if (!location) return;

    if (event.coords) {
        placeMarker(event.coords, event);
        return;
    }

    // 1️⃣ Chercher dans le dictionnaire de coordonnées connus
    for (const venueName in VENUE_COORDS) {
        if (location.toLowerCase().includes(venueName.toLowerCase())) {
            placeMarker(VENUE_COORDS[venueName], event);
            return;
        }
    }

    // 2️⃣ Chercher dans les dates existantes si une autre date du même lieu a déjà des coords
    const existingWithCoords = tourDates.find(d =>
        d !== event &&
        d.coords && Array.isArray(d.coords) &&
        (d.location || d.venue || "").trim().toLowerCase() === location.toLowerCase()
    );
    if (existingWithCoords) {
        console.log(`📍 Coordonnées réutilisées depuis une date existante pour : ${location}`);
        placeMarker(existingWithCoords.coords, event);
        return;
    }

    // 3️⃣ Géocodage réseau (Nominatim via CORS proxy)
    try {
        const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&countrycodes=fr&viewbox=-5.5,51.5,9.5,41.0&bounded=1&limit=1`;
        const response = await fetch(CORS_PROXY + encodeURIComponent(geocodeUrl), {
            headers: { 'User-Agent': 'BarbershopQuartetMap/1.0' }
        });
        const data = await response.json();
        if (data && data.length > 0) {
            placeMarker([parseFloat(data[0].lat), parseFloat(data[0].lon)], event);
        } else {
            console.warn(`⚠️ Géocodage sans résultat pour : "${location}". Ajoutez les coords manuellement si besoin.`);
        }
    } catch (error) {
        console.error('Géocodage échoué pour :', location, error);
    }
}

function placeMarker(coords, group) {
    if (!coords || coords[0] === 0 || isNaN(coords[0])) return; 
    
    const event = group;
    const rawDate = event.start?.dateTime || event.start?.date || event.date;
    const dateObj = new Date(rawDate);
    const isPast = dateObj < new Date();

    let status = event.manualStatus;
    const originalTitle = event.summary || event.title || 'Date de tournée';
    if (status === undefined) {
        status = originalTitle.toUpperCase().includes('OPTION') ? 2 : 1;
    }

    // Traduction intelligente du titre (BSQ, GB, etc.)
    function translateTitle(raw) {
        // 1. Garder uniquement la partie AVANT le "@" (le reste = lieu, déjà affiché)
        let t = raw.includes('@') ? raw.substring(0, raw.indexOf('@')).trim() : raw;
        // 2. Nettoyer les préfixes techniques
        t = t.replace(/"GB"/gi, 'Génération Barber')   // "GB" → Génération Barber
             .replace(/\bGB\b/gi, 'Génération Barber') // GB seul → idem
             .replace(/Option\s*\d*/gi, '')             // Option, Option 1, Option 2...
             .replace(/Options?\s*\d*/gi, '')           // Options
             .replace(/BSQ/gi, '')                      // BSQ
             .replace(/À venir/gi, '')
             .replace(/~/g, '')
             .replace(/"/g, '')                         // guillemets restants
             .replace(/\s+/g, ' ')                      // espaces multiples
             .trim();
        return t || 'Concert';
    }

    let displayTitle = translateTitle(originalTitle);
    if (status === 2) displayTitle = `C'est prévu : ${displayTitle}`;

    const displayDate = group.dateRange ? group.dateRange : 
        ((status === 2) ? `Année ${dateObj.getFullYear()}` : (isNaN(dateObj) ? rawDate : dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })));

    let className = status === 2 ? 'option-marker' : 'custom-marker';
    if (isPast || status === 3) className += status === 2 ? ' past-option' : ' past-confirmed';

    const icon = L.divIcon({ className: className, iconSize: [12, 12], iconAnchor: [6, 6] });

    // 📐 Micro-décalage déterministe pour éviter la superposition des marqueurs au même lieu
    const dateHash = new Date(rawDate).getTime();
    const jitter = 0.004; // ~400m
    const jitterLat = ((dateHash % 97) - 48) / 48 * jitter;
    const jitterLng = ((Math.floor(dateHash / 97) % 97) - 48) / 48 * jitter;
    const finalCoords = [coords[0] + jitterLat, coords[1] + jitterLng];

    const marker = L.marker(finalCoords, { icon: icon }).addTo(markersLayer);

    // Parsing depuis le TITLE qui contient toute l'info : "BSQ \"GB\" @ VILLE (DPT) - Salle"
    const rawTitleForParsing = event.title || event.summary || "";
    const atIndex = rawTitleForParsing.indexOf('@');

    let cityHeader, venueDetail;
    if (atIndex !== -1) {
        // Tout ce qui est après le "@"
        const afterAt = rawTitleForParsing.substring(atIndex + 1).trim();
        const venueParts = afterAt.split(' - ');
        cityHeader = venueParts[0].trim().toUpperCase(); // ex: "DAMMARIE-LES-LYS (77)"
        venueDetail = venueParts.length > 1 ? venueParts.slice(1).join(' - ').trim() : "Lieu à confirmer"; // ex: "Espace Nino Ferrer"
    } else {
        // Fallback : on lit location si pas de @ dans le titre
        const rawLoc = (event.location || event.venue || "");
        const venueParts = rawLoc.split(' - ');
        cityHeader = venueParts[0].trim().toUpperCase();
        venueDetail = venueParts.length > 1 ? venueParts.slice(1).join(' - ').trim() : "Lieu à confirmer";
    }

    // Message Fun intelligent (Selon date passée ou future)
    const msgList = isPast ? PAST_MESSAGES : FUTURE_MESSAGES;
    const activeMessage = event.customFunMessage || msgList[Math.floor(Math.random() * msgList.length)];
    const statusLine = (isPast || status === 3) ? `<p style="color: #666; font-style: italic; margin: 5px 0 0 0;">"${activeMessage}" (Archive)</p>` : `<p style="color: var(--gold); font-style: italic; margin: 5px 0 0 0;">"${activeMessage}"</p>`;

    const popupContent = `
        <div class="tour-popup">
            <h4 style="color: var(--gold); margin-bottom: 5px; font-family: 'Bebas Neue', cursive; font-size: 1.2rem;">📍 ${cityHeader}</h4>
            <div style="font-size: 0.9rem; margin-bottom: 8px;">
                <p style="margin: 0;"><strong>Lieu :</strong> ${venueDetail}</p>
                <p style="margin: 4px 0;">🎙️ <em>${displayTitle}</em></p>
                <p style="margin: 0;">📅 ${displayDate}</p>
            </div>
            <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 8px 0;">
            ${statusLine}
        </div>
    `;
    marker.bindPopup(popupContent);

    // Rétablissement des bulles au survol (v6.6)
    marker.on('mouseover', function (e) {
        this.openPopup();
    });
    marker.on('mouseout', function (e) {
        this.closePopup();
    });
}

// Interactivity
function highlightFeature(e) {
    const layer = e.target;
    layer.setStyle({
        weight: 3,
        color: '#E1B12C', 
        dashArray: '',
        fillOpacity: 0.6,
        fillColor: '#E1B12C'
    });
    layer.bringToFront();
    
    document.getElementById('info-text').innerHTML = `<strong>Région:</strong> ${layer.feature.properties.nom}`;
    showSidePanel();
}

function showSidePanel() {
    const panel = document.querySelector('.side-panel');
    if (panel.style.display === 'none') {
        panel.style.display = 'flex';
        panel.style.opacity = '0';
        setTimeout(() => {
            panel.style.transition = 'opacity 0.5s ease';
            panel.style.opacity = '1';
        }, 10);
    }
}

function resetHighlight(e) {
    geojson.resetStyle(e.target);
}

function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
    showSidePanel();
}

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
}

// GeoJSON
fetch('https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/regions-version-simplifiee.geojson')
    .then(response => response.json())
    .then(data => {
        geojson = L.geoJson(data, {
            style: { fillColor: '#E1B12C', weight: 1.5, opacity: 1, color: 'rgba(255, 255, 255, 0.2)', fillOpacity: 0.15 },
            onEachFeature: onEachFeature
        }).addTo(map);
    });

// --- SECRET RAZOR LOGIC ---
const secretTrigger = document.getElementById('secret-trigger');
const modal = document.getElementById('secret-modal');
const closeModal = document.querySelector('.close-modal');
const showsContainer = document.getElementById('shows-list-container');

// Admin Security
window.isAdmin = false;
window.checkAdmin = function(type) {
    if (window.isAdmin) return; // Already admin
    const password = prompt("Veuillez entrer le mot de passe administrateur :");
    if (password && password.trim().toUpperCase() === "BARBER2025") {
        window.isAdmin = true;
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = 'block';
        });
        alert("Mode Administrateur activé.");
    } else {
        alert("Mot de passe incorrect.");
    }
};

closeModal.addEventListener('click', () => modal.style.display = 'none');
window.addEventListener('click', (e) => { if (e.target == modal) modal.style.display = 'none'; });

function openSecretModal() {
    modal.style.display = 'block';
    renderShowsList();
}

function renderShowsList() {
    showsContainer.innerHTML = '';
    
    tourDates.forEach((event, index) => {
        const rawTitle = event.summary || event.title || "";
        const date = event.start?.dateTime || event.start?.date || event.date || "";
        let status = event.manualStatus;
        if (status === undefined) {
            status = rawTitle.toUpperCase().includes('OPTION') ? 2 : 1;
        }

        // Décomposer le titre pour pré-remplir les champs
        const atIdx = rawTitle.indexOf('@');
        let spectacle = '', villeRaw = '', salle = '';
        if (atIdx !== -1) {
            spectacle = rawTitle.substring(0, atIdx).replace(/BSQ/gi,'').replace(/Option\s*\d*/gi,'').replace(/"/g,'').trim();
            const afterAt = rawTitle.substring(atIdx + 1).trim();
            const parts = afterAt.split(' - ');
            villeRaw = parts[0].trim();
            salle = parts.slice(1).join(' - ').trim();
        } else {
            spectacle = rawTitle;
        }
        // Séparer ville et département
        const dptMatch = villeRaw.match(/^(.+?)\s*\((\d+[AB]?)\)$/);
        const ville = dptMatch ? dptMatch[1].trim() : villeRaw;
        const dpt   = dptMatch ? dptMatch[2] : '';

        const isPastEvent = new Date(date) < new Date();
        const msgList = isPastEvent ? PAST_MESSAGES : FUTURE_MESSAGES;
        const msgOptions = msgList.map(m => `<option value="${m}" ${event.customFunMessage === m ? 'selected' : ''}>${m}</option>`).join('');

        const row = document.createElement('div');
        row.className = 'show-item-row edit-mode';
        row.innerHTML = `
            <div class="show-edit-group" style="grid-template-columns:1fr 1fr;">
                <input type="text" value="${spectacle}" onchange="updateTitleField(${index}, 'spectacle', this.value)" placeholder="🎭 Spectacle (ex: Génération Barber)" title="Nom du spectacle">
                <input type="date"  value="${date ? new Date(date).toISOString().split('T')[0] : ''}" onchange="updateEvent(${index}, 'date', this.value)">
                <input type="text" value="${ville}" onchange="updateTitleField(${index}, 'ville', this.value)" placeholder="🏠 Ville (ex: AVIGNON)" title="Ville">
                <input type="text" value="${dpt}" onchange="updateTitleField(${index}, 'dpt', this.value)" placeholder="Dépt (ex: 84)" title="Numéro de département" style="max-width:80px;">
                <input type="text" value="${salle}" onchange="updateTitleField(${index}, 'salle', this.value)" placeholder="🏛️ Salle (ex: Théâtre du Chêne Noir)" title="Salle" style="grid-column:1/-1;">
                <select class="edit-message" style="width:100%; border-radius:5px; padding:5px; font-size:0.8rem; grid-column:1/-1;" onchange="updateEvent(${index}, 'customFunMessage', this.value)">
                    <option value="">🎯 Message aléatoire (défaut)</option>
                    ${msgOptions}
                </select>
            </div>
            <div class="show-actions">
                <span class="dot red ${status === 1 ? 'active' : ''}" title="Confirmé" onclick="toggleStatus(${index}, 1)"></span>
                <span class="dot yellow ${status === 2 ? 'active' : ''}" title="Prévu" onclick="toggleStatus(${index}, 2)"></span>
                <span class="dot gray ${status === 3 ? 'active' : ''}" title="Passé" onclick="toggleStatus(${index}, 3)"></span>
                <span class="dot empty ${status === 0 ? 'active' : ''}" title="Masqué" onclick="toggleStatus(${index}, 0)"></span>
                <button class="delete-btn" onclick="deleteEvent(${index})">🗑️</button>
            </div>
        `;
        // Stocker les champs décomposés (pour reconstruction du titre)
        row.dataset.spectacle = spectacle;
        row.dataset.ville = ville;
        row.dataset.dpt = dpt;
        row.dataset.salle = salle;
        row.dataset.index = index;
        showsContainer.appendChild(row);
    });

    // Add global buttons
    const footerActions = document.createElement('div');
    footerActions.className = 'modal-footer-actions';
    footerActions.innerHTML = `
        <button class="add-btn" onclick="addNewEvent()">➕ Ajouter une date</button>
        <button class="save-btn" onclick="saveAllAndRefresh()">💾 Appliquer (Carte)</button>
        <div style="margin-top:20px; padding:15px; background: rgba(0,0,0,0.3); border-radius:10px; border: 1px dashed var(--gold);">
            <p style="margin-top:0; font-size:0.9rem;">🚀 <strong>Persistence Collaborative (GitHub)</strong></p>
            <input type="password" id="gh-token" placeholder="Coller votre Token GitHub ici" style="width:100%; margin-bottom:10px; font-size:0.8rem;" value="${localStorage.getItem('gh_token') || ''}" onchange="localStorage.setItem('gh_token', this.value)">
            <div style="display:flex; gap:10px;">
                <button class="save-btn" style="background: #27ae60; color: white; flex:1;" onclick="publishToGithub()">🚀 Publier sur le site</button>
                <button class="save-btn" style="background: #888; flex:0.5;" onclick="exportJson()">📥 Export JSON</button>
            </div>
        </div>
    `;
    showsContainer.appendChild(footerActions);
}

window.updateEvent = function(index, field, value) {
    if (field === 'title') tourDates[index].title = value;
    if (field === 'date') { tourDates[index].date = value; if (tourDates[index].start) tourDates[index].start.date = value; }
    if (field === 'location') tourDates[index].location = value;
    if (field === 'customFunMessage') tourDates[index].customFunMessage = value;
};

// Reconstruit le titre format standard depuis les champs décomposés
window.updateTitleField = function(index, field, value) {
    const rows = showsContainer.querySelectorAll('.show-item-row');
    let row = null;
    rows.forEach(r => { if (parseInt(r.dataset.index) === index) row = r; });
    if (!row) return;
    if (field === 'spectacle') row.dataset.spectacle = value;
    if (field === 'ville')     row.dataset.ville = value;
    if (field === 'dpt')       row.dataset.dpt = value;
    if (field === 'salle')     row.dataset.salle = value;

    const s = row.dataset.spectacle || 'Concert';
    const v = row.dataset.ville || '';
    const d = row.dataset.dpt || '';
    const sa = row.dataset.salle || '';
    const dptStr = d ? ` (${d})` : '';
    const salleStr = sa ? ` - ${sa}` : '';
    const newTitle = `BSQ "${s}" @ ${v}${dptStr}${salleStr}`;
    tourDates[index].title = newTitle;
    tourDates[index].location = v;
};

window.deleteEvent = function(index) {
    if (confirm("Supprimer cette date ?")) {
        tourDates.splice(index, 1);
        renderShowsList();
    }
};

window.addNewEvent = function() {
    tourDates.unshift({
        title: 'BSQ "Génération Barber" @ VILLE (00) - Salle',
        date: new Date().toISOString().split('T')[0],
        location: 'VILLE',
        manualStatus: 1
    });
    renderShowsList();
};

window.saveAllAndRefresh = async function() {
    refreshMarkers(tourDates);
    renderChronologicalList(tourDates);

    // 💾 Sauvegarde dans localStorage (persistance au rechargement)
    localStorage.setItem('tourDates_cache', JSON.stringify(tourDates));

    // Auto-publication GitHub si token présent
    const token = localStorage.getItem('gh_token');
    if (token) {
        await publishToGithub();
        // Après succès GitHub, le cache local n'est plus nécessaire
        localStorage.removeItem('tourDates_cache');
    } else {
        alert("✅ Modifications appliquées et sauvegardées localement.\n\u26a0️ Entrez un Token GitHub dans le Coffre pour publier sur le site.");
    }
};

window.toggleStatus = function(index, newStatus) {
    tourDates[index].manualStatus = newStatus;
    renderShowsList();
    refreshMarkers(tourDates);
};

window.exportJson = function() {
    const dataStr = JSON.stringify(tourDates, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dates.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    alert("Fichier dates.json généré ! Remplacez le fichier existant par celui-ci pour sauvegarder vos modifications.");
};

// --- PHASE 3: NEW FUNCTIONS ---

// --- PHASE 4: PLAYLIST & FINAL LOGIC ---
// Web Radio Jazz (stream public) + morceaux personnalisés
const JAZZ_STREAM = "https://stream.srg-ssr.ch/m/rsj/mp3_128"; // Radio Swiss Jazz - 128kbps
const RADIO_PLAYLIST = []; // Morceaux uploadés manuellement par l'admin
let currentTrackIndex = 0;
let playingPersonalTrack = false;

// Radio Playlist Upload (admin uniquement)
const radioPlaylistUpload = document.createElement('input');
radioPlaylistUpload.type = 'file';
radioPlaylistUpload.accept = 'audio/*';
radioPlaylistUpload.multiple = true;
radioPlaylistUpload.style.display = 'none';
document.body.appendChild(radioPlaylistUpload);

window.openRadioPlaylistUpload = function() {
    radioPlaylistUpload.click();
};

radioPlaylistUpload.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
        const url = URL.createObjectURL(file);
        RADIO_PLAYLIST.push({ name: file.name, url });
    });
    alert(`${files.length} morceau(x) ajouté(s) à la playlist Barber !`);
    renderRadioPlaylist();
});

function renderRadioPlaylist() {
    let playlistPanel = document.getElementById('radio-playlist-panel');
    if (!playlistPanel) return;
    if (RADIO_PLAYLIST.length === 0) {
        playlistPanel.innerHTML = '<p style="color:#888;font-size:0.85rem;">Aucun morceau ajouté.</p>';
        return;
    }
    playlistPanel.innerHTML = RADIO_PLAYLIST.map((track, i) => `
        <div class="playlist-item ${currentTrackIndex === i && playingPersonalTrack ? 'playing' : ''}" onclick="playTrack(${i})">
            <span class="playlist-icon">${currentTrackIndex === i && playingPersonalTrack ? '▶' : '♪'}</span>
            <span class="playlist-name">${track.name}</span>
        </div>
    `).join('');
}

window.playTrack = function(index) {
    if (!audio) return;
    currentTrackIndex = index;
    playingPersonalTrack = true;
    audio.src = RADIO_PLAYLIST[index].url;
    audio.play();
    renderRadioPlaylist();
};

window.switchToJazzStream = function() {
    if (!audio) return;
    playingPersonalTrack = false;
    audio.src = JAZZ_STREAM;
    audio.play();
    renderRadioPlaylist();
};

function renderChronologicalList(events) {
    const listContainer = document.getElementById('chronological-list');
    if (!listContainer) return;

    const futureEvents = events.filter(e => {
        if (e.manualStatus === 0) return false;
        const d = new Date(e.start?.dateTime || e.start?.date || e.date);
        const status = e.manualStatus !== undefined ? e.manualStatus : (e.summary || e.title || "").toUpperCase().includes('OPTION') ? 2 : 1;
        if (status === 2) return false; // Confirmed ONLY for visitors
        return d >= new Date().setHours(0,0,0,0);
    }).sort((a, b) => {
        const da = new Date(a.start?.dateTime || a.start?.date || a.date);
        const db = new Date(b.start?.dateTime || b.start?.date || b.date);
        return da - db;
    });

    if (futureEvents.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; color: #888;">Aucune date à venir pour le moment.</p>';
        return;
    }

    const groups = {};
    const months = [];
    futureEvents.forEach(e => {
        const d = new Date(e.start?.dateTime || e.start?.date || e.date);
        const monthKey = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).toUpperCase();
        if (!groups[monthKey]) {
            groups[monthKey] = [];
            months.push(monthKey);
        }
        groups[monthKey].push(e);
    });

    const nav = document.getElementById('month-nav');
    if (nav) {
        nav.innerHTML = months.map(m => `<button class="month-nav-btn" onclick="scrollToMonth('${m}')">${m.split(' ')[0]}</button>`).join('');
    }

    let html = '';
    for (const month of months) {
        html += `<div class="month-group" id="month-${month.replace(/\s+/g, '-')}"><h3 class="month-title">${month}</h3>`;
        html += groups[month].map(e => {
            const d = new Date(e.start?.dateTime || e.start?.date || e.date);
            
            let rawTitle = e.summary || e.title || "";
            let afterAt = rawTitle;
            if (rawTitle.includes('@')) {
                afterAt = rawTitle.split('@')[1].trim();
            }
            
            let boldCity = afterAt;
            let thinDetail = e.location || e.venue || "";
            
            if (afterAt.includes(' - ')) {
                const parts = afterAt.split(' - ');
                boldCity = parts[0].trim();
                thinDetail = parts.slice(1).join(' - ').trim() + " - " + boldCity; // ex: "Essaïon Théâtre - Paris (75)"
            }
            
            const coordsStr = e.coords ? `[${e.coords[0]}, ${e.coords[1]}]` : "null";

            return `
                <div class="date-item" onclick='centerOnShow(${coordsStr}, "${boldCity.replace(/"/g, '&quot;')}")' style="cursor: pointer;">
                    <div class="item-date">${d.toLocaleDateString('fr-FR', { day: 'numeric' })}</div>
                    <div class="item-info">
                        <h3 style="font-weight: 800; font-size: 1.15rem;">${boldCity}</h3>
                        <p style="font-weight: 300; font-size: 0.85rem; margin-top: 2px;">${thinDetail}</p>
                    </div>
                </div>
            `;
        }).join('');
        html += `</div>`;
    }
    listContainer.innerHTML = html;
}

// Re-init Triggers (Solid logic for multiple sources)
function initTriggers() {
    const secretBtn = document.getElementById('secret-trigger');
    const mediaBtn = document.getElementById('media-trigger');
    const modal = document.getElementById('secret-modal');
    const mediaModal = document.getElementById('media-modal');
    
    secretBtn?.addEventListener('click', () => {
        const password = prompt("Entrez le mot de passe secret :");
        if (password && password.trim().toUpperCase() === "BARBER2025") {
            modal.style.display = 'block';
            renderShowsList();
        } else if (password !== null) {
            alert("❌ Mot de passe incorrect.");
        }
    });

    // Note: mediaBtn trigger is now handled by window.checkAdmin in HTML

    document.querySelectorAll('.close-modal, .close-media-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            modal.style.display = 'none';
            mediaModal.style.display = 'none';
        });
    });
}

// --- RADIO PLAYER LOGIC ---
const audio = document.getElementById('radio-audio');
const radioWrap = document.getElementById('radioWrap');
const radioPowerBtn = document.getElementById('radio-power-btn');
const radioHint = document.querySelector('.hint');
const volKnob = document.getElementById('vol-knob');
const volFaderInput = document.getElementById('vol-fader-input');
const volIndicator = document.getElementById('vol-indicator');
let isDraggingVol = false;

function setRadioOn(on, flicker) {
    if (!audio) return;
    if (on && flicker) {
        // Initial volume 5%
        if (audio.volume === 1) audio.volume = 0.05;
        // Sync fader UI
        const fader = document.getElementById('vol-fader-input');
        if (fader) fader.value = audio.volume;

        if (!playingPersonalTrack || !audio.src) {
            audio.src = JAZZ_STREAM;
        }
        radioWrap.classList.add('flickering');
        setTimeout(() => radioWrap.classList.add('on'), 200);
        if (radioHint) radioHint.style.opacity = '0';
        audio.play().catch(e => console.warn('Autoplay blocked:', e));
    } else if (on) {
        if (!playingPersonalTrack || !audio.src) {
            audio.src = JAZZ_STREAM;
        }
        radioWrap.classList.add('on');
        audio.play().catch(e => console.warn('Autoplay blocked:', e));
    } else {
        radioWrap.classList.remove('on', 'flickering');
        if (radioHint) radioHint.style.opacity = '0.7';
        audio.pause();
    }
}

// Entire Radio Body Clickable
radioWrap?.addEventListener('click', (e) => {
    // Stop if clicking controls (specific knobs or buttons)
    if (e.target.closest('#vol-knob, #tuning-knob, #radio-power-btn, input, button, a')) return;
    const isOn = radioWrap.classList.contains('on');
    setRadioOn(!isOn, true);
});

radioPowerBtn?.addEventListener('click', (e) => {
    e.stopPropagation(); 
    const isOn = radioWrap.classList.contains('on');
    setRadioOn(!isOn, true);
});

// Make the text label trigger the radio as well for maximum touchability on mobile
document.getElementById('radio-label-node')?.addEventListener('click', () => {
    const isOn = radioWrap?.classList.contains('on');
    setRadioOn(!isOn, true);
});

// Volume Fader & Knob Sync
volFaderInput?.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    audio.volume = val;
    // Rotate needle
    const angle = (val - 0.5) * 180;
    volIndicator?.setAttribute('transform', `rotate(${angle}, 200, 148)`);
});

volKnob?.addEventListener('mousedown', () => isDraggingVol = true);
window.addEventListener('mouseup', () => isDraggingVol = false);
window.addEventListener('mousemove', (e) => {
    if (!isDraggingVol || !audio) return;
    const currentVolume = Math.min(1, Math.max(0, audio.volume - e.movementY * 0.01));
    audio.volume = currentVolume;
    if (volFaderInput) volFaderInput.value = currentVolume;
    // Rotate needle
    const angle = (currentVolume - 0.5) * 180;
    volIndicator?.setAttribute('transform', `rotate(${angle}, 200, 148)`);
});

// Media Upload -> Gallery Frame
const mediaUpload = document.getElementById('media-upload');
const mediaFrame = document.getElementById('media-frame');

mediaUpload?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file || !mediaFrame) return;

    const url = URL.createObjectURL(file);
    mediaFrame.innerHTML = '';
    
    if (file.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = url;
        mediaFrame.appendChild(img);
    } else if (file.type.startsWith('video/')) {
        const vid = document.createElement('video');
        vid.src = url;
        vid.controls = true;
        mediaFrame.appendChild(vid);
    }
});

// Main Init
// Direct Media Upload (Side Panel)
const directMediaUpload = document.getElementById('direct-media-upload');
directMediaUpload?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file || !mediaFrame) return;

    const url = URL.createObjectURL(file);
    mediaFrame.innerHTML = '';
    
    if (file.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = url;
        mediaFrame.appendChild(img);
    } else if (file.type.startsWith('video/')) {
        const vid = document.createElement('video');
        vid.src = url;
        vid.controls = true;
        vid.autoplay = true;
        mediaFrame.appendChild(vid);
    }
    
    // Add back the upload button (admin only)
    const controls = document.createElement('div');
    controls.className = 'media-controls admin-only';
    controls.style.display = window.isAdmin ? 'block' : 'none';
    controls.innerHTML = `<button class="upload-btn" onclick="document.getElementById('direct-media-upload').click()">➕ Changer le média</button>`;
    mediaFrame.appendChild(controls);
});

async function initApp() {
    await updateCalendarData();
    initTriggers();
    initMonthsGrid();
    if (audio) {
        audio.volume = 0.05; // Initial volume 5%
        if (volFaderInput) volFaderInput.value = 0.05;
        // Needle pos
        const angle = (0.05 - 0.5) * 180;
        volIndicator?.setAttribute('transform', `rotate(${angle}, 200, 148)`);
    }
}

function initMonthsGrid() {
    const years = [2026, 2027];
    const monthsNames = ["JANVIER", "FÉVRIER", "MARS", "AVRIL", "MAI", "JUIN", "JUILLET", "AOÛT", "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DÉCEMBRE"];
    const shortNames = ["JANV", "FÉVR", "MARS", "AVR", "MAI", "JUIN", "JUIL", "AOÛT", "SEPT", "OCT", "NOV", "DÉC"];
    
    years.forEach(year => {
        const container = document.getElementById(`months-${year}`);
        if (!container) return;
        container.innerHTML = monthsNames.map((name, i) => {
            const hasEvents = tourDates.some(e => {
                const d = new Date(e.start?.dateTime || e.start?.date || e.date);
                return d.getFullYear() === year && d.getMonth() === i && e.manualStatus !== 0;
            });
            return `<button class="month-btn ${hasEvents ? 'has-events' : ''}" onclick="scrollToMonth('${name} ${year}')">${shortNames[i]}</button>`;
        }).join('');
    });
}

window.centerOnShow = function(coords, title) {
    if (!coords) {
        alert("Coordonnées non trouvées pour ce lieu.");
        return;
    }
    map.setView(coords, 10, { animate: true });
    // Scroll back to map
    document.getElementById('theater-frame').scrollIntoView({ behavior: 'smooth' });
};

window.scrollToMonth = function(month) {
    const id = `month-${month.replace(/\s+/g, '-')}`;
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
};

initApp();

setInterval(updateCalendarData, 86400000);

// --- PROGRESS-LINKED PARALLAX EFFECT ---
function initParallax() {
    let ticking = false;
    function updateParallax() {
        const scrollY = window.scrollY;
        const scrollMax = document.documentElement.scrollHeight - window.innerHeight;
        if (scrollMax <= 0) { ticking = false; return; }
        // Syncs background position (0-98%) with scroll progress
        // Capping at 98% to hide the bottom edge "artifact" as requested
        const scrollPercent = (scrollY / scrollMax) * 98;
        document.documentElement.style.setProperty('--bg-pos-y', `${scrollPercent}%`);
        ticking = false;
    }
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(updateParallax);
            ticking = true;
        }
    });
    window.addEventListener('resize', () => {
        if (!ticking) {
            window.requestAnimationFrame(updateParallax);
            ticking = true;
        }
    });
    updateParallax(); 
}
initParallax();

// --- COLLABORATIVE PERSISTENCE (GITHUB API) ---
window.publishToGithub = async function() {
    const token = localStorage.getItem('gh_token');
    if (!token) {
        alert("Veuillez entrer votre Token GitHub pour publier.");
        return;
    }

    const repo = "leleuyann33/Barbertour";
    const path = "dates.json";
    const url = `https://api.github.com/repos/${repo}/contents/${path}`;

    try {
        const getResp = await fetch(url, {
            headers: { 'Authorization': `token ${token}` }
        });
        
        if (!getResp.ok) throw new Error("Impossible de récupérer l'état actuel sur GitHub (Vérifiez votre token).");
        const fileData = await getResp.json();
        const sha = fileData.sha;

        // Base64 encoding properly for UTF-8
        const jsonString = JSON.stringify(tourDates, null, 2);
        const encoder = new TextEncoder();
        const data = encoder.encode(jsonString);
        let binary = "";
        for (let i = 0; i < data.byteLength; i++) {
            binary += String.fromCharCode(data[i]);
        }
        const content = btoa(binary);

        const putResp = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: "Mise à jour des dates (via Interface Admin)",
                content: content,
                sha: sha
            })
        });

        if (putResp.ok) {
            alert("🚀 Succès ! Les modifications sont sur GitHub. Le site sera à jour dans 1 à 2 minutes.");
        } else {
            const err = await putResp.json();
            throw new Error(err.message || "Erreur lors de l'envoi.");
        }
    } catch (error) {
        console.error("GitHub API Error:", error);
        alert("❌ Échec : " + error.message);
    }
};

// --- RELOCALISATION RADIO MOBILE ---
function handleMobileRadio() {
    const radioCol = document.getElementById('radio-column');
    const theater = document.getElementById('theater-frame');
    const listSec = document.getElementById('list-section');
    if (!radioCol || !theater || !listSec) return;
    
    if (window.innerWidth <= 768) {
        if (radioCol.parentElement !== theater) {
            theater.appendChild(radioCol);
        }
    } else {
        if (radioCol.parentElement !== listSec) {
            listSec.insertBefore(radioCol, document.getElementById('dates-column'));
        }
    }
}
window.addEventListener('resize', handleMobileRadio);
document.addEventListener('DOMContentLoaded', handleMobileRadio);
handleMobileRadio();

// ============================================================
// 🎬 GARDIEN DE VISIBILITÉ VIDÉO (Auto-Stop sur Scroll)
// v6.5 - v6.6
// ============================================================
window.addEventListener('scroll', () => {
    // Ciblage des vidéos (Desktop et Mobile)
    const videos = document.querySelectorAll('video');
    
    videos.forEach(video => {
        const rect = video.getBoundingClientRect();
        // Vérifie si la vidéo est encore au moins partiellement visible
        const isVisible = (rect.bottom >= 0 && rect.top <= window.innerHeight);
        
        // Si la vidéo est lancée mais n'est plus visible -> STOP
        if (!isVisible && !video.paused) {
            video.pause();
            video.currentTime = 0; // Remet à zéro
            video.load(); // FORCE le rechargement pour afficher le poster.jpg
            console.log('🎬 Vidéo arrêtée et Poster rétabli (hors champ)');
        }
    });
}, { passive: true });
