const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');
const { config, getCurrentPrice } = require('../lib/config');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    session,
    playerName,
    playerDob,
    parentName,
    email,
    phone,
    medical,
    emailConsent,
    photoConsent,
  } = req.body;

  // Validate required fields
  if (!session || !playerName || !playerDob || !parentName || !email || !phone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const sessionConfig = config.sessions[session];
  if (!sessionConfig) {
    return res.status(400).json({ error: 'Invalid session' });
  }

  // Check capacity
  const { count, error: countError } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('session_key', session)
    .eq('term', config.term.name);

  if (countError) {
    console.error('Supabase error:', countError);
    return res.status(500).json({ error: 'Failed to check availability' });
  }

  const spotsLeft = sessionConfig.maxCapacity - (count || 0);
  if (spotsLeft <= 0) {
    return res.status(409).json({
      error: 'Session is full',
      message: `Sorry, the ${sessionConfig.label} session is now full for ${config.term.name}. Please contact us for waitlist options.`,
    });
  }

  // Get dynamic price
  const price = getCurrentPrice();

  // Create Stripe Checkout Session
  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: `NLH Futsal - ${sessionConfig.label} (${config.term.name})`,
              description: `${sessionConfig.day} ${sessionConfig.time} at ${sessionConfig.location} - ${price.label}`,
            },
            unit_amount: price.amountPence,
          },
          quantity: 1,
        },
      ],
      metadata: {
        session_key: session,
        session_label: sessionConfig.label,
        term: config.term.name,
        player_name: playerName,
        player_dob: playerDob,
        parent_name: parentName,
        email: email,
        phone: phone,
        medical: medical || '',
        email_consent: emailConsent || 'no',
        photo_consent: photoConsent || 'no',
        price_label: price.label,
      },
      success_url: `${req.headers.origin || process.env.SITE_URL}/book.html?success=true&session=${session}`,
      cancel_url: `${req.headers.origin || process.env.SITE_URL}/book.html?cancelled=true`,
    });

    return res.status(200).json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Stripe error:', error);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
};
