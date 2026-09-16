document.addEventListener('DOMContentLoaded', () => {
    const authOverlay = document.getElementById('authGateOverlay');
    const authForm = document.getElementById('authGateForm');
    const authInput = document.getElementById('gatePasskeyInput');
    const authError = document.getElementById('authGateError');

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = function() {
            localStorage.removeItem('launcher_hq_session');
            window.location.reload();
        };
    }

    const tabBriefs = document.getElementById('tabBriefs');
    const tabTemplates = document.getElementById('tabTemplates');
    const tabSecurity = document.getElementById('tabSecurity');

    const viewBriefs = document.getElementById('viewBriefs');
    const viewTemplates = document.getElementById('viewTemplates');
    const viewSecurity = document.getElementById('viewSecurity');

    const matrixGrid = document.getElementById('matrixGrid');
    const templateCatalogGrid = document.getElementById('templateCatalogGrid');

    const kpiTotal = document.getElementById('kpiTotal');
    const kpiFullstack = document.getElementById('kpiFullstack');
    const kpiConsult = document.getElementById('kpiConsult');
    const cmsCount = document.getElementById('cmsCount');

    const tplModalOverlay = document.getElementById('tplModalOverlay');
    const openTplModalBtn = document.getElementById('openTplModalBtn');
    const closeTplModalBtn = document.getElementById('closeTplModalBtn');
    const templateForm = document.getElementById('templateForm');

    const mobileMenuBtn = document.getElementById('mobileMenuToggleBtn');
    const sidebarPanel = document.getElementById('sidebarPanel');

    const passForm = document.getElementById('passwordUpdateForm');
    const passStatus = document.getElementById('passUpdateStatus');
    
    const getSessionToken = () => localStorage.getItem('launcher_hq_session');

    if (mobileMenuBtn && sidebarPanel) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebarPanel.classList.toggle('mobile-expanded');
            mobileMenuBtn.textContent = sidebarPanel.classList.contains('mobile-expanded') ? 'CLOSE ✕' : 'MENU ☰';
        });
    }

    if (getSessionToken()) {
        if (authOverlay) authOverlay.remove();
    } else {
        if (authForm) {
            authForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                authError.style.display = 'none';

                try {
                    const response = await fetch(`${CONFIG.API_BASE_URL}/api/auth/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ password: authInput.value })
                    });

                    const responseResult = await response.json();

                    if (responseResult.success) {
                        localStorage.setItem('launcher_hq_session', responseResult.token);
                        window.location.reload(); 
                    } else {
                        authError.textContent = `❌ ERROR: ${responseResult.message}`;
                        authError.style.display = 'block';
                        authInput.value = '';
                    }
                } catch (err) {
                    authError.textContent = '❌ NETWORK PIPELINE ERROR INTERCEPTING VERIFICATION';
                    authError.style.display = 'block';
                }
            });
        }
    }

    function clearActiveViewState() {
        [tabBriefs, tabTemplates, tabSecurity].forEach(tab => tab?.classList.remove('active'));
        [viewBriefs, viewTemplates, viewSecurity].forEach(view => { if (view) view.style.display = 'none'; });
        if (sidebarPanel) {
            sidebarPanel.classList.remove('mobile-expanded');
            if (mobileMenuBtn) mobileMenuBtn.textContent = 'MENU ☰';
        }
    }

    if (tabBriefs) {
        tabBriefs.addEventListener('click', () => {
            clearActiveViewState();
            tabBriefs.classList.add('active');
            viewBriefs.style.display = 'block';
            fetchOperationsMatrix();
        });
    }

    if (tabTemplates) {
        tabTemplates.addEventListener('click', () => {
            clearActiveViewState();
            tabTemplates.classList.add('active');
            viewTemplates.style.display = 'block';
            fetchCMSCatalog();
        });
    }

    if (tabSecurity) {
        tabSecurity.addEventListener('click', () => {
            clearActiveViewState();
            tabSecurity.classList.add('active');
            viewSecurity.style.display = 'block';
        });
    }

    if (openTplModalBtn && tplModalOverlay) {
        openTplModalBtn.addEventListener('click', () => {
            tplModalOverlay.style.display = 'flex';
        });
    }

    if (closeTplModalBtn && tplModalOverlay) {
        closeTplModalBtn.addEventListener('click', () => {
            tplModalOverlay.style.display = 'none';
        });
    }

    if (tplModalOverlay) {
        tplModalOverlay.addEventListener('click', (e) => {
            if (e.target === tplModalOverlay) {
                tplModalOverlay.style.display = 'none';
            }
        });
    }

    async function fetchOperationsMatrix() {
        if (!matrixGrid) return;
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/commissions`);
            const result = await response.json();
            if (!result.success) return;

            if (kpiTotal) kpiTotal.textContent = result.count;
            if (kpiFullstack) kpiFullstack.textContent = result.data.filter(b => b.coreObjective === 'fullstack').length;
            if (kpiConsult) kpiConsult.textContent = result.data.filter(b => b.coreObjective === 'consult').length;

            renderMatrixCards(result.data);
        } catch (err) { console.error('Brief Retrieval Error:', err); }
    }

    function renderMatrixCards(briefs) {
        if (!briefs || briefs.length === 0) {
            matrixGrid.innerHTML = `<div class="empty-state">No client specifications currently logged.</div>`;
            return;
        }

        const objectiveLabels = {
            'custom': '🚀 Pre-Built Vault Framework',
            'fullstack': '⚡ Custom Full-Stack App',
            'consult': '📞 Strategy Call'
        };

        matrixGrid.innerHTML = briefs.map(brief => {
            const displayGoal = objectiveLabels[brief.coreObjective] || brief.coreObjective;

            return `
                <div class="brief-card">
                    <div class="card-header" style="flex-direction: column; gap: 0.5rem; align-items: flex-start;">
                        <div class="comp-info">
                            <div class="comp-name">${escapeHTML(brief.companyName)}</div>
                            <div class="comp-email">${escapeHTML(brief.corporateEmail)}</div>
                        </div>
                        <span class="tag ${brief.coreObjective}">${escapeHTML(displayGoal)}</span>
                    </div>
                    <div class="brief-body">${escapeHTML(brief.projectBrief || 'No parameters outlined.')}</div>
                    <div class="action-row">
                        <span class="timestamp">[LOGGED: ${new Date(brief.createdAt).toLocaleDateString()}]</span>
                        <button class="btn-purge" onclick="purgeClientBrief('${brief._id}')">PURGE DATA</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    async function fetchCMSCatalog() {
        if (!templateCatalogGrid) return;
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/templates`);
            const result = await response.json();
            if (!result.success) return;

            if (cmsCount) cmsCount.textContent = result.count;
            renderCatalogCards(result.data);
        } catch (err) { console.error('CMS Catalog Retrieval Error:', err); }
    }

    function renderCatalogCards(templates) {
        if (!templateCatalogGrid) return;
        templateCatalogGrid.innerHTML = templates.map(tpl => {
            const imageUrl = tpl.thumbnailUrl 
                ? (tpl.thumbnailUrl.startsWith('http') ? tpl.thumbnailUrl : `${CONFIG.API_BASE_URL}${tpl.thumbnailUrl}`)
                : null;

            const adminFrameStyle = imageUrl 
                ? `background: url('${imageUrl}') center/cover no-repeat; height: 60px; border-radius: 4px;` 
                : `background: ${tpl.gradientStyle}; padding: 0.5rem; font-size: 0.7rem; font-weight: bold; text-align: center; border-radius: 4px; color: #fff; letter-spacing:1px;`;

            const adminBannerMarkup = imageUrl ? '' : escapeHTML(tpl.bannerText);

            return `
                <div class="brief-card" style="border-top: 3px solid var(--border-active);">
                    <div class="card-header" style="flex-direction:column; gap:0.5rem; align-items:stretch;">
                        <div style="${adminFrameStyle}">
                            ${adminBannerMarkup}
                        </div>
                        <div class="comp-info">
                            <div class="comp-name" style="font-size:1.1rem;">${escapeHTML(tpl.title)}</div>
                            <div class="comp-email">${escapeHTML(tpl.tag)}</div>
                        </div>
                        <span class="tag custom" style="width:fit-content; text-align:center;">${tpl.category}</span>
                    </div>
                    <div class="brief-body" style="margin-top:0.5rem; font-size:0.8rem; padding:0.75rem;">${escapeHTML(tpl.description)}</div>
                    <div class="action-row">
                        <span class="timestamp">[ID: ${tpl._id.substring(18)}]</span>
                        <button class="btn-purge" onclick="purgePublishedTemplate('${tpl._id}')">UNPUBLISH</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    if (templateForm) {
        templateForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData();
            formData.append('title', document.getElementById('tplTitle').value.trim());
            formData.append('tag', document.getElementById('tplTag').value.trim());
            formData.append('category', document.getElementById('tplCategory').value);
            formData.append('gradientStyle', document.getElementById('tplGradient').value);
            formData.append('vaultTargetUrl', document.getElementById('vaultTargetUrl').value.trim());
            formData.append('bannerText', document.getElementById('tplBanner').value.trim() || '⚡ PRE-BUILT VAULT');
            formData.append('description', document.getElementById('tplDescription').value.trim());

            const fileInput = document.getElementById('thumbnailFile'); 
            if (fileInput && fileInput.files.length > 0) {
                formData.append('thumbnailFile', fileInput.files[0]);
            }

            try {
                const response = await fetch(`${CONFIG.API_BASE_URL}/api/templates`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${getSessionToken()}`
                    },
                    body: formData 
                });
                const result = await response.json();

                if (result.success) {
                    templateForm.reset(); 
                    if (tplModalOverlay) tplModalOverlay.style.display = 'none';
                    await fetchCMSCatalog(); 
                } else {
                    alert(`❌ INGESTION REJECTED: ${result.message}`);
                }
            } catch (err) { alert('❌ NETWORK TRANSMISSION ERROR EXECUTING FILE UPLOAD'); }
        });
    }


    if (passForm) {
        passForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            passStatus.style.display = 'none';

            const currentPassword = document.getElementById('currentPass').value;
            const newPassword = document.getElementById('newPass').value;

            try {
                const response = await fetch(`${CONFIG.API_BASE_URL}/api/auth/update-password`, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${getSessionToken()}`
                    },
                    body: JSON.stringify({ currentPassword, newPassword })
                });

                const result = await response.json();

                if (result.success) {
                    passStatus.style.color = '#00ff00';
                    passStatus.textContent = '🟢 SUCCESS: Passkey rotated in MongoDB core. Logging out...';
                    passStatus.style.display = 'block';
                    passForm.reset();

                    setTimeout(() => {
                        localStorage.removeItem('launcher_hq_session');
                        window.location.reload();
                    }, 2000);
                } else {
                    passStatus.style.color = '#ff3366';
                    passStatus.textContent = `❌ REJECTED: ${result.message}`;
                    passStatus.style.display = 'block';
                }
            } catch (err) {
                passStatus.style.color = '#ff3366';
                passStatus.textContent = '❌ ERROR: Failed to transmit security update to server core.';
                passStatus.style.display = 'block';
            }
        });
    }

    window.purgeClientBrief = async function(id) {
        if (!confirm('🛑 Permanent deletion entry tracking data profile. Continue?')) return;
        await fetch(`${CONFIG.API_BASE_URL}/api/commissions/${id}`, { 
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${getSessionToken()}` }
        });
        fetchOperationsMatrix();
    };

    window.purgePublishedTemplate = async function(id) {
        if (!confirm('🛑 Unpublish and delete this template design?')) return;
        await fetch(`${CONFIG.API_BASE_URL}/api/templates/${id}`, { 
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${getSessionToken()}` }
        });
        fetchCMSCatalog();
    };

    function escapeHTML(str) {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, t => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[t] || t));
    }
    fetchOperationsMatrix();
});