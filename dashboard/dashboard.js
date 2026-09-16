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
    const tabEventHQ = document.getElementById('tabEventHQ');
    const tabSecurity = document.getElementById('tabSecurity');

    const viewBriefs = document.getElementById('viewBriefs');
    const viewTemplates = document.getElementById('viewTemplates');
    const viewEventHQ = document.getElementById('viewEventHQ');
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

    const provisionForm = document.getElementById('provisionCoupleForm');
    const provisionStatus = document.getElementById('provisionStatus');
    
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
                        authError.textContent = `ERROR: ${responseResult.message}`;
                        authError.style.display = 'block';
                        authInput.value = '';
                    }
                } catch (err) {
                    authError.textContent = 'SYSTEM ERROR: PIPELINE INTERCEPTED VERIFICATION';
                    authError.style.display = 'block';
                }
            });
        }
    }

    function clearActiveViewState() {
        [tabBriefs, tabTemplates, tabEventHQ, tabSecurity].forEach(tab => tab?.classList.remove('active'));
        [viewBriefs, viewTemplates, viewEventHQ, viewSecurity].forEach(view => { if (view) view.style.display = 'none'; });
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

    if (tabEventHQ) {
        tabEventHQ.addEventListener('click', () => {
            clearActiveViewState();
            tabEventHQ.classList.add('active');
            viewEventHQ.style.display = 'block';
            populateTemplateDropdown();
            fetchCouplesDirectory();
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
            'custom': 'Pre-Built Vault Framework',
            'fullstack': 'Custom Full-Stack App',
            'consult': 'Strategy Call'
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
            formData.append('bannerText', document.getElementById('tplBanner').value.trim() || 'READY FRAMEWORK');
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
                    alert(`INGESTION REJECTED: ${result.message}`);
                }
            } catch (err) { alert('NETWORK TRANSMISSION ERROR EXECUTING FILE UPLOAD'); }
        });
    }

    // --- DYNAMIC TEMPLATE LOADER FOR EVENT HQ PROVISION DROPDOWN ---
    async function populateTemplateDropdown() {
        const dropdown = document.getElementById('provTemplate');
        if (!dropdown) return;

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/templates`);
            const result = await response.json();

            if (result.success && result.data.length > 0) {
                const eventTemplates = result.data.filter(t => t.category === 'invite');
                
                if (eventTemplates.length === 0) {
                    dropdown.innerHTML = `<option value="" disabled selected>No 'invite' category templates found in system</option>`;
                    return;
                }

                dropdown.innerHTML = eventTemplates.map(t => 
                    `<option value="${t.title.toLowerCase().replace(/\s+/g, '-')}">${escapeHTML(t.title)}</option>`
                ).join('');
            } else {
                dropdown.innerHTML = `<option value="" disabled selected>No templates found in system</option>`;
            }
        } catch (err) {
            dropdown.innerHTML = `<option value="" disabled selected>Error loading templates from API</option>`;
        }
    }

    // --- FETCH & RENDER PROVISIONED COUPLES DIRECTORY ---
    async function fetchCouplesDirectory() {
        const tableBody = document.getElementById('couplesTableBody');
        if (!tableBody) return;

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/event-hq/admin/couples`);
            const result = await response.json();

            if (!result.success || !result.data || result.data.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="6" style="padding:1.5rem; text-align:center; color:var(--text-muted);">No couples provisioned yet.</td></tr>`;
                return;
            }

            tableBody.innerHTML = result.data.map(c => `
                <tr style="border-bottom: 1px solid var(--border-line);">
                    <td style="padding:0.75rem;"><strong>${escapeHTML(c.coupleNames)}</strong></td>
                    <td style="padding:0.75rem;">${escapeHTML(c.email)}</td>
                    <td style="padding:0.75rem;"><code>${c.event ? c.event.slug : 'N/A'}</code></td>
                    <td style="padding:0.75rem;">${c.guestCount}</td>
                    <td style="padding:0.75rem;">
                        <span style="color: ${c.isLocked ? '#ff3366' : '#00ff66'}; font-weight:bold;">
                            ${c.isLocked ? 'LOCKED' : 'ACTIVE'}
                        </span>
                    </td>
                    <td style="padding:0.75rem; display:flex; gap:0.4rem;">
                        <button class="copy-btn" onclick="editCoupleCredentials('${c._id}', '${escapeHTML(c.email)}')">Edit Auth</button>
                        <button class="copy-btn" style="border-color:${c.isLocked ? '#00ff66' : '#ff3366'}; color:${c.isLocked ? '#00ff66' : '#ff3366'};" onclick="toggleCoupleLock('${c._id}')">
                            ${c.isLocked ? 'Unlock' : 'Lock'}
                        </button>
                    </td>
                </tr>
            `).join('');

        } catch (err) {
            tableBody.innerHTML = `<tr><td colspan="6" style="padding:1.5rem; text-align:center; color:#ff3366;">Error retrieving couples directory.</td></tr>`;
        }
    }

    // --- PROVISION FORM SUBMIT WITH SEPARATE BRIDE & GROOM ---
    if (provisionForm) {
        provisionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            provisionStatus.style.display = 'none';

            const payload = {
                email: document.getElementById('provEmail').value.trim(),
                password: document.getElementById('provPassword').value,
                brideName: document.getElementById('provBrideName').value.trim(),
                groomName: document.getElementById('provGroomName').value.trim(),
                slug: document.getElementById('provSlug').value.trim(),
                eventDate: document.getElementById('provEventDate').value,
                venueName: document.getElementById('provVenueName').value.trim(),
                venueAddress: document.getElementById('provVenueAddress').value.trim(),
                googleMapsUrl: document.getElementById('provGoogleMapsUrl').value.trim(),
                assignedTemplate: document.getElementById('provTemplate').value
            };

            try {
                const response = await fetch(`${CONFIG.API_BASE_URL}/api/event-hq/admin/provision-couple`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();

                if (result.success) {
                    provisionStatus.style.color = '#00ff66';
                    provisionStatus.textContent = `SUCCESS: Provisioned portal for ${result.data.user.coupleNames}`;
                    provisionStatus.style.display = 'block';
                    provisionForm.reset();
                    fetchCouplesDirectory();
                } else {
                    provisionStatus.style.color = '#ff3366';
                    provisionStatus.textContent = `REJECTED: ${result.message}`;
                    provisionStatus.style.display = 'block';
                }
            } catch (err) {
                provisionStatus.style.color = '#ff3366';
                provisionStatus.textContent = 'ERROR: Unable to provision couple profile.';
                provisionStatus.style.display = 'block';
            }
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
                    passStatus.textContent = 'SUCCESS: Passkey rotated in database core. Logging out...';
                    passStatus.style.display = 'block';
                    passForm.reset();

                    setTimeout(() => {
                        localStorage.removeItem('launcher_hq_session');
                        window.location.reload();
                    }, 2000);
                } else {
                    passStatus.style.color = '#ff3366';
                    passStatus.textContent = `REJECTED: ${result.message}`;
                    passStatus.style.display = 'block';
                }
            } catch (err) {
                passStatus.style.color = '#ff3366';
                passStatus.textContent = 'ERROR: Failed to transmit security update to server core.';
                passStatus.style.display = 'block';
            }
        });
    }

    // --- GLOBAL ACTIONS: EDIT CREDENTIALS & TOGGLE LOCK ---
    window.editCoupleCredentials = async function(id, currentEmail) {
        const newEmail = prompt('Update Login Email:', currentEmail);
        const newPassword = prompt('Enter new password (leave blank to keep unchanged):');

        if (newEmail === null) return;

        const payload = {};
        if (newEmail && newEmail.trim() !== currentEmail) payload.email = newEmail.trim();
        if (newPassword) payload.newPassword = newPassword;

        if (Object.keys(payload).length === 0) return;

        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/api/event-hq/admin/update-couple-credentials/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            if (result.success) {
                alert('SUCCESS: Credentials updated.');
                fetchCouplesDirectory();
            } else {
                alert(`ERROR: ${result.message}`);
            }
        } catch (err) { alert('ERROR updating credentials'); }
    };

    window.toggleCoupleLock = async function(id) {
        if (!confirm('Toggle lock status for this couple account?')) return;
        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/api/event-hq/admin/toggle-lock/${id}`, { method: 'PUT' });
            const result = await res.json();
            if (result.success) {
                fetchCouplesDirectory();
            } else {
                alert(`ERROR: ${result.message}`);
            }
        } catch (err) { alert('ERROR toggling lock status'); }
    };

    window.purgeClientBrief = async function(id) {
        if (!confirm('Permanent deletion entry tracking data profile. Continue?')) return;
        await fetch(`${CONFIG.API_BASE_URL}/api/commissions/${id}`, { 
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${getSessionToken()}` }
        });
        fetchOperationsMatrix();
    };

    const eventDateInput = document.getElementById('provEventDate');
    if (eventDateInput) {
        eventDateInput.addEventListener('click', () => {
            if (typeof eventDateInput.showPicker === 'function') {
                eventDateInput.showPicker();
            }
        });
    }

    window.purgePublishedTemplate = async function(id) {
        if (!confirm('Unpublish and delete this template design?')) return;
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