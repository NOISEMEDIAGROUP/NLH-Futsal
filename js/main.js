/* ===================================
   HAWKS FUTSAL - Main JavaScript
   =================================== */

// -------------------------------------------------------
// CONFIG: Replace these with your actual Stripe Payment Links
// Create products in your Stripe Dashboard, generate
// Payment Links, and paste the URLs here.
// -------------------------------------------------------
const STRIPE_PAYMENT_LINKS = {
  'y1-y3': 'https://buy.stripe.com/YOUR_LINK_Y1_Y3',
  'y4-y5': 'https://buy.stripe.com/YOUR_LINK_Y4_Y5',
  'y6-y7': 'https://buy.stripe.com/YOUR_LINK_Y6_Y7',
  'y8':    'https://buy.stripe.com/YOUR_LINK_Y8',
  'y9-y10':'https://buy.stripe.com/YOUR_LINK_Y9_Y10',
};

// -------------------------------------------------------
// CONFIG: Replace with your Formspree form ID
// Sign up free at https://formspree.io and create a form.
// -------------------------------------------------------
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/YOUR_FORM_ID';

// -------------------------------------------------------
// Session display data
// -------------------------------------------------------
const SESSION_INFO = {
  'y1-y3':  { label: 'Y1 -- Y3',   time: '6:00 -- 7:00 PM' },
  'y4-y5':  { label: 'Y4 -- Y5',   time: '6:00 -- 7:00 PM' },
  'y6-y7':  { label: 'Y6 -- Y7',   time: '7:00 -- 8:00 PM' },
  'y8':     { label: 'Y8',         time: '7:00 -- 8:00 PM' },
  'y9-y10': { label: 'Y9 -- Y10',  time: '8:00 -- 9:00 PM' },
};


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

    // Close menu when a link is clicked
    links.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        toggle.classList.remove('open');
        links.classList.remove('open');
      });
    });
  }

  // -------------------------------------------------------
  // Booking page: Pre-select session from URL parameter
  // -------------------------------------------------------
  const sessionSelect = document.getElementById('session');
  if (sessionSelect) {
    const params = new URLSearchParams(window.location.search);
    const preselected = params.get('session');
    if (preselected && SESSION_INFO[preselected]) {
      sessionSelect.value = preselected;
      updateBookingSummary(preselected);
    }

    // Update sidebar summary when session changes
    sessionSelect.addEventListener('change', (e) => {
      updateBookingSummary(e.target.value);
    });
  }

  // -------------------------------------------------------
  // Booking Form Submission
  // -------------------------------------------------------
  const form = document.getElementById('bookingForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Validate required fields
      if (!form.checkValidity()) {
        // Show native validation messages
        form.reportValidity();
        return;
      }

      const session = document.getElementById('session').value;
      if (!session) {
        alert('Please select a session.');
        return;
      }

      // Collect form data
      const formData = new FormData(form);
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Processing...';
      submitBtn.disabled = true;

      try {
        // Submit registration details to Formspree
        const response = await fetch(FORMSPREE_ENDPOINT, {
          method: 'POST',
          body: formData,
          headers: { 'Accept': 'application/json' },
        });

        if (!response.ok) {
          throw new Error('Form submission failed');
        }

        // Redirect to Stripe Payment Link
        const paymentLink = STRIPE_PAYMENT_LINKS[session];
        if (paymentLink && !paymentLink.includes('YOUR_LINK')) {
          window.location.href = paymentLink;
        } else {
          // Fallback: show success if Stripe links aren't configured yet
          alert('Registration submitted successfully! Payment links are being set up -- the club will be in touch with payment details.');
          form.reset();
          updateBookingSummary('');
        }
      } catch (error) {
        console.error('Submission error:', error);
        alert('Something went wrong. Please try again or contact us directly.');
      } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }
});


// -------------------------------------------------------
// Update booking summary sidebar
// -------------------------------------------------------
function updateBookingSummary(sessionKey) {
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
