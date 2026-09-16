document.addEventListener('DOMContentLoaded', () => {
    const authOverlay = document.getElementById('clientAuthOverlay');
    const loginForm = document.getElementById('clientLoginForm');
    const loginEmail = document.getElementById('loginEmail');
    const loginPass = document.getElementById('loginPass');
    const loginError = document.getElementById('loginError');
    const logoutBtn = document.getElementById('logoutBtn');

    const displayCoupleNames = document.getElementById('displayCoupleNames');
    const guestTableBody = document.getElementById('guestTableBody');

    const statTotalLogged = document.getElementById('statTotalLogged');
    const statAttending = document.getElementById('statAttending');
    const statDeclined = document.getElementById('statDeclined');
    const statHeadcount = document.getElementById('statHeadcount');

    const addGuestModal = document.getElementById('addGuestModal');
    const openAddGuestModal = document.getElementById('openAddGuestModal');
    const closeAddGuestModal = document.getElementById('closeAddGuestModal');
    const addGuestForm = document.getElementById('addGuestForm');

    let currentEventSlug = '';

    const getToken = () => localStorage.getItem('event_hq_token');

    if (getToken()) {
        if (authOverlay) authOverlay.remove();
        loadDashboardData();
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            loginError.style.display = 'none';

            try {
                const res = await fetch(`${CONFIG.API_BASE_URL}/api/event-hq/client/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: loginEmail.value, password: loginPass.value })
                });
                const result = await res.json();

                if (result.success) {
                    localStorage.setItem('event_hq_token', result.token);
                    window.location.reload();
                } else {
                    loginError.textContent = `❌ ${result.message}`;
                    loginError.style.display = 'block';
                }
            } catch (err) {
                loginError.textContent = '❌ Authentication server fault';
                loginError.style.display = 'block';
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.onclick = () => {
            localStorage.removeItem('event_hq_token');
            window.location.reload();
        };
    }

    async function loadDashboardData() {
        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/api/event-hq/client/dashboard-stats`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const result = await res.json();

            if (!result.success) return;

            const { event, summary, guests } = result.data;
            currentEventSlug = event.slug;

            if (displayCoupleNames) displayCoupleNames.textContent = `${event.venueName} Console`;

            if (statTotalLogged) statTotalLogged.textContent = summary.totalGuestsLogged;
            if (statAttending) statAttending.textContent = summary.attendingCount;
            if (statDeclined) statDeclined.textContent = summary.declinedCount;
            if (statHeadcount) statHeadcount.textContent = summary.totalHeadcount;

            renderGuestTable(guests);
        } catch (err) {
            console.error('Failed to load portal stats:', err);
        }
    }

    function renderGuestTable(guests) {
        if (!guestTableBody) return;
        if (!guests || guests.length === 0) {
            guestTableBody.innerHTML = `<tr><td colspan="7" class="empty-state">No guests registered yet. Click "Add New Guest" to begin.</td></tr>`;
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
                    <td>${g.plusOneAllowed ? `Yes (+${g.plusOneCount})` : 'No'}</td>
                    <td>${escapeHTML(g.dietaryRestrictions) || '—'}</td>
                    <td>
                        <button class="copy-btn" onclick="copyLink('${inviteUrl}')">📋 Copy Link</button>
                    </td>
                    <td>
                        <button class="close-btn" onclick="deleteGuest('${g._id}')" style="color:var(--accent-red)">🗑️</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    if (openAddGuestModal) openAddGuestModal.onclick = () => addGuestModal.style.display = 'flex';
    if (closeAddGuestModal) closeAddGuestModal.onclick = () => addGuestModal.style.display = 'none';

    if (addGuestForm) {
        addGuestForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const guestName = document.getElementById('guestNameInput').value.trim();
            const email = document.getElementById('guestEmailInput').value.trim();
            const category = document.getElementById('guestCategorySelect').value;
            const plusOneAllowed = document.getElementById('plusOneAllowedCheck').checked;

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
                    addGuestModal.style.display = 'none';
                    loadDashboardData();
                } else {
                    alert(`❌ Failed to add guest: ${result.message}`);
                }
            } catch (err) { alert('❌ Error processing request'); }
        });
    }

    window.copyLink = (url) => {
        navigator.clipboard.writeText(url);
        alert('📋 Personal invitation link copied to clipboard!');
    };

    window.deleteGuest = async (id) => {
        if (!confirm('Purge this guest record?')) return;
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
});