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

        // ⚡ ADDED: Inject a premium loading animation immediately before the fetch request starts
        matrixGrid.innerHTML = `
            <div class="matrix-loader-wrapper" style="grid-column: 1 / -1; text-align: center; padding: 4rem; color: #00f0ff;">
                <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.8;">Synchronizing Live Design Vault...</p>
            </div>
        `;

        try {
            // Retrieve dynamic template blueprints from your API engine
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/templates`);
            const result = await response.json();

            if (!result.success || result.count === 0) {
                matrixGrid.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:#999; padding:3rem;">Our current design collection is being refreshed. Stay tuned!</div>`;
                if (templateCounter) templateCounter.textContent = "00";
                return;
            }

            // A. Sync the counter stat module badge automatically
            if (templateCounter) {
                templateCounter.textContent = String(result.count).padStart(2, '0');
            }

            // B. Map database records into dynamic preview layout cards
            renderFrameworkGrid(result.data);

        } catch (error) {
            console.error('CMS Content Sync Fault:', error);
            matrixGrid.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:#ff3366; padding:2rem; font-family:monospace;">⚠️ CONNECTION ERROR: Unable to load design matrix.</div>`;
        }
    }

function renderFrameworkGrid(templates) {
    if (!matrixGrid) return; //
    
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
            // 1. Swap active architectural styling line classes
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const selectedFilter = btn.getAttribute('data-filter');

            // 2. Evaluate layout elements against selection targets
            matrixItems.forEach(item => {
                const itemCategory = item.getAttribute('data-category');

                if (selectedFilter === 'all' || itemCategory === selectedFilter) {
                    item.style.display = 'flex'; // Restores brutalist block presence
                } else {
                    item.style.display = 'none';  // Evicts layout item cleanly from viewport
                }
            });
        });
    });
}

    // ==========================================================================
    // 3. CLIENT BRIEF INTAKE FORM TRANSMITTER (POST PIPELINE)
    // ==========================================================================
    if (agencyForm) {
        agencyForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Blocks disruptive native window reload loops

            // Extract data profiles directly from layout nodes
            const companyName = document.getElementById('bizName').value.trim();
            const corporateEmail = document.getElementById('bizEmail').value.trim();
            const coreObjective = document.getElementById('bizGoal').value;
            const projectBrief = document.getElementById('bizBrief').value.trim();

            if (!companyName || !corporateEmail || !coreObjective) {
                alert('Please populate all required form tracks.');
                return;
            }

            // Formulate standard JSON payload mapped cleanly to your Mongoose Schema keys
            const payload = { companyName, corporateEmail, coreObjective, projectBrief };

            try {
                const response = await fetch(`${CONFIG.API_BASE_URL}/api/commissions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();

                if (result.success) {
                    alert(`🚀 TRANSMISSION SUCCESSFUL\n\nYour layout specifications have been written directly to the database layer.\nReference ID: ${result.dataId}`);
                    agencyForm.reset(); // Safely clear form states upon validated database entry
                } else {
                    alert(`❌ INGESTION REJECTED: ${result.message}`);
                }

            } catch (error) {
                console.error('Network Pipeline Fault:', error);
                alert('❌ TRANSMISSION FAILED: Ensure your launchpad-core-api backend engine is active on port 5000.');
            }
        });
    }

    // Text sanitization layer shielding output loops
    function escapeText(str) {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, t => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[t] || t));
    }

    // Initialize content fetching loop instantly on startup
    fetchLiveFrameworks();
});

// --- MOBILE NAVBAR TOGGLE INTERACTION LAYOUT ---
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');

if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close the navigation overlay screen immediately if an internal link tracking tag is selected
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
}