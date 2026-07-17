const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');
const { config } = require('../lib/config');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);

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

  if (!session || !playerName || !playerDob || !parentName || !email || !phone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const sessionConfig = config.sessions[session];
  if (!sessionConfig) {
    return res.status(400).json({ error: 'Invalid session' });
  }

  // Save enquiry to Supabase
  const enquiryId = `enq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const { error: insertError } = await supabase
    .from('bookings')
    .insert({
      stripe_session_id: enquiryId,
      session_key: session,
      term: config.term.name,
      player_name: playerName,
      player_dob: playerDob,
      parent_name: parentName,
      email: email,
      phone: phone,
      medical: medical || '',
      email_consent: emailConsent === 'yes',
      photo_consent: photoConsent === 'yes',
      amount_paid: 0,
      price_label: sessionConfig.price,
    });

  if (insertError) {
    console.error('Failed to save enquiry:', insertError);
    return res.status(500).json({ error: 'Failed to save enquiry' });
  }

  // Send notification email to coaches
  if (config.coachEmails.length > 0) {
    try {
      await resend.emails.send({
        from: `${config.fromName} <${config.fromEmail}>`,
        to: config.coachEmails,
        subject: `New Enquiry - ${playerName} (${sessionConfig.label})`,
        html: buildCoachEmail({ playerName, playerDob, parentName, email, phone, medical, emailConsent, photoConsent }, sessionConfig),
      });
    } catch (err) {
      console.error('Failed to send coach email:', err);
    }
  }

  // Send confirmation email to parent
  try {
    await resend.emails.send({
      from: `${config.fromName} <${config.fromEmail}>`,
      to: email,
      subject: `Enquiry Received - ${sessionConfig.label} Session`,
      html: buildParentEmail({ playerName, parentName }, sessionConfig),
    });
  } catch (err) {
    console.error('Failed to send parent email:', err);
  }

  return res.status(200).json({ success: true });
};


function buildCoachEmail(data, sessionConfig) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #333;">
      <div style="background: #7B2FBE; padding: 24px; border-radius: 12px 12px 0 0;">
        <h2 style="color: #ffffff; margin: 0;">New Enquiry</h2>
      </div>
      <div style="padding: 24px; background: #f8f8f8; border-radius: 0 0 12px 12px;">
        <p>Someone has enquired about the <strong>${sessionConfig.label}</strong> session.</p>

        <h3 style="margin: 20px 0 12px;">Player</h3>
        <div style="background: white; border-radius: 8px; padding: 20px; border-left: 4px solid #7B2FBE;">
          <p style="margin: 0 0 8px;"><strong>Name:</strong> ${data.playerName}</p>
          <p style="margin: 0;"><strong>DOB:</strong> ${data.playerDob}</p>
        </div>

        <h3 style="margin: 20px 0 12px;">Session</h3>
        <div style="background: white; border-radius: 8px; padding: 20px; border-left: 4px solid #7B2FBE;">
          <p style="margin: 0 0 8px;"><strong>Tier:</strong> ${sessionConfig.label}</p>
          <p style="margin: 0 0 8px;"><strong>Ages:</strong> ${sessionConfig.ageRange}</p>
          <p style="margin: 0 0 8px;"><strong>Day:</strong> ${sessionConfig.day} ${sessionConfig.time}</p>
          <p style="margin: 0;"><strong>Price:</strong> ${sessionConfig.price}</p>
        </div>

        <h3 style="margin: 20px 0 12px;">Parent / Guardian</h3>
        <div style="background: white; border-radius: 8px; padding: 20px;">
          <p style="margin: 0 0 8px;"><strong>Name:</strong> ${data.parentName}</p>
          <p style="margin: 0 0 8px;"><strong>Email:</strong> <a href="mailto:${data.email}" style="color: #7B2FBE;">${data.email}</a></p>
          <p style="margin: 0;"><strong>Phone:</strong> ${data.phone}</p>
        </div>

        ${data.medical ? `
        <h3 style="margin: 20px 0 12px;">Medical Info</h3>
        <div style="background: #fff3cd; border-radius: 8px; padding: 20px;">
          <p style="margin: 0;">${data.medical}</p>
        </div>
        ` : ''}

        <p style="margin-top: 20px; font-size: 13px; color: #999;">
          Photo consent: ${data.photoConsent} | Email consent: ${data.emailConsent}
        </p>

        <p style="margin-top: 24px;">Reply to the parent directly to confirm their spot.</p>
      </div>
    </div>
  `;
}

function buildParentEmail(data, sessionConfig) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #333;">
      <div style="background: #7B2FBE; padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Enquiry Received</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0;">Hawks Futsal</p>
      </div>
      <div style="padding: 32px; background: #f8f8f8; border-radius: 0 0 12px 12px;">
        <p>Hi ${data.parentName},</p>
        <p>Thanks for your interest in the <strong>${sessionConfig.label}</strong> session for <strong>${data.playerName}</strong>.</p>
        <p>Our coaches will review your enquiry and get back to you shortly to confirm availability and next steps.</p>

        <div style="background: white; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid #7B2FBE;">
          <p style="margin: 0 0 8px;"><strong>Session:</strong> ${sessionConfig.label}</p>
          <p style="margin: 0 0 8px;"><strong>Ages:</strong> ${sessionConfig.ageRange}</p>
          <p style="margin: 0 0 8px;"><strong>Day:</strong> ${sessionConfig.day}</p>
          <p style="margin: 0 0 8px;"><strong>Time:</strong> ${sessionConfig.time}</p>
          <p style="margin: 0;"><strong>Price:</strong> ${sessionConfig.price}</p>
        </div>

        <p>If you have any questions in the meantime, don't hesitate to get in touch.</p>
        <p><strong>The Hawks Futsal Team</strong></p>

        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;">
        <p style="font-size: 12px; color: #999;">Hawks Futsal</p>
      </div>
    </div>
  `;
}
