/* ===================================
   HAWKS FUTSAL - Main JavaScript
   =================================== */

const API_BASE = '/api';

const SESSION_INFO = {
  'foundation':  { label: 'Foundation',  time: 'Saturdays, 9:00 - 10:00 AM',   ages: '5 - 7',   price: '\u00a38 / session' },
  'development': { label: 'Development', time: 'Saturdays, 10:00 - 11:00 AM',  ages: '8 - 11',  price: '\u00a310 / session' },
  'performance': { label: 'Performance', time: 'Saturdays, 11:00 AM - 12:30 PM', ages: '12 - 16', price: '\u00a312 / session' },
};

document.addEventListener('DOMContentLoaded', () => {

  // --- Scroll reveal ---
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    reveals.forEach(el => observer.observe(el));
  }

  // --- Mobile nav toggle ---
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

  // --- Enquiry modal ---
  const modal = document.getElementById('enquiryModal');
  const modalClose = document.getElementById('modalClose');
  const sessionKeyInput = document.getElementById('sessionKey');
  const modalSessionName = document.getElementById('modalSessionName');
  const modalSessionDetail = document.getElementById('modalSessionDetail');
  const modalSessionInfo = document.getElementById('modalSessionInfo');

  function openModal(sessionKey) {
    if (!modal) return;

    if (sessionKey && SESSION_INFO[sessionKey]) {
      const info = SESSION_INFO[sessionKey];
      sessionKeyInput.value = sessionKey;
      modalSessionName.textContent = info.label;
      modalSessionDetail.textContent = info.time + '  |  Ages ' + info.ages;
      modalSessionInfo.style.display = 'flex';
    } else {
      sessionKeyInput.value = '';
      modalSessionInfo.style.display = 'none';
    }

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  // Session card enquire buttons
  document.querySelectorAll('[data-session]').forEach(btn => {
    btn.addEventListener('click', () => {
      openModal(btn.dataset.session);
    });
  });

  // General enquire button
  const generalBtn = document.getElementById('generalEnquireBtn');
  if (generalBtn) {
    generalBtn.addEventListener('click', () => openModal(null));
  }

  // Nav enquire button on sessions page
  const enquireNavBtn = document.getElementById('enquireNavBtn');
  if (enquireNavBtn) {
    enquireNavBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(null);
    });
  }

  // Close modal
  if (modalClose) {
    modalClose.addEventListener('click', closeModal);
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // Open modal from URL param (e.g. ?session=foundation)
  if (modal) {
    const params = new URLSearchParams(window.location.search);

    if (params.get('success') === 'true') {
      showSuccessMessage();
    }

    const preselected = params.get('session');
    if (preselected && SESSION_INFO[preselected]) {
      openModal(preselected);
    }
  }

  // --- Enquiry form submission ---
  const form = document.getElementById('enquiryForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const session = sessionKeyInput.value;
      if (!session) {
        alert('Please select a session before submitting.');
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Sending...';
      submitBtn.disabled = true;

      try {
        const response = await fetch(API_BASE + '/enquire', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session: session,
            playerName: document.getElementById('playerName').value,
            playerDob: document.getElementById('playerDob').value,
            parentName: document.getElementById('parentName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            medical: document.getElementById('lookingFor')?.value || '',
            emailConsent: 'no',
            photoConsent: 'no',
          }),
        });

        if (!response.ok) {
          throw new Error('Submission failed');
        }

        closeModal();
        window.location.href = 'sessions.html?success=true';

      } catch (error) {
        console.error('Enquiry error:', error);
        alert('Something went wrong. Please try again or contact us directly.');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }
});


function showSuccessMessage() {
  const sessionsGrid = document.querySelector('.sessions-grid');
  if (!sessionsGrid) return;

  const banner = document.createElement('div');
  banner.className = 'booking-banner booking-banner--success';
  banner.innerHTML = '<p>Thanks for your enquiry! Our coaches will review your details and be in touch shortly.</p>';
  sessionsGrid.parentNode.insertBefore(banner, sessionsGrid);
}
