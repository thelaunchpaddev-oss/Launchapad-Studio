document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const eventSlug = urlParams.get('event');
    const token = urlParams.get('token');

    const errorContainer = document.getElementById('errorContainer');
    const guestGreeting = document.getElementById('guestGreeting');
    const eventTitle = document.getElementById('eventTitle');
    const eventDate = document.getElementById('eventDate');
    const venueName = document.getElementById('venueName');
    const venueAddress = document.getElementById('venueAddress');
    const mapLink = document.getElementById('mapLink');
    const dressCode = document.getElementById('dressCode');
    const timelineContainer = document.getElementById('timelineContainer');
    const entourageSection = document.getElementById('entourageSection');
    const entourageCallTime = document.getElementById('entourageCallTime');
    const entourageNotes = document.getElementById('entourageNotes');
    
    const rsvpForm = document.getElementById('rsvpForm');
    const rsvpStatusSelect = document.getElementById('rsvpStatusSelect');
    const plusOneGroup = document.getElementById('plusOneGroup');
    const plusOneInput = document.getElementById('plusOneInput');
    const dietaryInput = document.getElementById('dietaryInput');
    const rsvpMessage = document.getElementById('rsvpMessage');

    if (!token || !eventSlug) {
        showError('Missing invitation parameters (slug or token). Please check your personalized link.');
        return;
    }

    try {
        // Fetch guest profile and event details using event slug and token
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/event-hq/public/verify-invite?event=${eventSlug}&token=${token}`);
        const result = await response.json();

        if (!result.success) {
            showError(result.message || 'Invalid or expired invitation token.');
            return;
        }

        const { event, guest } = result.data;

        // --- DYNAMIC TEMPLATE CONFIGURATION ---
        // Determines whether to load Regular config or Entourage config based on client's design selection
        const isEntourageMode = (guest.selectedTemplate === 'entourage' || guest.category === 'entourage');
        const activeConfig = isEntourageMode ? event.entourageConfig : event.generalConfig;

        if (guestGreeting) guestGreeting.textContent = `Dear ${guest.guestName},`;
        if (eventTitle) eventTitle.textContent = isEntourageMode ? "VIP ENTOURAGE INVITATION" : (event.venueName ? `${event.venueName} Celebration` : "CELEBRATION OF LOVE");
        
        if (eventDate) {
            eventDate.textContent = new Date(event.eventDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        }
        if (venueName) venueName.textContent = event.venueName;
        if (venueAddress) venueAddress.textContent = event.venueAddress;
        if (mapLink && event.googleMapsUrl) mapLink.href = event.googleMapsUrl;
        if (dressCode) dressCode.textContent = activeConfig?.dressCode || (isEntourageMode ? 'Custom Entourage Attire' : 'Formal Attire');

        if (timelineContainer && activeConfig?.scheduleTimeline) {
            timelineContainer.innerHTML = activeConfig.scheduleTimeline.map(item => `
                <div class="timeline-item">
                    <span class="time">${escapeHTML(item.time)}</span>
                    <span class="activity">${escapeHTML(item.activity)}</span>
                </div>
            `).join('');
        }

        // ⚡ CONDITIONAL ENTOURAGE RENDERING
        if (isEntourageMode && entourageSection) {
            entourageSection.style.display = 'block';
            if (entourageCallTime) entourageCallTime.textContent = event.entourageConfig?.callTime || 'Check entourage schedule';
            if (entourageNotes) entourageNotes.textContent = event.entourageConfig?.customNotes || `Prep Location: ${event.entourageConfig?.prepLocation || 'See coordinator'}`;
        }

        if (rsvpStatusSelect) rsvpStatusSelect.value = guest.rsvpStatus || 'pending';
        if (guest.plusOneAllowed && plusOneGroup) {
            plusOneGroup.style.display = 'block';
            if (plusOneInput) plusOneInput.value = guest.plusOneCount || 0;
        }
        if (dietaryInput) dietaryInput.value = guest.dietaryRestrictions || '';

        if (rsvpForm) {
            rsvpForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const payload = {
                    rsvpStatus: rsvpStatusSelect.value,
                    plusOneCount: guest.plusOneAllowed ? parseInt(plusOneInput.value, 10) || 0 : 0,
                    dietaryRestrictions: dietaryInput.value.trim()
                };

                try {
                    // Uses your existing token-based RSVP endpoint
                    const rsvpRes = await fetch(`${CONFIG.API_BASE_URL}/api/event-hq/invite/rsvp/${token}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    const rsvpResult = await rsvpRes.json();

                    if (rsvpResult.success) {
                        if (rsvpMessage) {
                            rsvpMessage.style.color = '#00ff66';
                            rsvpMessage.textContent = '🟢 RSVP updated successfully! Thank you.';
                            rsvpMessage.style.display = 'block';
                        }
                    } else {
                        throw new Error(rsvpResult.message);
                    }
                } catch (err) {
                    if (rsvpMessage) {
                        rsvpMessage.style.color = '#ff3366';
                        rsvpMessage.textContent = `❌ ${err.message || 'Failed to submit RSVP.'}`;
                        rsvpMessage.style.display = 'block';
                    }
                }
            });
        }

    } catch (err) {
        showError('Network transmission fault verified while retrieving invitation payload.');
    }

    function showError(msg) {
        const errorCard = document.getElementById('errorContainer');
        if (errorCard) {
            errorCard.textContent = `⚠️ ACCESS ERROR: ${msg}`;
            errorCard.style.display = 'block';
        }
    }

    function escapeHTML(str) {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, t => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[t] || t));
    }
});