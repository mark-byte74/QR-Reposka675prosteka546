# Menu Codes — Website

Bilingual (English/Arabic) marketing site. Static files only: upload the contents of this folder as-is.

## Deploy on GitHub Pages

1. Create a repository (e.g. `menucodes-site`) and upload every file in this folder to its root.
2. Repository → Settings → Pages → Deploy from a branch → `main` / root (`/`).
3. The site works from the domain root and from a subproject path (`username.github.io/repo/`): all links, assets and images are relative, so nothing needs to change.

## Change the WhatsApp number

- File: `assets/js/i18n.js`
- Variable: `CONFIG.WHATSAPP_NUMBER`
- Line: 6

Replace `15551234567` with the real number in international format, digits only (no `+`, spaces or dashes). Every WhatsApp button on the site is built from this single value.

## Change the domain

- File: `assets/js/i18n.js`
- Variable: `CONFIG.SITE_DOMAIN`
- Line: 7

Reserved for absolute URLs (canonical, og:image). Leave empty until the production domain is known.

## Notes

- Default language on first visit is English; a visitor's manual choice is stored and never overridden.
- `robots.txt` allows all crawlers.
