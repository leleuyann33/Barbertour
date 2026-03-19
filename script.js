// Map initialization
const map = L.map('map', {
    center: [46.603354, 1.888334], // Center of France
    zoom: 6,
    zoomSnap: 0.5,
    zoomDelta: 0.5,
    wheelPxPerZoomLevel: 120,
    minZoom: 5,
    maxZoom: 12,
    zoomControl: false
    // maxBounds removed to stop map from "sliding away" or "snapping"
});

// Add zoom control to top right
L.control.zoom({
    position: 'topright'
}).addTo(map);

// Automated Aspiration: Data will be fetched live from Google Calendar
let tourDates = []; // Dynamic container
const CORS_PROXY = "https://corsproxy.io/?";
const markersLayer = L.layerGroup().addTo(map);


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
    "Paris": [48.8566, 2.3522]
};

// Primary Data Loader (Now automated via GitHub Actions)
async function updateCalendarData() {
    try {
        const res = await fetch('dates.json');
        if (res.ok) {
            const localEvents = await res.json();
            tourDates = localEvents;
            refreshMarkers(tourDates);
            renderChronologicalList(tourDates); // Phase 3: Update list
            console.log("Données de la tournée chargées avec succès.");
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
    const showOptions = document.getElementById('toggle-options')?.checked !== false;
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
    const location = event.location || event.venue;
    if (!location) return;

    if (event.coords) {
        placeMarker(event.coords, event);
        return;
    }

    for (const venueName in VENUE_COORDS) {
        if (location.includes(venueName)) {
            placeMarker(VENUE_COORDS[venueName], event);
            return;
        }
    }

    try {
        const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`;
        const response = await fetch(CORS_PROXY + encodeURIComponent(geocodeUrl), {
            headers: { 'User-Agent': 'BarbershopQuartetMap/1.0' }
        });
        const data = await response.json();
        if (data && data.length > 0) {
            placeMarker([parseFloat(data[0].lat), parseFloat(data[0].lon)], event);
        }
    } catch (error) {
        console.error('Geocoding blocked or failed for:', location);
    }
}

function placeMarker(coords, group) {
    if (!coords || coords[0] === 0 || isNaN(coords[0])) return; // Safety check
    
    const event = group;
    const rawDate = event.start?.dateTime || event.start?.date || event.date;

    const dateObj = new Date(rawDate);
    const isPast = dateObj < new Date();

    // Determine status: 1 = Confirmed, 2 = Option, 0 = Hidden
    let status = event.manualStatus;
    const originalTitle = event.summary || event.title || 'Date de tournée';
    if (status === undefined) {
        status = originalTitle.toUpperCase().includes('OPTION') ? 2 : 1;
    }

    // Display Title & Date Logic: Special handling for "Prévu" shows
    let displayTitle = originalTitle.replace(/Option/gi, '').replace(/À venir/gi, '').replace(/BSQ/gi, '').replace(/"GB"/gi, '').replace(/  +/g, ' ').trim();
    if (status === 2) {
        const year = dateObj.getFullYear();
        displayTitle = `C'est prévu pour ${year} : BSQ "GB" @ ${displayTitle.split('@')[1] || displayTitle}`;
    } else {
        displayTitle = `BSQ "GB" @ ${displayTitle.split('@')[1] || displayTitle}`;
    }

    const displayDate = group.dateRange ? group.dateRange : 
        ((status === 2) 
            ? `Année ${dateObj.getFullYear()}` 
            : (isNaN(dateObj) ? rawDate : dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })));


    // Dynamic Styling
    let className = status === 2 ? 'option-marker' : 'custom-marker';
    if (isPast || status === 3) {
        className += status === 2 ? ' past-option' : ' past-confirmed';
    } 


    const icon = L.divIcon({
        className: className,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
    });

    const marker = L.marker(coords, { icon: icon }).addTo(markersLayer);

    // Random fun messages
    const plannedMessages = ["On a hâte !", "Vivement !", "C'est pour bientôt !", "Préparez-vous !", "On arrive !"];
    const pastMessages = ["Un public de fou !", "C'était trop bien !", "Vivement qu'on revienne !", "Souvenir mémorable !", "Merci encore !"];
    
    let funMessage = "";
    if (status === 2) { // "C'est prévu" (Yellow/Option)
        funMessage = `<div style="color: var(--gold); font-style: italic; margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 5px;">"${plannedMessages[Math.floor(Math.random() * plannedMessages.length)]}"</div>`;
    } else if (isPast && status !== 0) { // "C'était fait" (Past Confirmed)
        funMessage = `<div style="color: #bbb; font-style: italic; margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 5px;">"${pastMessages[Math.floor(Math.random() * pastMessages.length)]}"</div>`;
    }

    const statusLine = (isPast || status === 3) ? "" : `<p><strong>Statut:</strong> ${status === 2 ? "C'est prévu" : "C'est confirmé !"}</p>`;

    const popupContent = `
        <div class="tour-popup">
            <h4>${displayTitle}</h4>
            <p><strong>Lieu:</strong> ${event.location || event.venue}</p>
            <p><strong>Date:</strong> ${displayDate}</p>
            ${statusLine}
            ${funMessage}
        </div>
    `;

    marker.bindPopup(popupContent);
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

secretTrigger.addEventListener('click', () => {
    const password = prompt("Entrez le mot de passe secret :");
    if (password === "BARBER2025") {
        openSecretModal();
    } else if (password !== null) {
        alert("Mot de passe incorrect !");
    }
});

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

        const row = document.createElement('div');
        row.className = 'show-item-row edit-mode';
        row.innerHTML = `
            <div class="show-edit-group">
                <input type="text" class="edit-title" value="${rawTitle}" onchange="updateEvent(${index}, 'title', this.value)" placeholder="Titre">
                <input type="date" class="edit-date" value="${new Date(date).toISOString().split('T')[0]}" onchange="updateEvent(${index}, 'date', this.value)">
                <input type="text" class="edit-location" value="${event.location || event.venue || ''}" onchange="updateEvent(${index}, 'location', this.value)" placeholder="Lieu">
            </div>
            <div class="show-actions">
                <span class="dot red ${status === 1 ? 'active' : ''}" title="Confirmé" onclick="toggleStatus(${index}, 1)"></span>
                <span class="dot yellow ${status === 2 ? 'active' : ''}" title="Prévu" onclick="toggleStatus(${index}, 2)"></span>
                <span class="dot gray ${status === 3 ? 'active' : ''}" title="Passé" onclick="toggleStatus(${index}, 3)"></span>
                <span class="dot empty ${status === 0 ? 'active' : ''}" title="Masqué" onclick="toggleStatus(${index}, 0)"></span>
                <button class="delete-btn" onclick="deleteEvent(${index})">🗑️</button>
            </div>
        `;
        showsContainer.appendChild(row);
    });

    // Add global buttons
    const footerActions = document.createElement('div');
    footerActions.className = 'modal-footer-actions';
    footerActions.innerHTML = `
        <button class="add-btn" onclick="addNewEvent()">➕ Ajouter une date</button>
        <button class="save-btn" onclick="saveAllAndRefresh()">💾 Appliquer les modifications</button>
    `;
    showsContainer.appendChild(footerActions);
}

window.updateEvent = function(index, field, value) {
    if (field === 'title') tourDates[index].title = value;
    if (field === 'date') tourDates[index].date = value;
    if (field === 'location') tourDates[index].location = value;
};

window.deleteEvent = function(index) {
    if (confirm("Supprimer cette date ?")) {
        tourDates.splice(index, 1);
        renderShowsList();
    }
};

window.addNewEvent = function() {
    tourDates.unshift({
        title: "NOUVELLE DATE",
        date: new Date().toISOString().split('T')[0],
        location: "Ville (Code Postal)",
        manualStatus: 1
    });
    renderShowsList();
};

window.saveAllAndRefresh = function() {
    refreshMarkers(tourDates);
    alert("Modifications appliquées sur la carte ! (N'oubliez pas de sauvegarder votre fichier dates.json manuellement si vous voulez qu'elles soient permanentes après rechargement)");
};

window.toggleStatus = function(index, newStatus) {
    tourDates[index].manualStatus = newStatus;
    renderShowsList();
    refreshMarkers(tourDates);
};

// --- PHASE 3: NEW FUNCTIONS ---

function renderChronologicalList(events) {
    const listContainer = document.getElementById('chronological-list');
    if (!listContainer) return;

    const showOptions = document.getElementById('toggle-options')?.checked !== false;
    
    // Filter and Sort
    const futureEvents = events.filter(e => {
        if (e.manualStatus === 0) return false;
        const d = new Date(e.start?.dateTime || e.start?.date || e.date);
        const status = e.manualStatus !== undefined ? e.manualStatus : (e.summary || e.title || "").toUpperCase().includes('OPTION') ? 2 : 1;
        if (!showOptions && status === 2) return false;
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

    // Group by Month
    const groups = {};
    futureEvents.forEach(e => {
        const d = new Date(e.start?.dateTime || e.start?.date || e.date);
        const monthKey = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).toUpperCase();
        if (!groups[monthKey]) groups[monthKey] = [];
        groups[monthKey].push(e);
    });

    let html = '';
    for (const month in groups) {
        html += `<div class="month-group"><h3 class="month-title">${month}</h3>`;
        html += groups[month].map(e => {
            const d = new Date(e.start?.dateTime || e.start?.date || e.date);
            const status = e.manualStatus !== undefined ? e.manualStatus : (e.summary || e.title || "").toUpperCase().includes('OPTION') ? 2 : 1;
            const statusLabel = status === 2 ? 'Option' : 'Confirmé';
            const displayTitle = (e.summary || e.title || "").replace(/Option/gi, '').replace(/BSQ/gi, '').replace(/"GB"/gi, '').trim();
            const coordsStr = e.coords ? `[${e.coords[0]}, ${e.coords[1]}]` : "null";

            return `
                <div class="date-item ${status === 2 ? 'option' : 'confirmed'}" onclick='centerOnShow(${coordsStr}, "${displayTitle.replace(/"/g, '&quot;')}")' style="cursor: pointer;">
                    <div class="item-date">${d.toLocaleDateString('fr-FR', { day: 'numeric' })}</div>
                    <div class="item-info">
                        <h3>${displayTitle}</h3>
                        <p>${e.location || e.venue}</p>
                    </div>
                    <div class="item-status ${status === 2 ? 'option' : 'confirmed'}">${statusLabel}</div>
                </div>
            `;
        }).join('');
        html += `</div>`;
    }

    listContainer.innerHTML = html;
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



// Controls Logic
document.getElementById('toggle-options')?.addEventListener('change', () => {
    refreshMarkers(tourDates);
    renderChronologicalList(tourDates);
});

// Radio Logic
const radio = document.getElementById('vintage-radio');
const radioPower = document.getElementById('radio-power');
const audio = document.getElementById('radio-audio');

radioPower?.addEventListener('click', () => {
    radio.classList.toggle('on');
    if (radio.classList.contains('on')) {
        audio.play().catch(() => console.log("Audio needs interaction or failed to load"));
    } else {
        audio.pause();
    }
});

// Media Modal (Razor 2) Logic
const mediaTrigger = document.getElementById('media-trigger');
const mediaModal = document.getElementById('media-modal');
const closeMediaModal = document.querySelector('.close-media-modal');
const mediaUpload = document.getElementById('media-upload');
const mediaPreview = document.getElementById('media-preview');

mediaTrigger?.addEventListener('click', () => {
    mediaModal.style.display = 'block';
});

closeMediaModal?.addEventListener('click', () => {
    mediaModal.style.display = 'none';
});

mediaUpload?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    mediaPreview.innerHTML = '';
    
    if (file.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = url;
        mediaPreview.appendChild(img);
    } else if (file.type.startsWith('video/')) {
        const vid = document.createElement('video');
        vid.src = url;
        vid.controls = true;
        mediaPreview.appendChild(vid);
    }
});

updateCalendarData();
setInterval(updateCalendarData, 86400000);

