document.addEventListener('DOMContentLoaded', () => {

    // --- DOM TARGET HOOKS ---
    const filterButtons = document.querySelectorAll('.filter-btn');
    const matrixGrid = document.getElementById('projectMatrix');
    const templateCounter = document.getElementById('templateCounter');
    const agencyForm = document.getElementById('agencyForm');

    // ==========================================================================
    // 1. DIGITAL CMS: FETCH AND RENDER DATABASE WORK FRAMEWORKS
    // ==========================================================================
    async function fetchLiveFrameworks() {
        if (!matrixGrid) return;

        matrixGrid.innerHTML = `
            <div class="matrix-loader-wrapper" style="grid-column: 1 / -1; text-align: center; padding: 4rem; color: #00f0ff;">
                <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.8;">Synchronizing Live Design Vault...</p>
            </div>
        `;

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/templates`);
            const result = await response.json();

            if (!result.success || result.count === 0) {
                matrixGrid.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:#999; padding:3rem;">Our current design collection is being refreshed. Stay tuned!</div>`;
                if (templateCounter) templateCounter.textContent = "00";
                return;
            }

            if (templateCounter) {
                templateCounter.textContent = String(result.count).padStart(2, '0');
            }

            renderFrameworkGrid(result.data);

        } catch (error) {
            console.error('CMS Content Sync Fault:', error);
            matrixGrid.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:#ff3366; padding:2rem; font-family:monospace;">⚠️ CONNECTION ERROR: Unable to load design matrix.</div>`;
        }
    }

    function renderFrameworkGrid(templates) {
        if (!matrixGrid) return;
        
        matrixGrid.innerHTML = templates.map(tpl => {
            const actionButton = tpl.livePreviewUrl 
                ? `<a href="${tpl.livePreviewUrl}" target="_blank" rel="noopener noreferrer" class="matrix-btn-blueprint">Explore Live Demo ↗</a>`
                : `<span class="matrix-fallback-tag">Blueprint Deploying Soon</span>`; 

            const backgroundGradient = tpl.gradientStyle || 'linear-gradient(135deg, #00f0ff 0%, #1a2035 100%)';

            const imageUrl = tpl.thumbnailUrl 
                ? (tpl.thumbnailUrl.startsWith('http') ? tpl.thumbnailUrl : `${CONFIG.API_BASE_URL}${tpl.thumbnailUrl}`)
                : null;

            const imageViewportHTML = imageUrl 
                ? `<div class="image-viewport">
                       <img src="${imageUrl}" alt="${escapeText(tpl.title)}" loading="lazy">
                   </div>` 
                : `<div class="image-viewport fallback-mesh" style="background: ${backgroundGradient} !important;">
                       <span class="mesh-banner-text">${escapeText(tpl.bannerText || '⚡ PRE-BUILT VAULT')}</span>
                   </div>`;

            return `
                <div class="matrix-item" data-category="${tpl.category}">
                    <div>
                        ${imageViewportHTML}
                        <div class="item-data-pane">
                            <span class="item-tag">${escapeText(tpl.tag)}</span>
                            <h3>${escapeText(tpl.title)}</h3>
                            <p>${escapeText(tpl.description)}</p>
                        </div>
                    </div>
                    <div class="item-action-pane">
                        ${actionButton}
                    </div>
                </div>
            `; 
        }).join(''); 

        initializeFilterEngine(); 
    }

    // ==========================================================================
    // 2. INTERACTIVE PORTFOLIO FILTER ENGINE
    // ==========================================================================
    function initializeFilterEngine() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        const matrixItems = document.querySelectorAll('.matrix-item');

        if (!filterButtons.length || !matrixItems.length) return;

        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const selectedFilter = btn.getAttribute('data-filter');

                matrixItems.forEach(item => {
                    const itemCategory = item.getAttribute('data-category');

                    if (selectedFilter === 'all' || itemCategory === selectedFilter) {
                        item.style.display = 'flex';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        });
    }

    // ==========================================================================
    // 3. CLIENT BRIEF INTAKE FORM TRANSMITTER + CUSTOM NOTIFICATION TOAST
    // ==========================================================================
    if (agencyForm) {
        agencyForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const bizName = document.getElementById('bizName').value.trim();
            const bizEmail = document.getElementById('bizEmail').value.trim();
            const bizGoal = document.getElementById('bizGoal').value;
            const bizBrief = document.getElementById('bizBrief').value.trim();

            if (!bizName || !bizEmail || !bizGoal) {
                showToastNotification('⚠️ MISSING DETAILS', 'Please fill out all required fields before submitting.', 'error');
                return;
            }

            const payload = { bizName, bizEmail, bizGoal, bizBrief };

            try {
                const response = await fetch(`${CONFIG.API_BASE_URL}/api/commissions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();

                if (result.success) {
                    // 🚀 SHOW HIGH-TECH NOTIFICATION TOAST
                    showToastNotification(
                        '🚀 TRANSMISSION RECEIVED', 
                        `Thank you, <strong>${escapeText(bizName)}</strong>! Your inquiry has been logged successfully. We will reach out to <strong>${escapeText(bizEmail)}</strong> shortly.`, 
                        'success'
                    );
                    agencyForm.reset();
                } else {
                    showToastNotification('❌ INGESTION REJECTED', result.message, 'error');
                }

            } catch (error) {
                console.error('Network Pipeline Fault:', error);
                showToastNotification('❌ NETWORK FAULT', 'Unable to reach LaunchPad Core API. Please try again later.', 'error');
            }
        });
    }

    // ==========================================================================
    // 4. DYNAMIC NOTIFICATION TOAST GENERATOR
    // ==========================================================================
    function showToastNotification(title, message, type = 'success') {
        let toastContainer = document.getElementById('toastContainer');
        
        // Create container element if it doesn't exist yet
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toastContainer';
            toastContainer.style.cssText = `
                position: fixed;
                bottom: 24px;
                right: 24px;
                z-index: 99999;
                display: flex;
                flex-direction: column;
                gap: 12px;
                max-width: 380px;
                width: calc(100% - 48px);
                pointer-events: none;
            `;
            document.body.appendChild(toastContainer);
        }

        const isSuccess = type === 'success';
        const accentColor = isSuccess ? '#00f0ff' : '#ff3366';
        const bgGradient = isSuccess 
            ? 'linear-gradient(135deg, rgba(13, 15, 22, 0.95) 0%, rgba(0, 240, 255, 0.08) 100%)'
            : 'linear-gradient(135deg, rgba(13, 15, 22, 0.95) 0%, rgba(255, 51, 102, 0.08) 100%)';

        const toast = document.createElement('div');
        toast.style.cssText = `
            background: ${bgGradient};
            backdrop-filter: blur(12px);
            border: 1px solid ${accentColor};
            border-left: 4px solid ${accentColor};
            border-radius: 6px;
            padding: 16px;
            color: #ffffff;
            font-family: monospace;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            pointer-events: auto;
            transform: translateX(120%);
            transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        `;

        toast.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="font-size: 11px; font-weight: bold; letter-spacing: 1.5px; color: ${accentColor};">${title}</span>
                <button style="background: transparent; border: none; color: #888; font-size: 14px; cursor: pointer; padding: 0; line-height: 1;" onclick="this.parentElement.parentElement.remove()">✕</button>
            </div>
            <div style="font-size: 12px; line-height: 1.5; color: #d0d5dd;">${message}</div>
        `;

        toastContainer.appendChild(toast);

        // Slide into view smoothly
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
        });

        // Auto-dismiss after 6 seconds
        setTimeout(() => {
            toast.style.transform = 'translateX(120%)';
            setTimeout(() => toast.remove(), 400);
        }, 6000);
    }

    // Text sanitization utility
    function escapeText(str) {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, t => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[t] || t));
    }

    // Initialize content fetching loop
    fetchLiveFrameworks();
});

// --- MOBILE NAVBAR TOGGLE INTERACTION ---
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');

if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
}