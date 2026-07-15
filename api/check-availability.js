const { createClient } = require('@supabase/supabase-js');
const { config, getCurrentPrice } = require('../lib/config');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { session } = req.query;

  // If a specific session is requested, return its availability
  if (session) {
    const sessionConfig = config.sessions[session];
    if (!sessionConfig) {
      return res.status(400).json({ error: 'Invalid session' });
    }

    const { count, error } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('session_key', session)
      .eq('term', config.term.name);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to check availability' });
    }

    const spotsLeft = sessionConfig.maxCapacity - (count || 0);
    const price = getCurrentPrice();

    return res.status(200).json({
      session: session,
      label: sessionConfig.label,
      day: sessionConfig.day,
      time: sessionConfig.time,
      location: sessionConfig.location,
      maxCapacity: sessionConfig.maxCapacity,
      booked: count || 0,
      spotsLeft: Math.max(0, spotsLeft),
      available: spotsLeft > 0,
      price: {
        label: price.label,
        amount: price.amountPence,
        formatted: `£${(price.amountPence / 100).toFixed(2)}`,
      },
      term: config.term.name,
    });
  }

  // No session specified -- return all sessions
  const price = getCurrentPrice();
  const results = {};

  for (const [key, sessionConfig] of Object.entries(config.sessions)) {
    const { count, error } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('session_key', key)
      .eq('term', config.term.name);

    if (error) {
      console.error(`Supabase error for ${key}:`, error);
      continue;
    }

    const spotsLeft = sessionConfig.maxCapacity - (count || 0);

    results[key] = {
      label: sessionConfig.label,
      day: sessionConfig.day,
      time: sessionConfig.time,
      location: sessionConfig.location,
      spotsLeft: Math.max(0, spotsLeft),
      available: spotsLeft > 0,
    };
  }

  return res.status(200).json({
    sessions: results,
    price: {
      label: price.label,
      amount: price.amountPence,
      formatted: `£${(price.amountPence / 100).toFixed(2)}`,
    },
    term: config.term.name,
  });
};
