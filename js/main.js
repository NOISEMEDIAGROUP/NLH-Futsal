/* ===================================
   HAWKS FUTSAL - Main JavaScript
   =================================== */

const API_BASE = '/api';

// -------------------------------------------------------
// Mobile Navigation Toggle
// -------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');

  if (toggle && links) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('open');
      links.classList.toggle('open');
    });

    links.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        toggle.classList.remove('open');
        links.classList.remove('open');
      });
    });
  }

  // -------------------------------------------------------
  // Timetable page: load availability for all sessions
  // -------------------------------------------------------
  if (document.getElementById('timetableBody')) {
    loadTimetableAvailability();
  }

  // -------------------------------------------------------
  // Booking page
  // -------------------------------------------------------
  const sessionSelect = document.getElementById('session');
  if (sessionSelect) {
    // Handle success/cancel returns from Stripe
    const params = new URLSearchParams(window.location.search);

    if (params.get('success') === 'true') {
      showBookingMessage('success', 'Booking confirmed! Check your email for a confirmation with all the details.');
    }

    if (params.get('cancelled') === 'true') {
      showBookingMessage('cancelled', 'Payment was cancelled. Your spot has not been booked. You can try again below.');
    }

    // Pre-select session from URL param
    const preselected = params.get('session');
    if (preselected) {
      sessionSelect.value = preselected;
      loadSessionAvailability(preselected);
    }

    // Update sidebar + check availability when session changes
    sessionSelect.addEventListener('change', (e) => {
      loadSessionAvailability(e.target.value);
    });
  }

  // -------------------------------------------------------
  // Booking Form Submission
  // -------------------------------------------------------
  const form = document.getElementById('bookingForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const session = document.getElementById('session').value;
      if (!session) {
        alert('Please select a session.');
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Checking availability...';
      submitBtn.disabled = true;

      try {
        const response = await fetch(`${API_BASE}/create-checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session: session,
            playerName: document.getElementById('playerName').value,
            playerDob: document.getElementById('playerDob').value,
            parentName: document.getElementById('parentName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            medical: document.getElementById('medical').value,
            emailConsent: document.querySelector('input[name="email_consent"]:checked')?.value || 'no',
            photoConsent: document.querySelector('input[name="photo_consent"]:checked')?.value || 'no',
          }),
        });

        const data = await response.json();

        if (response.status === 409) {
          // Session is full
          alert(data.message || 'This session is now full.');
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
          return;
        }

        if (!response.ok) {
          throw new Error(data.error || 'Something went wrong');
        }

        // Redirect to Stripe Checkout
        window.location.href = data.url;

      } catch (error) {
        console.error('Checkout error:', error);
        alert('Something went wrong. Please try again or contact us directly.');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }
});


// -------------------------------------------------------
// Load availability for a single session (booking page)
// -------------------------------------------------------
async function loadSessionAvailability(sessionKey) {
  const summarySession = document.getElementById('summarySession');
  const summaryTime = document.getElementById('summaryTime');
  const summaryPrice = document.getElementById('summaryPrice');
  const summarySpots = document.getElementById('summarySpots');
  const submitBtn = document.querySelector('#bookingForm button[type="submit"]');

  if (!sessionKey) {
    if (summarySession) summarySession.textContent = '--';
    if (summaryTime) summaryTime.textContent = '--';
    if (summaryPrice) summaryPrice.textContent = '--';
    if (summarySpots) summarySpots.textContent = '--';
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/check-availability?session=${sessionKey}`);
    const data = await res.json();

    if (summarySession) summarySession.textContent = data.label;
    if (summaryTime) summaryTime.textContent = data.time;
    if (summaryPrice) summaryPrice.textContent = data.price.formatted;
    if (summarySpots) {
      if (data.available) {
        summarySpots.textContent = `${data.spotsLeft} spots left`;
        summarySpots.style.color = data.spotsLeft <= 3 ? '#e53e3e' : '#38a169';
      } else {
        summarySpots.textContent = 'FULL';
        summarySpots.style.color = '#e53e3e';
      }
    }

    if (submitBtn) {
      submitBtn.disabled = !data.available;
      submitBtn.textContent = data.available ? `Pay ${data.price.formatted}` : 'Session Full';
    }

  } catch (err) {
    console.error('Failed to load availability:', err);
  }
}


// -------------------------------------------------------
// Load availability for all sessions (timetable page)
// -------------------------------------------------------
async function loadTimetableAvailability() {
  try {
    const res = await fetch(`${API_BASE}/check-availability`);
    const data = await res.json();

    // Update price display
    const priceDisplay = document.getElementById('currentPrice');
    if (priceDisplay && data.price) {
      priceDisplay.textContent = `${data.price.formatted} - ${data.price.label}`;
    }

    // Update each session row
    for (const [key, session] of Object.entries(data.sessions)) {
      const badge = document.getElementById(`avail-${key}`);
      if (badge) {
        if (session.available) {
          badge.textContent = `${session.spotsLeft} spots`;
          badge.className = 'avail-badge avail-badge--open';
          if (session.spotsLeft <= 3) {
            badge.className = 'avail-badge avail-badge--low';
          }
        } else {
          badge.textContent = 'FULL';
          badge.className = 'avail-badge avail-badge--full';
        }
      }

      // Disable book button if full
      const bookBtn = document.getElementById(`book-${key}`);
      if (bookBtn && !session.available) {
        bookBtn.textContent = 'Full';
        bookBtn.className = 'btn btn--disabled';
        bookBtn.removeAttribute('href');
      }
    }
  } catch (err) {
    console.error('Failed to load timetable availability:', err);
  }
}


// -------------------------------------------------------
// Show booking status message
// -------------------------------------------------------
function showBookingMessage(type, message) {
  const form = document.getElementById('bookingForm');
  if (!form) return;

  const banner = document.createElement('div');
  banner.className = `booking-banner booking-banner--${type}`;
  banner.innerHTML = `<p>${message}</p>`;
  form.parentNode.insertBefore(banner, form);

  if (type === 'success') {
    form.style.display = 'none';
  }
}
