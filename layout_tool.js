// MASTER Layout Tool : Actif UNIQUEMENT sur ordinateur
if (window.innerWidth > 768) {
    document.addEventListener('DOMContentLoaded', () => {
        // Liste de tous les éléments que le client veut pouvoir déplacer
        const idsToDrag = [
            'radio-anchor', 
            'radio-label-node', 
            'section-title-main', 
            'chronological-list', 
            'full-months-grid'
        ];
        
        const elements = {};
        
        idsToDrag.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                elements[id] = el;
                // On met "relative" pour les désolidariser de leur conteneur Flexbox parent au niveau visuel
                el.style.setProperty('position', 'relative', 'important');
                el.style.setProperty('z-index', '9999', 'important');
            }
        });

        // Interface UI minimaliste
        const panel = document.createElement('div');
        panel.innerHTML = `
            <div style="position: fixed; top: 15px; right: 15px; background: rgba(0,0,0,0.9); border: 2px solid #E1B12C; padding: 15px; color: white; z-index: 10000; border-radius: 8px; width: 340px; box-shadow: 0 0 30px rgba(0,0,0,1);">
                <h4 style="margin: 0 0 10px 0; color: #E1B12C; font-family: 'Sancreek', cursive;">🛠 Master Layout Tool (PC)</h4>
                <p style="font-size: 11px; margin-bottom: 10px;"><b>Clique et maintiens</b> n'importe quel élément massif (Titre, Grille de mois, Liste des affiches, Radio...) pour le tirer comme un aimant.</p>
                <textarea id="layout-code" style="width: 100%; height: 260px; background: #222; color: #40E0D0; font-size: 11px; padding: 10px; font-family: monospace; border: none; border-radius: 5px;" readonly onclick="this.select()"></textarea>
            </div>
        `;
        document.body.appendChild(panel);

        const codeArea = document.getElementById('layout-code');
        const state = {};
        
        for (let id in elements) {
            state[id] = { x: 0, y: 0 };
        }

        function updateCode() {
            let css = `/* DECALAGES MANUELS GOLBAUX - PC UNIQUEMENT */\n@media (min-width: 769px) {\n`;
            let hasMoves = false;
            
            for (let id in elements) {
                const el = elements[id];
                el.style.setProperty('left', state[id].x + 'px', 'important');
                el.style.setProperty('top', state[id].y + 'px', 'important');
                
                // On ne génère du CSS dans la boîte que pour les éléments qu'il aura effectivement déplacés
                if (state[id].x !== 0 || state[id].y !== 0) {
                    hasMoves = true;
                    css += `    #${id} {\n        position: relative !important;\n        left: ${state[id].x}px !important;\n        top: ${state[id].y}px !important;\n    }\n`;
                }
            }
            css += `}`;
            
            if (hasMoves) {
                codeArea.value = css;
            } else {
                codeArea.value = "Fais glisser un élément pour voir le CSS s'afficher ici...";
            }
        }

        function drag(id, el) {
            let isDragging = false, startX, startY, originX, originY;
            el.style.cursor = 'grab';
            
            el.addEventListener('mousedown', (e) => {
                // On empêche le drag sur les petits boutons à l'intérieur pour éviter des bugs de clic
                if(e.target.tagName === 'BUTTON' || e.target.tagName === 'A') return;
                
                isDragging = true;
                el.style.cursor = 'grabbing';
                startX = e.clientX;
                startY = e.clientY;
                originX = state[id].x;
                originY = state[id].y;
                // Empêche le comportement normal (sélection de texte)
                e.preventDefault();
                e.stopPropagation(); 
            });

            window.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                state[id].x = Math.round(originX + (e.clientX - startX));
                state[id].y = Math.round(originY + (e.clientY - startY));
                updateCode();
            });

            window.addEventListener('mouseup', () => {
                if(isDragging) {
                    isDragging = false;
                    el.style.cursor = 'grab';
                }
            });
            
            // Sécurité si on sort brutalement de l'écran
            window.addEventListener('mouseleave', () => {
                 isDragging = false;
                 el.style.cursor = 'grab';
            });
        }

        for (let id in elements) {
            drag(id, elements[id]);
        }
        updateCode();
    });
}
