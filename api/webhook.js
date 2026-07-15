const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');
const { config } = require('../lib/config');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);

// Vercel doesn't parse the body for webhooks -- we need the raw body
module.exports.config = {
  api: { bodyParser: false },
};

async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rawBody = await getRawBody(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const meta = session.metadata;

    // Record the booking in Supabase
    const { error: insertError } = await supabase
      .from('bookings')
      .insert({
        stripe_session_id: session.id,
        session_key: meta.session_key,
        term: meta.term,
        player_name: meta.player_name,
        player_dob: meta.player_dob,
        parent_name: meta.parent_name,
        email: meta.email,
        phone: meta.phone,
        medical: meta.medical,
        email_consent: meta.email_consent === 'yes',
        photo_consent: meta.photo_consent === 'yes',
        amount_paid: session.amount_total,
        price_label: meta.price_label,
      });

    if (insertError) {
      console.error('Failed to record booking:', insertError);
    }

    // Get session config for email content
    const sessionConfig = config.sessions[meta.session_key] || {};

    // Send confirmation email to customer
    try {
      await resend.emails.send({
        from: `${config.fromName} <${config.fromEmail}>`,
        to: meta.email,
        subject: `Booking Confirmed - ${sessionConfig.label || meta.session_key} Futsal`,
        html: buildCustomerEmail(meta, sessionConfig, session.amount_total),
      });
    } catch (err) {
      console.error('Failed to send customer email:', err);
    }

    // Send notification to coaches
    if (config.coachEmails.length > 0) {
      try {
        await resend.emails.send({
          from: `${config.fromName} <${config.fromEmail}>`,
          to: config.coachEmails,
          subject: `New Booking - ${meta.player_name} (${sessionConfig.label || meta.session_key})`,
          html: buildCoachEmail(meta, sessionConfig, session.amount_total),
        });
      } catch (err) {
        console.error('Failed to send coach email:', err);
      }
    }
  }

  return res.status(200).json({ received: true });
};


// -------------------------------------------------
// Email templates
// -------------------------------------------------

function buildCustomerEmail(meta, sessionConfig, amountTotal) {
  const amount = `£${(amountTotal / 100).toFixed(2)}`;
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #333;">
      <div style="background: #340851; padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: #F4EE1E; margin: 0; font-size: 24px;">Booking Confirmed</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0;">North London Hawks Futsal Academy</p>
      </div>
      <div style="padding: 32px; background: #f8f8f8; border-radius: 0 0 12px 12px;">
        <p>Hi ${meta.parent_name},</p>
        <p>We've confirmed <strong>${meta.player_name}</strong>'s place in the <strong>${sessionConfig.label || meta.session_key}</strong> futsal session for <strong>${meta.term}</strong>.</p>

        <div style="background: white; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid #340851;">
          <p style="margin: 0 0 8px;"><strong>Session:</strong> ${sessionConfig.label || meta.session_key}</p>
          <p style="margin: 0 0 8px;"><strong>Day:</strong> ${sessionConfig.day || 'Monday'}</p>
          <p style="margin: 0 0 8px;"><strong>Time:</strong> ${sessionConfig.time || 'See timetable'}</p>
          <p style="margin: 0 0 8px;"><strong>Location:</strong> ${sessionConfig.location || 'Aldenham'}</p>
          <p style="margin: 0 0 8px;"><strong>Price paid:</strong> ${amount} (${meta.price_label})</p>
        </div>

        <h3 style="margin: 24px 0 12px;">What to bring</h3>
        <p>Indoor trainers (no studs), shin pads, water bottle, and comfortable sportswear. We provide the balls and bibs.</p>

        <p style="margin-top: 24px;">See you on the court!</p>
        <p><strong>The NLH Futsal Team</strong></p>

        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;">
        <p style="font-size: 12px; color: #999;">If you have any questions, contact us at <a href="https://www.northlondonhawks.co.uk/contact" style="color: #340851;">northlondonhawks.co.uk/contact</a></p>
      </div>
    </div>
  `;
}

function buildCoachEmail(meta, sessionConfig, amountTotal) {
  const amount = `£${(amountTotal / 100).toFixed(2)}`;
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #333;">
      <div style="background: #340851; padding: 24px; border-radius: 12px 12px 0 0;">
        <h2 style="color: #F4EE1E; margin: 0;">New Booking</h2>
      </div>
      <div style="padding: 24px; background: #f8f8f8; border-radius: 0 0 12px 12px;">
        <div style="background: white; border-radius: 8px; padding: 20px; border-left: 4px solid #340851;">
          <p style="margin: 0 0 8px;"><strong>Player:</strong> ${meta.player_name}</p>
          <p style="margin: 0 0 8px;"><strong>DOB:</strong> ${meta.player_dob}</p>
          <p style="margin: 0 0 8px;"><strong>Session:</strong> ${sessionConfig.label || meta.session_key} (${sessionConfig.day} ${sessionConfig.time})</p>
          <p style="margin: 0 0 8px;"><strong>Term:</strong> ${meta.term}</p>
          <p style="margin: 0 0 8px;"><strong>Paid:</strong> ${amount} (${meta.price_label})</p>
        </div>

        <h3 style="margin: 20px 0 12px;">Parent / Guardian</h3>
        <div style="background: white; border-radius: 8px; padding: 20px;">
          <p style="margin: 0 0 8px;"><strong>Name:</strong> ${meta.parent_name}</p>
          <p style="margin: 0 0 8px;"><strong>Email:</strong> ${meta.email}</p>
          <p style="margin: 0 0 8px;"><strong>Phone:</strong> ${meta.phone}</p>
        </div>

        ${meta.medical ? `
        <h3 style="margin: 20px 0 12px;">Medical Info</h3>
        <div style="background: #fff3cd; border-radius: 8px; padding: 20px;">
          <p style="margin: 0;">${meta.medical}</p>
        </div>
        ` : ''}

        <p style="margin-top: 16px; font-size: 13px; color: #999;">
          Photo consent: ${meta.photo_consent} | Email consent: ${meta.email_consent}
        </p>
      </div>
    </div>
  `;
}
