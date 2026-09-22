document.addEventListener('DOMContentLoaded', () => {

    // --- DOM TARGET HOOKS ---
    const filterButtons = document.querySelectorAll('.filter-btn');
    const matrixGrid = document.getElementById('projectMatrix');
    const templateCounter = document.getElementById('templateCounter');
    const agencyForm = document.getElementById('agencyForm');

    // ==========================================================================
    // 0. DIRECTIONAL SCROLL REVEAL OBSERVER ENGINE
    // ==========================================================================
    function initScrollObserver() {
        const animatedElements = document.querySelectorAll('.anim-slide-left, .anim-slide-right, .anim-fade-up, .adv-card, .matrix-item, .step-card, .pf-item');

        const observerOptions = {
            root: null,
            threshold: 0.10
        };

        const scrollObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-revealed');
                } else {
                    entry.target.classList.remove('is-revealed');
                }
            });
        }, observerOptions);

        animatedElements.forEach(el => scrollObserver.observe(el));
    }

    // ==========================================================================
    // 1. DIGITAL CMS: FETCH AND RENDER DATABASE WORK FRAMEWORKS
    // ==========================================================================
    async function fetchLiveFrameworks() {
        if (!matrixGrid) return;

        if (templateCounter) {
            templateCounter.innerHTML = `<i class="fas fa-spinner fa-spin" style="font-size: 0.8em; opacity: 0.6;"></i>`;
        }

        matrixGrid.innerHTML = `
            <div class="matrix-loader-wrapper" style="grid-column: 1 / -1; text-align: center; padding: 4rem; color: #2563EB;">
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
            if (templateCounter) templateCounter.textContent = "00";
            matrixGrid.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:#ef4444; padding:2rem; font-family:monospace;">⚠️ CONNECTION ERROR: Unable to load design matrix.</div>`;
        }
    }

    function renderFrameworkGrid(templates) {
        if (!matrixGrid) return;
        
        matrixGrid.innerHTML = templates.map(tpl => {
            const actionButton = tpl.livePreviewUrl 
                ? `<a href="${tpl.livePreviewUrl}" target="_blank" rel="noopener noreferrer" class="matrix-btn-blueprint">Explore Live Demo ↗</a>`
                : `<span class="matrix-fallback-tag" style="font-size: 11px; color: #9CA3AF; text-align: center; display: block;">Blueprint Deploying Soon</span>`; 

            const backgroundGradient = tpl.gradientStyle || 'linear-gradient(135deg, #2563EB 0%, #111827 100%)';

            const imageUrl = tpl.thumbnailUrl 
                ? (tpl.thumbnailUrl.startsWith('http') ? tpl.thumbnailUrl : `${CONFIG.API_BASE_URL}${tpl.thumbnailUrl}`)
                : null;

            const imageViewportHTML = imageUrl 
                ? `<div class="image-viewport">
                       <img src="${imageUrl}" alt="${escapeText(tpl.title)}" loading="lazy" decoding="async" fetchpriority="low">
                       <div class="hover-preview-overlay">
                           <span class="preview-badge">View Live Demo ↗</span>
                       </div>
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
        initScrollObserver();
    }

    // ==========================================================================
    // 2. INTERACTIVE PORTFOLIO FILTER ENGINE
    // ==========================================================================
    function initializeFilterEngine() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        const matrixItems = document.querySelectorAll('.matrix-item');

        if (!filterBtns.length || !matrixItems.length) return;

        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
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
    // 3. CLIENT BRIEF INTAKE FORM TRANSMITTER
    // ==========================================================================
    if (agencyForm) {
        agencyForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const bizName = document.getElementById('bizName').value.trim();
            const bizEmail = document.getElementById('bizEmail').value.trim();
            const bizGoal = document.getElementById('bizGoal').value;
            const bizBrief = document.getElementById('bizBrief').value.trim();

            if (!bizName || !bizEmail || !bizGoal) {
                showModalNotification(
                    'INCOMPLETE SUBMISSION', 
                    'Please populate all required fields before submitting your project request.', 
                    'error'
                );
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
                    showModalNotification(
                        'INQUIRY RECEIVED', 
                        `Thank you, <strong>${escapeText(bizName)}</strong>. Your inquiry has been logged successfully.<br><br>Our team will review your specifications and contact you directly at <span style="color: #2563EB; font-weight: 700;">${escapeText(bizEmail)}</span>.`, 
                        'success'
                    );
                    agencyForm.reset();
                } else {
                    showModalNotification('SUBMISSION ERROR', result.message, 'error');
                }

            } catch (error) {
                console.error('Network Pipeline Fault:', error);
                showModalNotification(
                    'NETWORK FAULT', 
                    'Unable to reach the server. Please check your internet connection and try again.', 
                    'error'
                );
            }
        });
    }

    // ==========================================================================
    // 4. MODAL NOTIFICATION ENGINE
    // ==========================================================================
    function showModalNotification(title, message, type = 'success') {
        let modalOverlay = document.getElementById('noticeModalOverlay');
        
        if (!modalOverlay) {
            modalOverlay = document.createElement('div');
            modalOverlay.id = 'noticeModalOverlay';
            modalOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(17, 24, 39, 0.75);
                backdrop-filter: blur(8px);
                z-index: 99999;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                box-sizing: border-box;
                opacity: 0;
                transition: opacity 0.25s ease;
            `;
            document.body.appendChild(modalOverlay);
        }

        const isSuccess = type === 'success';
        const borderColor = isSuccess ? '#2563EB' : '#ef4444';

        modalOverlay.innerHTML = `
            <div style="
                background: #FFFFFF;
                border: 1px solid ${borderColor};
                border-radius: 12px;
                max-width: 440px;
                width: 100%;
                padding: 2rem;
                box-shadow: 0 20px 50px rgba(0,0,0,0.15);
                font-family: inherit;
                box-sizing: border-box;
                text-align: center;
                transform: scale(0.95);
                transition: transform 0.25s ease;
            ">
                <div style="
                    font-size: 0.75rem; 
                    font-weight: 800; 
                    letter-spacing: 2px; 
                    color: ${borderColor}; 
                    text-transform: uppercase;
                    margin-bottom: 0.75rem;
                ">// ${title}</div>
                
                <div style="
                    font-size: 0.9rem; 
                    line-height: 1.6; 
                    color: #4B5563; 
                    margin-bottom: 1.75rem;
                ">${message}</div>

                <button id="closeNoticeBtn" style="
                    width: 100%;
                    padding: 0.75rem;
                    cursor: pointer;
                    font-family: inherit;
                    background: #111827;
                    color: #FFFFFF;
                    border: none;
                    border-radius: 8px;
                    font-weight: 700;
                ">Acknowledge</button>
            </div>
        `;

        requestAnimationFrame(() => {
            modalOverlay.style.opacity = '1';
            const card = modalOverlay.querySelector('div');
            if (card) card.style.transform = 'scale(1)';
        });

        const closeBtn = document.getElementById('closeNoticeBtn');
        const closeModal = () => {
            modalOverlay.style.opacity = '0';
            const card = modalOverlay.querySelector('div');
            if (card) card.style.transform = 'scale(0.95)';
            setTimeout(() => modalOverlay.remove(), 250);
        };

        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });
    }

    function escapeText(str) {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, t => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[t] || t));
    }

    // Initialize Observer & Fetch Initial Data
    initScrollObserver();
    fetchLiveFrameworks();

    // Reveal elements already in viewport on initial load
    setTimeout(() => {
        document.querySelectorAll('.anim-slide-left, .anim-slide-right, .anim-fade-up, .adv-card, .pf-item').forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight) {
                el.classList.add('is-revealed');
            }
        });
    }, 100);
});

// Mobile Nav Toggle Interaction
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');

if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    document.querySelectorAll('.pill-nav a').forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
}