/**
 * Creates an info spot hotspot DOM element with floating popup
 * @param {Object} infoSpot - The info spot data { id, title, description, yaw, pitch }
 * @returns {HTMLElement} The hotspot DOM element
 */
export function createInfoSpotElement(infoSpot) {
    const el = document.createElement("div");
    el.className = "info-hotspot cursor-pointer";
    el.style.cssText = "display: flex; flex-direction: column; align-items: center; position: relative;";

    // Icon and popup HTML structure
    el.innerHTML = `
        <div class="info-spot-icon" style="
            width: 40px; 
            height: 40px; 
            margin-left: -20px; 
            margin-top: -20px; 
            border-radius: 50%; 
            background: linear-gradient(135deg, #64748b 0%, #475569 100%); 
            box-shadow: 0 4px 15px rgba(100, 116, 139, 0.5), 0 0 0 3px rgba(255,255,255,0.3); 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            cursor: pointer; 
            transition: all 0.2s ease; 
            z-index: 1;
        ">
            <svg viewBox="0 0 24 24" fill="white" style="width: 20px; height: 20px;">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
        </div>
        
        <div class="hotspot-label" style="margin-top: 4px; margin-left: -20px; pointer-events: none;">
            ${escapeHtml(infoSpot.title)}
        </div>
        
        <!-- Floating Popup Card -->
        <div class="info-popup" style="
            display: none; 
            position: absolute; 
            bottom: 60px; 
            left: 50%; 
            transform: translateX(-50%) translateX(-20px); 
            min-width: 280px; 
            max-width: 360px; 
            background: white; 
            border-radius: 16px; 
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0,0,0,0.1); 
            z-index: 100;
        ">
            <!-- Arrow pointer -->
            <div style="
                position: absolute; 
                bottom: -8px; 
                left: 50%; 
                transform: translateX(-50%); 
                width: 0; 
                height: 0; 
                border-left: 10px solid transparent; 
                border-right: 10px solid transparent; 
                border-top: 10px solid white;
            "></div>
            
            <!-- Header -->
            <div style="
                background: linear-gradient(135deg, #64748b 0%, #475569 100%); 
                color: white; 
                padding: 14px 16px; 
                border-radius: 16px 16px 0 0; 
                display: flex; 
                align-items: center; 
                gap: 10px;
            ">
                <div style="
                    width: 32px; 
                    height: 32px; 
                    border-radius: 50%; 
                    background: rgba(255,255,255,0.2); 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    flex-shrink: 0;
                ">
                    <svg viewBox="0 0 24 24" fill="white" style="width: 16px; height: 16px;">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                    </svg>
                </div>
                <span style="
                    font-weight: 700; 
                    font-size: 15px; 
                    flex: 1; 
                    overflow: hidden; 
                    text-overflow: ellipsis; 
                    white-space: nowrap;
                ">${escapeHtml(infoSpot.title)}</span>
                <button class="close-popup" style="
                    width: 28px; 
                    height: 28px; 
                    border-radius: 50%; 
                    background: rgba(255,255,255,0.2); 
                    border: none; 
                    cursor: pointer; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    transition: background 0.2s;
                ">
                    <svg viewBox="0 0 24 24" fill="white" style="width: 16px; height: 16px;">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                </button>
            </div>
            
            <!-- Content -->
            <div style="
                padding: 16px; 
                color: #374151; 
                font-size: 14px; 
                line-height: 1.6; 
                max-height: 200px; 
                overflow-y: auto;
            ">
                ${infoSpot.description 
                    ? escapeHtml(infoSpot.description) 
                    : '<span style="color: #9ca3af; font-style: italic;">Tidak ada deskripsi tersedia.</span>'
                }
            </div>
        </div>
    `;

    // Get element references
    const iconEl = el.querySelector('.info-spot-icon');
    const popupEl = el.querySelector('.info-popup');
    const closeBtn = el.querySelector('.close-popup');

    // Click icon to toggle popup
    iconEl.addEventListener("click", (e) => {
        e.stopPropagation();
        const isVisible = popupEl.style.display === 'block';
        
        // Close all other popups first
        document.querySelectorAll('.info-popup').forEach(p => {
            p.style.display = 'none';
        });
        // Reset all icons
        document.querySelectorAll('.info-spot-icon').forEach(icon => {
            icon.style.transform = 'scale(1)';
            icon.style.boxShadow = '0 4px 15px rgba(100, 116, 139, 0.5), 0 0 0 3px rgba(255,255,255,0.3)';
        });
        
        // Toggle this popup
        popupEl.style.display = isVisible ? 'none' : 'block';
        
        // Scale effect on icon
        if (!isVisible) {
            iconEl.style.transform = 'scale(1.1)';
            iconEl.style.boxShadow = '0 6px 20px rgba(100, 116, 139, 0.7), 0 0 0 4px rgba(255,255,255,0.5)';
        }
    });

    // Close button handler
    closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        popupEl.style.display = 'none';
        iconEl.style.transform = 'scale(1)';
        iconEl.style.boxShadow = '0 4px 15px rgba(100, 116, 139, 0.5), 0 0 0 3px rgba(255,255,255,0.3)';
    });

    // Hover effects for close button
    closeBtn.addEventListener("mouseenter", () => {
        closeBtn.style.background = 'rgba(255,255,255,0.3)';
    });
    closeBtn.addEventListener("mouseleave", () => {
        closeBtn.style.background = 'rgba(255,255,255,0.2)';
    });

    return el;
}

/**
 * Escapes HTML to prevent XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
