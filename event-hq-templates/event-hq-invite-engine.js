document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    const errorContainer = document.getElementById('errorContainer');
    const guestGreeting = document.getElementById('guestGreeting');
    const eventTitle = document.getElementById('eventTitle');
    const eventDate = document.getElementById('eventDate');
    const venueName = document.getElementById('venueName');
    const venueAddress = document.getElementById('venueAddress');
    const mapLink = document.getElementById('mapLink');
    const dressCode = document.getElementById('dressCode');
    
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
        showError('Invalid invitation link. Missing security token.');
        return;
    }

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/event-hq/invite/verify-token/${token}`);
        const result = await response.json();

        if (!result.success) {
            showError(result.message || 'Invitation token could not be verified.');
            return;
        }

        const { guestName, rsvpStatus, plusOneAllowed, plusOneCount, dietaryRestrictions, eventDetails, inviteContent } = result.data;

        // DYNAMICALLY INJECT GUEST NAME
        if (guestGreeting) {
            guestGreeting.textContent = `Dear ${guestName},`;
        }

        // Populate Event Details
        if (eventTitle) eventTitle.textContent = eventDetails.venueName ? `${eventDetails.venueName} Celebration` : 'Celebration of Love';
        if (eventDate) eventDate.textContent = new Date(eventDetails.eventDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        if (venueName) venueName.textContent = eventDetails.venueName;
        if (venueAddress) venueAddress.textContent = eventDetails.venueAddress;
        
        if (mapLink) {
            if (eventDetails.googleMapsUrl) {
                mapLink.href = eventDetails.googleMapsUrl;
                mapLink.style.display = 'inline-block';
            } else {
                mapLink.style.display = 'none';
            }
        }

        if (dressCode) dressCode.textContent = inviteContent.dressCode || 'Formal Attire';

        // Handle Entourage Specific Blocks
        if (inviteContent.isEntourage && entourageSection) {
            entourageSection.style.display = 'block';
            if (entourageCallTime) entourageCallTime.textContent = inviteContent.callTime || 'TBA';
            if (entourageNotes) entourageNotes.textContent = inviteContent.customNotes || 'Please arrive promptly for your scheduled briefing and photo session.';
        }

        // Pre-fill existing RSVP choices if any
        if (rsvpStatus && rsvpStatusSelect) {
            rsvpStatusSelect.value = rsvpStatus;
        }
        if (plusOneAllowed && plusOneGroup) {
            plusOneGroup.style.display = 'block';
            if (plusOneInput && plusOneCount !== undefined) plusOneInput.value = plusOneCount;
        }
        if (dietaryRestrictions && dietaryInput) {
            dietaryInput.value = dietaryRestrictions;
        }

        // Handle RSVP Form Submission
        if (rsvpForm) {
            rsvpForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                if (rsvpMessage) {
                    rsvpMessage.style.display = 'block';
                    rsvpMessage.style.color = '#00f0ff';
                    rsvpMessage.textContent = 'Transmitting response...';
                }

                try {
                    const rsvpRes = await fetch(`${CONFIG.API_BASE_URL}/api/event-hq/invite/rsvp/${token}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            rsvpStatus: rsvpStatusSelect.value,
                            plusOneCount: plusOneInput ? parseInt(plusOneInput.value) || 0 : 0,
                            dietaryRestrictions: dietaryInput ? dietaryInput.value.trim() : ''
                        })
                    });
                    const rsvpResult = await rsvpRes.json();

                    if (rsvpResult.success) {
                        if (rsvpMessage) {
                            rsvpMessage.style.color = '#00ff66';
                            rsvpMessage.textContent = '✨ RSVP response recorded successfully. Thank you!';
                        }
                    } else {
                        if (rsvpMessage) {
                            rsvpMessage.style.color = '#ff3366';
                            rsvpMessage.textContent = `Error: ${rsvpResult.message}`;
                        }
                    }
                } catch (err) {
                    if (rsvpMessage) {
                        rsvpMessage.style.color = '#ff3366';
                        rsvpMessage.textContent = 'Network error recording RSVP response.';
                    }
                }
            });
        }

    } catch (err) {
        showError('System error connecting to the invitation server.');
    }

    function showError(msg) {
        if (errorContainer) {
            errorContainer.textContent = msg;
            errorContainer.style.display = 'block';
        }
    }
});