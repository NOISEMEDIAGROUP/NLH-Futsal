// ===================================================
// HAWKS FUTSAL - Central Configuration
// Update this file when session details change.
// ===================================================

const config = {
  // -------------------------------------------------
  // Current term
  // -------------------------------------------------
  term: {
    name: 'Autumn 2026',
    start: '2026-09-07',
    end: '2026-12-14',
  },

  // -------------------------------------------------
  // Sessions
  // Three tiers: Foundation, Development, Performance
  // -------------------------------------------------
  sessions: {
    'foundation': {
      label: 'Foundation',
      day: 'Saturday',
      time: '9:00 - 10:00 AM',
      location: 'TBC',
      maxCapacity: 20,
      ageRange: '5 - 7',
      price: '\u00a38 / session',
    },
    'development': {
      label: 'Development',
      day: 'Saturday',
      time: '10:00 - 11:00 AM',
      location: 'TBC',
      maxCapacity: 20,
      ageRange: '8 - 11',
      price: '\u00a310 / session',
    },
    'performance': {
      label: 'Performance',
      day: 'Saturday',
      time: '11:00 AM - 12:30 PM',
      location: 'TBC',
      maxCapacity: 20,
      ageRange: '12 - 16',
      price: '\u00a312 / session',
    },
  },

  // -------------------------------------------------
  // Coach notification emails
  // Add every coach who should receive enquiry alerts.
  // -------------------------------------------------
  coachEmails: [
    // 'jordan@example.com',
    // 'tamas@example.com',
  ],

  // -------------------------------------------------
  // Sender email (must be verified in Resend)
  // Update once HawksFutsal.com domain is live.
  // -------------------------------------------------
  fromEmail: 'bookings@northlondonhawks.co.uk',
  fromName: 'Hawks Futsal',
};

module.exports = { config };
