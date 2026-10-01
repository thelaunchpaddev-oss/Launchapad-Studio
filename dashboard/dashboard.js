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

    // --- CUSTOM APP MODAL NOTIFICATION HOOKS ---
    const appModalOverlay = document.getElementById('appModalOverlay');
    const appModalTitle = document.getElementById('appModalTitle');
    const appModalMessage = document.getElementById('appModalMessage');
    const appModalCloseBtn = document.getElementById('appModalCloseBtn');

    function showAppModal(title, message, isError = false) {
        if (!appModalOverlay) return;
        appModalTitle.textContent = title;
        appModalTitle.style.color = isError ? 'var(--neon-red)' : 'var(--neon-blue)';
        appModalMessage.innerHTML = message;
        appModalOverlay.style.display = 'flex';
    }

    if (appModalCloseBtn && appModalOverlay) {
        appModalCloseBtn.onclick = () => { appModalOverlay.style.display = 'none'; };
        appModalOverlay.onclick = (e) => { if (e.target === appModalOverlay) appModalOverlay.style.display = 'none'; };
    }
    
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
            populateTemplateDropdowns();
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
                    showAppModal('INGESTION REJECTED', result.message, true);
                }
            } catch (err) { showAppModal('NETWORK ERROR', 'Error executing file upload.', true); }
        });
    }

    // --- SECURE ADMIN TEMPLATE LOADER FOR PROVISIONER DROPDOWNS ---
    async function populateTemplateDropdowns() {
        const regDropdown = document.getElementById('provRegularTemplate');
        const entDropdown = document.getElementById('provEntourageTemplate');
        if (!regDropdown || !entDropdown) return;

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/event-hq/admin/available-templates`, {
                headers: { 'Authorization': `Bearer ${getSessionToken()}` }
            });
            const result = await response.json();

            let regOptions = `<option value="" disabled selected>-- Select Regular Template --</option>`;
            let entOptions = `<option value="" selected>-- NONE (Use Single Default Template) --</option>`;

            if (result.success && result.data.length > 0) {
                const templateList = result.data.map(t => 
                    `<option value="${t.title.toLowerCase().replace(/\s+/g, '-')}">${escapeHTML(t.title)}</option>`
                ).join('');
                regOptions += templateList;
                entOptions += templateList;
            }

            regDropdown.innerHTML = regOptions;
            entDropdown.innerHTML = entOptions;

        } catch (err) {
            regDropdown.innerHTML = `<option value="">Error loading templates</option>`;
            entDropdown.innerHTML = `<option value="">Error loading templates</option>`;
        }
    }

    // --- FETCH & RENDER PROVISIONED DIRECTORY WITH ICON-BASED ACTIONS & DELETE ---
    async function fetchCouplesDirectory() {
        const tableBody = document.getElementById('couplesTableBody');
        if (!tableBody) return;

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/event-hq/admin/couples`);
            const result = await response.json();

            if (!result.success || !result.data || result.data.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="6" style="padding:1.5rem; text-align:center; color:var(--text-muted);">No event profiles provisioned yet.</td></tr>`;
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
                    <td style="padding:0.75rem; text-align:center;">
                        <div style="display:inline-flex; gap:0.5rem; align-items:center;">
                            <button title="Edit Authentication" class="icon-action-btn" onclick="editCoupleCredentials('${c._id}', '${escapeHTML(c.email)}')">
                                <i class="fas fa-key"></i>
                            </button>
                            <button title="${c.isLocked ? 'Unlock Account' : 'Lock Account'}" class="icon-action-btn" style="color:${c.isLocked ? '#00ff66' : '#ffbd2e'};" onclick="toggleCoupleLock('${c._id}')">
                                <i class="fas ${c.isLocked ? 'fa-lock-open' : 'fa-lock'}"></i>
                            </button>
                            <button title="Delete Event Profile" class="icon-action-btn delete" onclick="deleteEventProfile('${c._id}')">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');

        } catch (err) {
            tableBody.innerHTML = `<tr><td colspan="6" style="padding:1.5rem; text-align:center; color:#ff3366;">Error retrieving event directory.</td></tr>`;
        }
    }

    // --- PROVISION FORM SUBMIT WITH GENERAL EVENT TYPES ---
    if (provisionForm) {
        provisionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            provisionStatus.style.display = 'none';

            const regularVal = document.getElementById('provRegularTemplate').value;
            const entourageVal = document.getElementById('provEntourageTemplate').value;

            const payload = {
                eventType: document.getElementById('provEventType').value,
                email: document.getElementById('provEmail').value.trim(),
                password: document.getElementById('provPassword').value,
                brideName: document.getElementById('provBrideName').value.trim(),
                groomName: document.getElementById('provGroomName').value.trim(),
                slug: document.getElementById('provSlug').value.trim(),
                eventDate: document.getElementById('provEventDate').value,
                venueName: document.getElementById('provVenueName').value.trim(),
                venueAddress: document.getElementById('provVenueAddress').value.trim(),
                googleMapsUrl: document.getElementById('provGoogleMapsUrl').value.trim(),
                regularTemplate: regularVal,     
                entourageTemplate: entourageVal || regularVal 
            };

            try {
                const response = await fetch(`${CONFIG.API_BASE_URL}/api/event-hq/admin/provision-couple`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();

                if (result.success) {
                    showAppModal('SUCCESSFULLY PROVISIONED', `Created event portal for <strong>${result.data.user.coupleNames}</strong>.`);
                    provisionForm.reset();
                    fetchCouplesDirectory();
                } else {
                    showAppModal('PROVISION REJECTED', result.message, true);
                }
            } catch (err) {
                showAppModal('SYSTEM ERROR', 'Unable to provision event profile.', true);
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
                    showAppModal('PASSKEY ROTATED', 'Security passkey updated successfully in core database. Logging out...');
                    passForm.reset();

                    setTimeout(() => {
                        localStorage.removeItem('launcher_hq_session');
                        window.location.reload();
                    }, 2000);
                } else {
                    showAppModal('ROTATION REJECTED', result.message, true);
                }
            } catch (err) {
                showAppModal('TRANSMISSION ERROR', 'Failed to transmit security update to server core.', true);
            }
        });
    }

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
                showAppModal('UPDATED', 'Credentials updated successfully.');
                fetchCouplesDirectory();
            } else {
                showAppModal('ERROR', result.message, true);
            }
        } catch (err) { showAppModal('ERROR', 'Error updating credentials.', true); }
    };

    window.toggleCoupleLock = async function(id) {
        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/api/event-hq/admin/toggle-lock/${id}`, { method: 'PUT' });
            const result = await res.json();
            if (result.success) {
                fetchCouplesDirectory();
            } else {
                showAppModal('ERROR', result.message, true);
            }
        } catch (err) { showAppModal('ERROR', 'Error toggling lock status.', true); }
    };

    // --- DELETE EVENT PROFILE FUNCTION ---
    window.deleteEventProfile = async function(id) {
        if (!confirm('Are you sure you want to permanently delete this event profile and all its associated guest records?')) return;
        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/api/event-hq/admin/delete-couple/${id}`, { method: 'DELETE' });
            const result = await res.json();
            if (result.success) {
                showAppModal('DELETED', 'Event profile and records purged cleanly.');
                fetchCouplesDirectory();
            } else {
                showAppModal('ERROR', result.message, true);
            }
        } catch (err) { showAppModal('ERROR', 'Failed to delete event profile.', true); }
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