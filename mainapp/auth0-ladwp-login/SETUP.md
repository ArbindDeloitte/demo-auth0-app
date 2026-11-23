# LADWP-style Auth0 Universal Login — setup

Two files are involved, because Auth0's New Universal Login renders the actual
login form as a **web component with a shadow DOM**. CSS in the page template
cannot reach inside it (Auth0's own docs warn that the internal class names
change on every build), so styling is split across two places:

1. `login-template.liquid` — the page chrome (LA/LADWP header, nav, the
   split background, where the widget sits on the page). This is everything
   *outside* the widget, and is fully under your control.
2. Branding dashboard settings — the widget's *own* look (card background,
   input borders, button color/shape, font, logo, which side it's aligned to).
   These only work through Auth0's Branding UI/API, not through CSS you write.

## 1. Install the template

Dashboard → **Branding → Universal Login → Advanced Options → Login** (or via
the Auth0 CLI/Management API `branding:templates:universal-login`), paste in
`login-template.liquid`.

Replace the two placeholder URLs before shipping:
- `.image-panel { background-image: url(...) }` → your actual LA skyline asset
  (host it on your own CDN/S3, not hotlinked from Unsplash).
- the LA seal `<img>` → your own hosted asset.

## 2. Branding settings to match the look

Dashboard → **Branding → Universal Login → Customize** (Theme editor), or the
Management API `PATCH /branding/themes/default`:

| Setting | Value to approximate the target |
|---|---|
| Page Background → Background Type | Color |
| Page Background → Background Color | `#0a5a82` (matches `--ladwp-blue` in the template) |
| Page Background → Widget Alignment | **Right** |
| Widget → Logo | Hidden (the real LADWP logo already lives in the custom nav bar — a second logo inside the widget will look redundant) |
| Widget → Corner Radius | `0–2px` (target design is mostly square) |
| Widget → Border weight / shadow | Off / minimal — the design uses flat white panels, not an elevated card |
| Colors → Widget background | `#ffffff` |
| Colors → Primary button | light blue, e.g. `#9cc6e0`, label color `#0b1f33` (dark navy text on the button, not white — check your contrast ratio here, it's borderline) |
| Colors → Links | `#0a5a82` |
| Colors → Input border | `#9aa5ad` |
| Fonts | Set to your LADWP web font if you have the WOFF, otherwise system default is fine |

## Known gap — read before you spend time chasing pixels

In the target design, "Forgot Password" and "New user? Register online
account" are visually **separate bordered boxes** stacked under the login
card. In Auth0's New Universal Login, those two links are rendered *inside*
the widget's shadow DOM by Auth0 itself — you cannot pull them out into
separate page-level `<div>`s or restyle their container without that markup
breaking on Auth0's next internal build.

What you *can* control: the Branding link color, and (via page CSS around
the widget's outer host element, which is light-DOM) the spacing/margin
around the whole widget block. The preview mocks the separated-boxes look
using fake markup so you can see the target visually — the real widget will
render all of this as one continuous card with the links near the bottom,
not as separate boxes. If matching that exactly is a hard requirement, the
only way to get it is Auth0's **Classic Login Page** (deprecated,
non-shadow-DOM, full HTML/CSS/JS control) instead of New Universal Login —
worth a quick discussion before committing engineering time either way.

## Files
- `login-template.liquid` — paste this into Auth0.
- `preview.html` — local-only visual mock (fake form fields standing in for
  `{%- auth0:widget -%}`) so you can sanity-check the chrome/layout. Not for
  deployment.
