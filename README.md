# Remember Together website
Link: https://remembertogether.vercel.app

The campaign website for Remember Together, a HOSA Community Awareness project on dementia. Built with [Astro](https://astro.build) as a static site and hosted on Vercel.

## Run it

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # outputs to dist/
```

## Where things live

| What | Where |
|---|---|
| Email, Instagram, form URL, Google Analytics ID | `src/site.config.ts` |
| Lessons and caregiver guides | Copied from the app. Run `npm run sync` after changing `lessons.json` or `care.json` in the app. |
| Helplines | `src/content/site/helplines.json` (keep in sync with the app's Help tab) |
| Home page statistics | `src/content/site/stats.json` |
| Published stories | `src/content/site/stories.json` (only with the writer's permission) |
| Team members | `src/content/site/team.json` |
| What we have made, how we measure impact | `src/content/site/progress.json` |
| HOSA logo | Save as `src/assets/hosa-logo.png` (or .svg). It appears on the home page automatically. |
| Colors, spacing, type | `src/styles/tokens.css` |
| Form backend | `apps-script/` (setup steps in its README) |

## Design rules

- Colors come from the app's `Palette.swift`. Each part of the site uses its app tab color: Learn purple, Care teal, Help red.
- Spacing uses only the 4 point scale in `tokens.css` (`--s-1` to `--s-9`). Never add a one-off value.
- One radius (`--radius`), one border style, no shadows, no gradients.
- Headings: Source Serif 4. Body: Atkinson Hyperlegible. Sizes come only from the type ramp in `tokens.css`.
- The app's 20 "not vibe coded" rules apply here too (see the app's `SPEC.md`).
- No decorative motion. Only state changes the person caused may animate: the mobile menu, form success and errors, the story form's name field, button presses, and smooth jumps to sections. All motion goes through `src/scripts/motion.ts` (Motion's small `motion/mini` build), stays between 120 and 250ms with no overshoot, and turns off when the device asks for reduced motion.
- Copy: plain, specific, short sentences, no em dashes.

## Before launch

- [ ] Connect the forms (`apps-script/README.md`) and paste the URL into `formEndpoint`
- [ ] Create a GA4 property and paste the ID into `gaId`
- [ ] Deploy on Vercel, then update `site.url`, `astro.config.mjs` and `public/robots.txt` to the real address
- [ ] Add the HOSA logo file
- [ ] Re-check every helpline number against each organization's own site
- [ ] Replace the drawn app preview with real screenshots when ready
