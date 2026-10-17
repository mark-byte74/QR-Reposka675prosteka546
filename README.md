# Menu Codes — Website

Static corporate website (Arabic/English) for the Menu Codes digital menu system.
No build step required — upload as-is.

## Deploy on GitHub Pages

1. Create a new repository on GitHub (e.g. `menucodes-site`)
2. Upload all files from this zip to the repository root
   (index.html must be at the root)
3. Go to repository Settings → Pages
4. Under "Build and deployment", select:
   - Source: **Deploy from a branch**
   - Branch: **main** (or master), folder: **/ (root)**
5. Save — the site will be live at
   `https://<username>.github.io/<repository>/` within a minute or two

## Change the WhatsApp number

Open `assets/js/i18n.js` and edit the single line at the top:

```js
const WHATSAPP_NUMBER = "15551234567"; // ← ضع رقم الواتساب هنا
```

Replace `15551234567` with the real number in international format
without `+`, spaces or dashes (e.g. `971501234567`).
Every WhatsApp button on the site uses this number automatically.

## Files

- `index.html` — Home
- `features.html` — Features
- `how-it-works.html` — How it works
- `pricing.html` — Pricing (contact for a custom quote)
- `faq.html` — FAQ
- `contact.html` — Contact (WhatsApp only)
- `assets/` — CSS + JavaScript (bilingual system)
- `images/` — Site imagery
- `favicon.svg` — Site icon
