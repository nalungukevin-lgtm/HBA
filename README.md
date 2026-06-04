# Henrison Basketball Academy — hba.ug

The official marketing site for **Henrison Basketball Academy (HBA)**, a youth
basketball academy in Kampala, Uganda. A single-page, cinematic site whose hero is
a scroll-choreographed 3D basketball that banks off a backboard and rides down the
page as you scroll.

**Live:** https://hba.ug

## Tech

Plain, dependency-free **static site** — just HTML, CSS and JavaScript. No build step,
no framework. It runs by opening `index.html` from any web server. The only external
dependency is [three.js](https://threejs.org) (loaded from a CDN) for the 3D hero.

```
index.html      Page structure + content
hba.css         All styles + design tokens (the :root block) + responsive rules
app.js          Reveal-on-scroll, count-ups, the hero scroll choreography, modal, forms
ball.js         The 3D scene (basketball + backboard) and its scroll animation
assets/         Logo + images
fonts/          Poppins (self-hosted)
models/         3D models (.obj) + textures
CNAME           Tells GitHub Pages to serve the site at hba.ug
```

## Run it locally

From this folder:

```bash
npx serve .
# then open the URL it prints (e.g. http://localhost:3000)
```

(The 3D model loads over HTTP, so opening the file directly with `file://` won't show
the ball — you need a local server, which the command above gives you.)

## Editing content — common tasks

All copy lives in `index.html`. Search for the text you want to change and edit it.

- **Founder bio** (`#about` section): replace the orange `[last name]`, `[club]`,
  `[university]`, `[degree]`, `[field]` placeholders with Henry's real details.
- **Founder photo:** add a photo to `assets/` (e.g. `founder-henry.jpg`) and, in the
  About section, replace the `<div class="img-ph" id="v4-founder">…</div>` block with:
  `<img src="assets/founder-henry.jpg" alt="Henry — Founder of HBA" style="width:100%;height:100%;object-fit:cover" />`
- **Player photos** (`#roster`): same idea — drop cut-out PNGs into `assets/` and swap
  each `<div class="img-ph img-ph--player">…</div>` for an `<img class="pfig-img" …>`.
- **Social links:** update the `href`s in the `#social` section and the footer.
- **WhatsApp / email:** replace `+256700000000` and `hello@hba.ug` everywhere they appear.
- **Events:** edit the four `<article class="glass ev">` blocks in `#events`.

## Forms (registration + tryouts) — not yet connected

The "Register" and "Request Tryout" forms currently show a success message but **do not
send the data anywhere**. To receive submissions, wire them to a form service such as
[Formspree](https://formspree.io) or [Web3Forms](https://web3forms.com) — search for
`TODO(backend)` in `app.js` for the two spots to update.

## Performance note

The backboard 3D model (`models/basketball-backboard.obj`) is ~11 MB. It loads lazily
*after* the rest of the page, so it never blocks the site. For a future speed-up, convert
the `.obj` models to compressed `.glb` (this can cut the board to a few hundred KB).
