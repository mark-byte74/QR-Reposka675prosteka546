# MenuCodes — Premium bilingual website

MenuCodes is a static, responsive marketing website for a restaurant QR-menu system. It uses the existing HTML/CSS/JavaScript stack and supports English and Arabic (RTL), light and dark themes, and direct static hosting.

## Pages

- `/` — Home
- `/features/` — Features
- `/how-it-works/` — How it works
- `/pricing/` — Pricing
- `/faq/` — FAQ
- `/contact/` — Contact

## Deployment

Upload the contents of this folder as-is to the root of a static host, including `assets/`, `images/`, and each page folder. The site also supports deployment under a sub-path (for example, `username.github.io/repo/`) because page and asset references are relative.

## Configuration

- WhatsApp number: `assets/js/i18n.js` → `CONFIG.WHATSAPP_NUMBER` (digits only, international format). Replace the demonstration value with your real business number before publishing.
- Production domain: `assets/js/i18n.js` → `CONFIG.SITE_DOMAIN` (currently blank; set when the public domain is known).
- Language preference: stored as `mc-lang` in local storage.
- Theme preference: stored as `mc-theme`; the initial appearance follows the device preference until the visitor chooses a theme.

## Visual assets

The six page illustrations are authored as editable SVG source files in `images/`. The pages prefer the SVG artwork for crisp scaling, with matching optimized WebP and JPG versions as fallbacks. All formats use the same MenuCodes QR-menu visual system. The QR pattern is illustrative and should not be used as a live venue code.

## Accessibility and motion

The site includes visible keyboard focus states, a skip link, an Escape-to-close mobile navigation, keyboard focus containment in the open mobile menu, and reduced-motion fallbacks for animated effects.

## Quality and interaction

- The shared design system covers all six pages: translucent but high-contrast header, glass-style navigation, gradient accents, responsive layouts, card hover states, scroll reveals, reading progress, and cross-page transitions.
- Theme and language preferences persist locally; theme and language changes animate unless the visitor has enabled reduced motion in their operating system.
- Mobile navigation supports Escape-to-close, outside-click closing, focus management, and a keyboard focus loop.
- JavaScript syntax and local asset/link references were checked before packaging.

## Notes

- No JavaScript framework or build process is required.
- If JavaScript is disabled, the core page content remains readable and navigation links still work.
- The WhatsApp contact flow opens a pre-filled WhatsApp message; it does not send the message automatically.
