/* ===================================
   HAWKS FUTSAL - Main JavaScript
   =================================== */

const API_BASE = '/api';

const SESSION_INFO = {
  'y1-y3':  { label: 'Y1 - Y3',   time: '6:00 - 7:00 PM' },
  'y4-y5':  { label: 'Y4 - Y5',   time: '6:00 - 7:00 PM' },
  'y6-y7':  { label: 'Y6 - Y7',   time: '7:00 - 8:00 PM' },
  'y8':     { label: 'Y8',        time: '7:00 - 8:00 PM' },
  'y9-y10': { label: 'Y9 - Y10',  time: '8:00 - 9:00 PM' },
};

document.addEventListener('DOMContentLoaded', () => {
  // Mobile nav toggle
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

  // Booking page: pre-select session from URL param
  const sessionSelect = document.getElementById('session');
  if (sessionSelect) {
    const params = new URLSearchParams(window.location.search);

    if (params.get('success') === 'true') {
      showMessage('success', "Thanks for your enquiry! We've sent you a confirmation email. Our coaches will review your details and be in touch shortly.");
    }

    const preselected = params.get('session');
    if (preselected && SESSION_INFO[preselected]) {
      sessionSelect.value = preselected;
      updateSummary(preselected);
    }

    sessionSelect.addEventListener('change', (e) => {
      updateSummary(e.target.value);
    });
  }

  // Enquiry form submission
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
      submitBtn.textContent = 'Sending...';
      submitBtn.disabled = true;

      try {
        const response = await fetch(`${API_BASE}/enquire`, {
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

        if (!response.ok) {
          throw new Error('Submission failed');
        }

        // Redirect to success state
        window.location.href = `book.html?success=true`;

      } catch (error) {
        console.error('Enquiry error:', error);
        alert('Something went wrong. Please try again or contact us directly.');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }
});


function updateSummary(sessionKey) {
  const summarySession = document.getElementById('summarySession');
  const summaryTime = document.getElementById('summaryTime');

  if (!summarySession || !summaryTime) return;

  if (sessionKey && SESSION_INFO[sessionKey]) {
    summarySession.textContent = SESSION_INFO[sessionKey].label;
    summaryTime.textContent = SESSION_INFO[sessionKey].time;
  } else {
    summarySession.textContent = '--';
    summaryTime.textContent = '--';
  }
}


function showMessage(type, message) {
  const form = document.getElementById('bookingForm');
  if (!form) return;

  const banner = document.createElement('div');
  banner.className = `booking-banner booking-banner--${type}`;
  banner.innerHTML = `<p>${message}</p>`;
  form.parentNode.insertBefore(banner, form);

  if (type === 'success') {
    form.style.display = 'none';
    // Also hide the sidebar
    const sidebar = document.querySelector('.booking-sidebar');
    if (sidebar) sidebar.style.display = 'none';
  }
}
