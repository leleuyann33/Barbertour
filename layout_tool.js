// Custom Radio Layout Tool - Interactive positioning and sizing
document.addEventListener('DOMContentLoaded', () => {
    const radioAnchor = document.getElementById('radio-anchor');
    const radioLabel = document.getElementById('radio-label-node');
    const svgRadio = document.querySelector('svg.radio');
    
    if (!radioAnchor || !radioLabel || !svgRadio) return;
    
    // Inject UI Tool Panel
    const ui = document.createElement('div');
    ui.innerHTML = `
        <div style="position: fixed; top: 10px; right: 10px; z-index: 100000; background: rgba(0,0,0,0.85); border: 2px solid #E1B12C; padding: 15px; color: #fff; width: 330px; border-radius: 10px; font-family: 'Montserrat', sans-serif; box-shadow: 0 0 20px rgba(0,0,0,0.8);">
            <h4 style="margin:0 0 10px 0; color: #E1B12C; font-family: 'Sancreek', cursive; font-size: 18px;">🛠 Outil Layout Radio</h4>
            <p style="font-size:12px; margin-bottom:10px; color:#ccc;">Maintiens le clic sur la Radio ou sur son Label pour les déplacer librement sur la page. Ajuste leur taille ici :</p>
            <label style="font-size:12px; font-weight:bold; display:block; margin-bottom:5px;">Taille de la Radio : <span id="r-scale-val">0.6</span><br><input type="range" id="radio-scale-slider" min="0.1" max="1.5" step="0.01" value="0.6" style="width:100%"></label>
            <label style="font-size:12px; font-weight:bold; display:block; margin-bottom:10px;">Taille du Label : <span id="l-scale-val">1.0</span><br><input type="range" id="label-scale-slider" min="0.5" max="2" step="0.05" value="1" style="width:100%"></label>
            <p style="font-size:12px; margin: 5px 0; color:#E1B12C;">Code généré (à copier dans style.css) :</p>
            <textarea id="layout-output" style="width:100%; height:160px; background:#111; color:#40E0D0; font-family: monospace; font-size:11px; border: 1px solid #555; padding:5px;" readonly></textarea>
        </div>
    `;
    document.body.appendChild(ui);
    
    const radioScaleSlider = document.getElementById('radio-scale-slider');
    const labelScaleSlider = document.getElementById('label-scale-slider');
    const rScaleVal = document.getElementById('r-scale-val');
    const lScaleVal = document.getElementById('l-scale-val');
    const txtOutput = document.getElementById('layout-output');
    
    let state = {
        radio: { left: parseFloat(getComputedStyle(radioAnchor).left) || 0, top: parseFloat(getComputedStyle(radioAnchor).top) || 0, scale: 0.6 },
        label: { left: parseFloat(getComputedStyle(radioLabel).left) || 0, top: parseFloat(getComputedStyle(radioLabel).top) || 0, scale: 1 }
    };
    
    function updateCode() {
        svgRadio.style.transform = `scale(${state.radio.scale})`;
        radioLabel.style.transform = `scale(${state.label.scale})`;
        
        radioAnchor.style.setProperty('left', `${state.radio.left}px`, 'important');
        radioAnchor.style.setProperty('top', `${state.radio.top}px`, 'important');
        
        radioLabel.style.setProperty('left', `${state.label.left}px`, 'important');
        radioLabel.style.setProperty('top', `${state.label.top}px`, 'important');
        
        rScaleVal.innerText = state.radio.scale;
        lScaleVal.innerText = state.label.scale;
        
        txtOutput.value = `/* Copiez ce bloc à la toute fin de style.css ! */

#radio-anchor {
    position: relative !important;
    left: ${state.radio.left}px !important;
    top: ${state.radio.top}px !important;
    z-index: 11;
}

svg.radio {
    transform: scale(${state.radio.scale}) !important;
}

#radio-label-node {
    position: relative !important;
    left: ${state.label.left}px !important;
    top: ${state.label.top}px !important;
    transform: scale(${state.label.scale}) !important;
    z-index: 12;
}`;
    }

    radioScaleSlider.addEventListener('input', e => { state.radio.scale = parseFloat(e.target.value).toFixed(2); updateCode(); });
    labelScaleSlider.addEventListener('input', e => { state.label.scale = parseFloat(e.target.value).toFixed(2); updateCode(); });

    // Drag logic
    function makeDraggable(el, key) {
        let isDragging = false, startX, startY, startLeft, startTop;
        el.style.cursor = 'grab';
        
        el.addEventListener('mousedown', e => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.closest('#radio-layout-tool')) return;
            e.preventDefault();
            isDragging = true;
            startX = e.clientX; startY = e.clientY;
            startLeft = state[key].left; startTop = state[key].top;
            el.style.cursor = 'grabbing';
            el.style.zIndex = 10000;
        });
        
        document.addEventListener('mousemove', e => {
            if (!isDragging) return;
            state[key].left = Math.round(startLeft + (e.clientX - startX));
            state[key].top = Math.round(startTop + (e.clientY - startY));
            updateCode();
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
            el.style.cursor = 'grab';
            el.style.zIndex = (key === 'label') ? 12 : 11;
        });
    }

    makeDraggable(radioAnchor, 'radio');
    makeDraggable(radioLabel, 'label');
    
    updateCode();
});
