// Map initialization
const map = L.map('map', {
    center: [46.603354, 1.888334], // Center of France
    zoom: 6,
    zoomSnap: 0.5,
    zoomDelta: 0.5,
    wheelPxPerZoomLevel: 120,
    minZoom: 5,
    maxZoom: 13,
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
        const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&countrycodes=fr&viewbox=-5.5,51.5,9.5,41.0&bounded=1&limit=1`;
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
    if (!coords || coords[0] === 0 || isNaN(coords[0])) return; // Admin Security
    
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

    // STRICT RULE: Never show anything before the @
    let displayTitle = originalTitle;
    if (displayTitle.includes('@')) {
        displayTitle = displayTitle.split('@')[1].trim();
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

    const statusLine = (isPast || status === 3) ? "" : `<p><strong>Statut:</strong> ${status === 2 ? "C'est prévu" : "Vite, réservez !"}</p>`;

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
    
    marker.on('mouseover', function() {
        this.openPopup();
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
    if (password === "BARBER2025") {
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
        <button class="save-btn" onclick="saveAllAndRefresh()">💾 Appliquer (Carte)</button>
        <button class="save-btn" style="background: #27ae60; color: white;" onclick="exportJson()">📥 Télécharger dates.json</button>
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
        if (password === "BARBER2025") {
            modal.style.display = 'block';
            renderShowsList();
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
