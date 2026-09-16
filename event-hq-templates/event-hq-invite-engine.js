document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

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

    if (!token) {
        showError('Missing invitation token. Please check your personalized link.');
        return;
    }

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/event-hq/invite/verify-token/${token}`);
        const result = await response.json();

        if (!result.success) {
            showError(result.message || 'Invalid or expired invitation token.');
            return;
        }

        const { guestName, rsvpStatus, plusOneAllowed, plusOneCount, dietaryRestrictions, eventDetails, inviteContent } = result.data;

        if (guestGreeting) guestGreeting.textContent = `Dear ${guestName},`;
        if (eventTitle) eventTitle.textContent = `${eventDetails.slug.replace(/-/g, ' ').toUpperCase()}`;
        if (eventDate) eventDate.textContent = new Date(eventDetails.eventDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        if (venueName) venueName.textContent = eventDetails.venueName;
        if (venueAddress) venueAddress.textContent = eventDetails.venueAddress;
        if (mapLink && eventDetails.googleMapsUrl) mapLink.href = eventDetails.googleMapsUrl;
        if (dressCode) dressCode.textContent = inviteContent.dressCode || 'Formal Attire';

        if (timelineContainer && inviteContent.scheduleTimeline) {
            timelineContainer.innerHTML = inviteContent.scheduleTimeline.map(item => `
                <div class="timeline-item">
                    <span class="time">${escapeHTML(item.time)}</span>
                    <span class="activity">${escapeHTML(item.activity)}</span>
                </div>
            `).join('');
        }

        // ⚡ CONDITIONAL ENTOURAGE RENDERING
        if (inviteContent.isEntourage && entourageSection) {
            entourageSection.style.display = 'block';
            if (entourageCallTime) entourageCallTime.textContent = inviteContent.callTime || 'Check entourage schedule';
            if (entourageNotes) entourageNotes.textContent = inviteContent.customNotes || '';
        }

        if (rsvpStatusSelect) rsvpStatusSelect.value = rsvpStatus || 'pending';
        if (plusOneAllowed && plusOneGroup) {
            plusOneGroup.style.display = 'block';
            if (plusOneInput) plusOneInput.value = plusOneCount || 0;
        }
        if (dietaryInput) dietaryInput.value = dietaryRestrictions || '';

        if (rsvpForm) {
            rsvpForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const payload = {
                    rsvpStatus: rsvpStatusSelect.value,
                    plusOneCount: plusOneAllowed ? parseInt(plusOneInput.value, 10) || 0 : 0,
                    dietaryRestrictions: dietaryInput.value.trim()
                };

                try {
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