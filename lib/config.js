// ===================================================
// HAWKS FUTSAL - Central Configuration
// Update this file each term with new dates & prices.
// ===================================================

const config = {
  // -------------------------------------------------
  // Current term
  // -------------------------------------------------
  term: {
    name: 'Autumn 2026',
    start: '2026-09-07',
    end: '2026-12-14',
    totalWeeks: 14,
  },

  // -------------------------------------------------
  // Pricing tiers
  // Prices in pence (e.g. 14000 = £140.00).
  // The system checks today's date and uses the first
  // tier whose "before" date hasn't passed yet.
  // -------------------------------------------------
  pricing: [
    { label: 'Full Term (14 weeks)', before: '2026-09-21', amountPence: 14000 },
    { label: 'Mid-Term (10 weeks)',  before: '2026-10-26', amountPence: 10000 },
    { label: 'Late-Term (5 weeks)',  before: '2026-12-14', amountPence:  5000 },
  ],

  // -------------------------------------------------
  // Sessions
  // maxCapacity: how many players per session.
  // -------------------------------------------------
  sessions: {
    'y1-y3':  { label: 'Y1 - Y3',  day: 'Monday', time: '6:00 - 7:00 PM', location: 'Aldenham', maxCapacity: 20 },
    'y4-y5':  { label: 'Y4 - Y5',  day: 'Monday', time: '6:00 - 7:00 PM', location: 'Aldenham', maxCapacity: 20 },
    'y6-y7':  { label: 'Y6 - Y7',  day: 'Monday', time: '7:00 - 8:00 PM', location: 'Aldenham', maxCapacity: 20 },
    'y8':     { label: 'Y8',       day: 'Monday', time: '7:00 - 8:00 PM', location: 'Aldenham', maxCapacity: 20 },
    'y9-y10': { label: 'Y9 - Y10', day: 'Monday', time: '8:00 - 9:00 PM', location: 'Aldenham', maxCapacity: 20 },
  },

  // -------------------------------------------------
  // Coach notification emails
  // Add every coach who should receive booking alerts.
  // -------------------------------------------------
  coachEmails: [
    // 'tamas@example.com',
    // 'laurence@example.com',
    // 'jordan@example.com',
  ],

  // -------------------------------------------------
  // Sender email (must be verified in Resend)
  // -------------------------------------------------
  fromEmail: 'bookings@northlondonhawks.co.uk',
  fromName: 'NLH Futsal Academy',
};

// -------------------------------------------------
// Helper: get current price tier based on today
// -------------------------------------------------
function getCurrentPrice() {
  const today = new Date().toISOString().split('T')[0];
  for (const tier of config.pricing) {
    if (today < tier.before) {
      return tier;
    }
  }
  // Past all tiers -- return the last one
  return config.pricing[config.pricing.length - 1];
}

module.exports = { config, getCurrentPrice };
