# North London Hawks - Futsal Academy Website

Standalone futsal website for [North London Hawks](https://www.northlondonhawks.co.uk). Three pages: homepage, timetable, and booking with Stripe payment integration.

## Pages

- **index.html** -- Homepage with hero, about section, coaches, and CTA
- **timetable.html** -- Monday evening session schedule (5 age groups)
- **book.html** -- Registration form + Stripe payment redirect

## Setup

### 1. Stripe Payment Links

1. Create a [Stripe account](https://stripe.com) (or log into an existing one)
2. Go to **Products** and create a product for each session:
   - Y1-Y3 Monday 6-7pm
   - Y4-Y5 Monday 6-7pm
   - Y6-Y7 Monday 7-8pm
   - Y8 Monday 7-8pm
   - Y9-Y10 Monday 8-9pm
3. Set prices for each product
4. Go to **Payment Links** and create a link for each product
5. Open `js/main.js` and replace the placeholder URLs in `STRIPE_PAYMENT_LINKS` with your actual Stripe Payment Link URLs

### 2. Formspree (form backend)

1. Sign up free at [formspree.io](https://formspree.io)
2. Create a new form
3. Copy your form endpoint (e.g. `https://formspree.io/f/xyzabc`)
4. Open `js/main.js` and replace `YOUR_FORM_ID` in `FORMSPREE_ENDPOINT`

### 3. Deploy to GitHub Pages

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/hawks-futsal.git
git push -u origin main
```

Then in GitHub: **Settings > Pages > Source: Deploy from branch > main > / (root)**

Your site will be live at `https://YOUR_USERNAME.github.io/hawks-futsal/`

## Images

Currently referencing images from the existing Wix site. To self-host:
1. Download images and place them in the `images/` folder
2. Update `src` attributes in the HTML files

## Customisation

- Brand colours are defined as CSS custom properties in `css/style.css` (`:root` block)
- Session data lives in `js/main.js` (`SESSION_INFO` object)
- Social media links are in the footer of each HTML file
