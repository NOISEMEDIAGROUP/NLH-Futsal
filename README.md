# North London Hawks - Futsal Academy Website

Standalone futsal booking site for [North London Hawks](https://www.northlondonhawks.co.uk). Term-based booking with dynamic pricing, live availability, Stripe payments, and email notifications.

## Pages

- **index.html** -- Homepage with hero, about, coaches, and CTA
- **timetable.html** -- Session schedule with live availability per age group
- **book.html** -- Registration form with capacity check, dynamic pricing, and Stripe Checkout

## Architecture

```
Static frontend (HTML/CSS/JS)
    |
    +-- /api/check-availability  --> Supabase (booking counts)
    +-- /api/create-checkout     --> Stripe Checkout Session
    +-- /api/webhook             --> Supabase (record) + Resend (emails)
```

**Services (all free tier):**
- **Vercel** -- hosting + serverless API routes
- **Stripe** -- payment processing
- **Supabase** -- database (bookings + capacity tracking)
- **Resend** -- confirmation emails to parents + notification emails to coaches

## Setup

### 1. Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run this:

```sql
CREATE TABLE bookings (
  id BIGSERIAL PRIMARY KEY,
  stripe_session_id TEXT UNIQUE NOT NULL,
  session_key TEXT NOT NULL,
  term TEXT NOT NULL,
  player_name TEXT NOT NULL,
  player_dob TEXT NOT NULL,
  parent_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  medical TEXT DEFAULT '',
  email_consent BOOLEAN DEFAULT FALSE,
  photo_consent BOOLEAN DEFAULT FALSE,
  amount_paid INTEGER,
  price_label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast capacity lookups
CREATE INDEX idx_bookings_session_term ON bookings (session_key, term);
```

3. Copy your **Project URL** and **anon key** from Settings > API
4. Copy the **service_role key** (needed for the webhook to write bookings)

### 2. Stripe

1. Create or log into a [Stripe account](https://stripe.com)
2. Copy your **Secret Key** from Developers > API Keys
3. Set up a webhook:
   - Go to Developers > Webhooks > Add endpoint
   - URL: `https://YOUR_VERCEL_DOMAIN/api/webhook`
   - Events: select `checkout.session.completed`
   - Copy the **Webhook Signing Secret**

### 3. Resend

1. Sign up free at [resend.com](https://resend.com)
2. Verify your sending domain (or use their test domain to start)
3. Create an API key and copy it

### 4. Configure

Update `lib/config.js` with:
- Term dates and pricing tiers (prices in pence)
- Max capacity per session
- Coach email addresses
- Sender email (must be verified in Resend)

### 5. Deploy to Vercel

```bash
npm i -g vercel
vercel login
vercel
```

Then set environment variables in Vercel dashboard (Settings > Environment Variables):

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
RESEND_API_KEY=re_...
SITE_URL=https://your-vercel-domain.vercel.app
```

### 6. Update Stripe webhook URL

Once deployed, update the webhook URL in Stripe to point to your Vercel domain:
`https://YOUR_VERCEL_DOMAIN/api/webhook`

## How it works

1. Parent visits the site, selects an age group session
2. Frontend calls `/api/check-availability` to show spots remaining and current price
3. Price is calculated automatically based on how far into the term we are (full/mid/late)
4. Parent fills in the registration form and clicks "Pay"
5. Frontend calls `/api/create-checkout` which checks capacity and creates a Stripe Checkout Session
6. Parent pays on Stripe's hosted checkout page
7. Stripe fires a webhook to `/api/webhook` which:
   - Records the booking in Supabase
   - Sends a confirmation email to the parent
   - Sends a notification email to the coaches with all booking details

## Updating each term

Edit `lib/config.js` with new term dates, pricing tiers, and capacity. Push to GitHub and Vercel auto-deploys.

## Images

Currently referencing images from the existing Wix site. To self-host, download images to `images/` and update `src` attributes in the HTML files.
