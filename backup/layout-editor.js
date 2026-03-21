// Dynamic Layout Editor with Sovereign Elements & Magnetic Snapping
(function() {
    const editables = [
        { id: 'section-title-main', name: 'Titre Dates' },
        { id: 'radio-anchor', name: 'Boîtier Radio' },
        { id: 'radio-label-node', name: 'Label Radio' },
        { id: 'full-months-grid', name: 'Grille des Mois' }
    ];

    let activeElement = null;
    let isDragging = false;
    let startX, startY;
    let initialLeft, initialTop;

    // Magnetic Snapping Logic
    const SNAP_THRESHOLD = 20; // Pixels
    const guideH = createGuide('h');
    const guideV = createGuide('v');

    function createGuide(type) {
        const g = document.createElement('div');
        g.style.position = 'fixed';
        g.style.backgroundColor = '#40E0D0'; // Turquoise axis
        g.style.zIndex = '9999';
        g.style.display = 'none';
        g.style.pointerEvents = 'none';
        if (type === 'h') {
            g.style.left = '0'; g.style.width = '100%'; g.style.height = '1px';
        } else {
            g.style.top = '0'; g.style.height = '100%'; g.style.width = '1px';
        }
        document.body.appendChild(g);
        return g;
    }

    function checkSnapping(element, newX, newY) {
        const rect = element.getBoundingClientRect();
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        let snappedX = newX;
        let snappedY = newY;
        let showV = false;
        let showH = false;

        // Vertical Center Snap
        if (Math.abs((newX + rect.width/2) - centerX) < SNAP_THRESHOLD) {
            snappedX = centerX - rect.width/2;
            guideV.style.left = centerX + 'px';
            showV = true;
        }

        // Horizontal Center Snap
        if (Math.abs((newY + rect.height/2) - centerY) < SNAP_THRESHOLD) {
            snappedY = centerY - rect.height/2;
            guideH.style.top = centerY + 'px';
            showH = true;
        }

        guideV.style.display = showV ? 'block' : 'none';
        guideH.style.display = showH ? 'block' : 'none';

        return { x: snappedX, y: snappedY };
    }

    function init() {
        // Style standard for layout elements
        const style = document.createElement('style');
        style.textContent = `
            .layout-editable {
                cursor: grab !important;
                position: relative !important;
                transition: outline 0.2s;
            }
            .layout-editable:hover {
                outline: 2px dashed #40E0D0;
            }
            .layout-editable.dragging {
                cursor: grabbing !important;
                z-index: 10000 !important;
                outline: 2px solid #E1B12C !important;
                box-shadow: 0 0 20px rgba(225, 177, 44, 0.4);
            }
        `;
        document.head.appendChild(style);

        editables.forEach(conf => {
            const el = document.getElementById(conf.id);
            if (!el) return;

            el.classList.add('layout-editable');
            el.setAttribute('title', `Déplacer : ${conf.name}`);
            
            // Load saved position
            const saved = localStorage.getItem(`pos_${conf.id}`);
            if (saved) {
                const { left, top } = JSON.parse(saved);
                el.style.left = left;
                el.style.top = top;
            }

            el.addEventListener('mousedown', startDrag);
        });
    }

    function startDrag(e) {
        // Prevent drag when clicking controls or nested interactives
        if (e.target.closest('button, input, a, .leaflet-container')) return;
        
        activeElement = e.currentTarget;
        isDragging = true;
        
        const rect = activeElement.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        
        // Get current style position or computed if not set
        const style = window.getComputedStyle(activeElement);
        initialLeft = parseInt(style.left) || 0;
        initialTop = parseInt(style.top) || 0;

        activeElement.classList.add('dragging');
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);
    }

    function drag(e) {
        if (!isDragging || !activeElement) return;

        let deltaX = e.clientX - startX;
        let deltaY = e.clientY - startY;

        let newX = initialLeft + deltaX;
        let newY = initialTop + deltaY;

        // Apply Snapping
        const snapped = checkSnapping(activeElement, newX, newY);

        activeElement.style.left = snapped.x + 'px';
        activeElement.style.top = snapped.y + 'px';
    }

    function stopDrag() {
        if (!activeElement) return;
        
        isDragging = false;
        activeElement.classList.remove('dragging');
        
        // Save position
        localStorage.setItem(`pos_${activeElement.id}`, JSON.stringify({
            left: activeElement.style.left,
            top: activeElement.style.top
        }));

        guideV.style.display = 'none';
        guideH.style.display = 'none';

        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', stopDrag);
        activeElement = null;
    }

    // Helper for debugging/reset
    window.resetLayout = function() {
        editables.forEach(conf => {
            localStorage.removeItem(`pos_${conf.id}`);
            const el = document.getElementById(conf.id);
            if (el) {
                el.style.left = '';
                el.style.top = '';
            }
        });
        location.reload();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
