document.addEventListener('DOMContentLoaded', () => {
    // Views & Modals
    const publicShowcaseView = document.getElementById('publicShowcaseView');
    const protectedConsoleView = document.getElementById('protectedConsoleView');

    const clientAuthModal = document.getElementById('clientAuthModal');
    const openAuthModalBtn = document.getElementById('openAuthModalBtn');
    const heroAuthTrigger = document.getElementById('heroAuthTrigger');
    const closeAuthModal = document.getElementById('closeAuthModal');

    const loginForm = document.getElementById('clientLoginForm');
    const loginEmail = document.getElementById('loginEmail');
    const loginPass = document.getElementById('loginPass');
    const loginError = document.getElementById('loginError');
    const logoutBtn = document.getElementById('logoutBtn');

    // Dashboard Data Nodes
    const displayCoupleNames = document.getElementById('displayCoupleNames');
    const guestTableBody = document.getElementById('guestTableBody');

    const statTotalLogged = document.getElementById('statTotalLogged');
    const statAttending = document.getElementById('statAttending');
    const statDeclined = document.getElementById('statDeclined');
    const statHeadcount = document.getElementById('statHeadcount');

    // Add Guest Modal
    const addGuestModal = document.getElementById('addGuestModal');
    const openAddGuestModal = document.getElementById('openAddGuestModal');
    const closeAddGuestModal = document.getElementById('closeAddGuestModal');
    const addGuestForm = document.getElementById('addGuestForm');

    let currentEventSlug = '';

    const getToken = () => localStorage.getItem('event_hq_token');

    // --- VIEW SWITCHING LOGIC ---
    function updateViewState() {
        if (getToken()) {
            if (publicShowcaseView) publicShowcaseView.style.display = 'none';
            if (protectedConsoleView) protectedConsoleView.style.display = 'block';
            if (openAuthModalBtn) openAuthModalBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'inline-block';
            loadDashboardData();
        } else {
            if (publicShowcaseView) publicShowcaseView.style.display = 'block';
            if (protectedConsoleView) protectedConsoleView.style.display = 'none';
            if (openAuthModalBtn) openAuthModalBtn.style.display = 'inline-block';
            if (logoutBtn) logoutBtn.style.display = 'none';
        }
    }

    // Modal Triggers
    const openModal = () => { if (clientAuthModal) clientAuthModal.style.display = 'flex'; };
    const closeModal = () => { if (clientAuthModal) clientAuthModal.style.display = 'none'; };

    if (openAuthModalBtn) openAuthModalBtn.onclick = openModal;
    if (heroAuthTrigger) heroAuthTrigger.onclick = openModal;
    if (closeAuthModal) closeAuthModal.onclick = closeModal;

    // Login Submission with Cold-Start Timeout Protection
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!loginError) return;

            loginError.style.display = 'none';
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Authenticate Console ↗';

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Authenticating...`;
            }

            // Warm-up alert timer if request takes longer than 3 seconds
            const slowServerTimer = setTimeout(() => {
                loginError.innerHTML = `<i class="fas fa-bolt"></i> Server is waking up from idle mode, please wait...`;
                loginError.style.display = 'block';
                loginError.style.color = '#F59E0B'; // Amber notice
            }, 3000);

            try {
                const res = await fetch(`${CONFIG.API_BASE_URL}/api/event-hq/client/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: loginEmail.value, password: loginPass.value })
                });

                clearTimeout(slowServerTimer);
                const result = await res.json();

                if (result.success) {
                    localStorage.setItem('event_hq_token', result.token);
                    loginForm.reset();
                    closeModal();
                    updateViewState();
                } else {
                    loginError.textContent = `⚠️ ${result.message}`;
                    loginError.style.color = '#EF4444'; // Red error
                    loginError.style.display = 'block';
                }
            } catch (err) {
                clearTimeout(slowServerTimer);
                loginError.textContent = '⚠️ Authentication server connection fault.';
                loginError.style.color = '#EF4444';
                loginError.style.display = 'block';
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                }
            }
        });
    }

    // Logout Action
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            localStorage.removeItem('event_hq_token');
            updateViewState();
        };
    }

    // Load Dashboard Data
    async function loadDashboardData() {
        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/api/event-hq/client/dashboard-stats`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const result = await res.json();

            if (!result.success) {
                localStorage.removeItem('event_hq_token');
                updateViewState();
                return;
            }

            const { event, summary, guests } = result.data;
            currentEventSlug = event.slug;

            if (displayCoupleNames) displayCoupleNames.textContent = `${event.venueName || 'Event'} Console`;

            if (statTotalLogged) statTotalLogged.textContent = summary.totalGuestsLogged || '0';
            if (statAttending) statAttending.textContent = summary.attendingCount || '0';
            if (statDeclined) statDeclined.textContent = summary.declinedCount || '0';
            if (statHeadcount) statHeadcount.textContent = summary.totalHeadcount || '0';

            renderGuestTable(guests);
        } catch (err) {
            console.error('Failed to load portal stats:', err);
        }
    }

    // Render Table
    function renderGuestTable(guests) {
        if (!guestTableBody) return;
        if (!guests || guests.length === 0) {
            guestTableBody.innerHTML = `<tr><td colspan="7" class="empty-state">No guests registered yet. Click "Add New Guest" above to begin.</td></tr>`;
            return;
        }

        const baseUrl = window.location.origin;

        guestTableBody.innerHTML = guests.map(g => {
            const inviteUrl = `${baseUrl}/event-hq-events/?event=${currentEventSlug}&token=${g.accessToken}`;

            return `
                <tr>
                    <td><strong>${escapeHTML(g.guestName)}</strong></td>
                    <td><span class="badge ${g.category}">${g.category}</span></td>
                    <td><span class="badge ${g.rsvpStatus}">${g.rsvpStatus}</span></td>
                    <td>${g.plusOneAllowed ? `Yes (+${g.plusOneCount || 1})` : 'No'}</td>
                    <td>${escapeHTML(g.dietaryRestrictions) || '—'}</td>
                    <td>
                        <button class="copy-btn" onclick="copyLink('${inviteUrl}')"><i class="far fa-copy"></i> Copy Link</button>
                    </td>
                    <td>
                        <button class="action-delete-btn" onclick="deleteGuest('${g._id}')" title="Delete Guest"><i class="fas fa-trash-alt"></i></button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Modal Control for Add Guest
    if (openAddGuestModal) openAddGuestModal.onclick = () => { if (addGuestModal) addGuestModal.style.display = 'flex'; };
    if (closeAddGuestModal) closeAddGuestModal.onclick = () => { if (addGuestModal) addGuestModal.style.display = 'none'; };

    if (addGuestForm) {
        addGuestForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const guestName = document.getElementById('guestNameInput').value.trim();
            const email = document.getElementById('guestEmailInput').value.trim();
            const category = document.getElementById('guestCategorySelect').value;
            const plusOneAllowed = document.getElementById('plusOneAllowedCheck').checked;

            const submitBtn = addGuestForm.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;

            try {
                const res = await fetch(`${CONFIG.API_BASE_URL}/api/event-hq/client/add-guest`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${getToken()}`
                    },
                    body: JSON.stringify({ guestName, email, category, plusOneAllowed })
                });

                const result = await res.json();
                if (result.success) {
                    addGuestForm.reset();
                    if (addGuestModal) addGuestModal.style.display = 'none';
                    loadDashboardData();
                } else {
                    alert(`⚠️ Failed to add guest: ${result.message}`);
                }
            } catch (err) { 
                alert('⚠️ Error processing request.'); 
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }

    // Global Action Wrappers
    window.copyLink = (url) => {
        navigator.clipboard.writeText(url);
        alert('📋 Personal invitation link copied to clipboard!');
    };

    window.deleteGuest = async (id) => {
        if (!confirm('Purge this guest record permanently?')) return;
        await fetch(`${CONFIG.API_BASE_URL}/api/event-hq/client/delete-guest/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        loadDashboardData();
    };

    function escapeHTML(str) {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, t => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[t] || t));
    }

    // Initial state check
    updateViewState();
});