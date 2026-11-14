# DAYMARK presentation

One Vietnamese, eight-slide deck for **DAYMARK — Tuần 6/10**. The earlier scope review and engineering checkpoint remain in `src/reports/` as unregistered reference material; the root library lists only the current deck.

## Run

From the repository root:

```sh
npm run presentation:dev
npm run presentation:build
npm run presentation:test
```

The root npm lockfile is authoritative. `presentation/` has no lockfile. Vite uses a relative base and serves the approved swallow asset from `public/brand/`.

## Navigation

- `#/` opens the presentation library. It never automatically opens a saved deck.
- `#/daymark-week-6/1` opens the Week 6/10 deck directly.
- Opening a deck and returning to the library create browser history entries; slide changes update the current entry.
- The 16:9 canvas fills the viewport. A bottom dock with horizontal slide thumbnails appears on hover or keyboard focus at the bottom edge. There is no persistent reveal pill.
- The dock contains only library, previous/next, slide count, 30-second play/pause and fullscreen controls.
- Keys: `ArrowRight` / `Enter` next, `ArrowLeft` previous, `Home` / `End` first or last, `Space` play/pause. Space and Enter retain native button behavior.
- Slide transitions and hover effects respect `prefers-reduced-motion`.

## Deck facts and sources

The eight slides cover the everyday-clothing business problem, actors, nine required use cases, the complete stock-to-COD journey, proposed AWS/Medusa architecture, synchronous versus asynchronous responsibilities, unachieved workload targets, and the Week 6–10 implementation sequence. Test and capacity numbers are targets, not claimed results.

Canonical requirements are in `docs/spec/01-business.md` through `docs/spec/07-delivery.md`. Their paths are recorded on the report and slides as source metadata. The report content includes no speaker notes or hidden explanatory panels.

## Structure

- `src/engine/` contains library/deck routing, the full-canvas shell, thumbnail dock, reusable slide blocks and small route/playback/keyboard helpers.
- `src/reports/registry.ts` registers only `week-06-reset/`.
- `src/reports/daymark-scope-revamp/` and `src/reports/engineering-checkpoint/` are retained as source reference and are not in the public registry.
- `src/styles/presentation.css` styles the library, full-screen canvas and auto-hide dock; `slide.css` styles the 16:9 report content.

## Motion, diagrams and branding

Motion 14.13.0 (matching the supplied reference) owns page transitions and per-slide choreography. Each slide selects a preset in its report data; title, card, journey, metrics and closing reveals differ. Reduced-motion preferences disable movement. Mermaid is loaded on demand for the architecture diagram, using strict security and an olive/ivory theme.

The wordmark uses the tightly cropped traced SVG swallow. Header: brand left, section centered, week secondary at right. Static page numbering appears only in the footer. The bottom dock has no reveal pill; move to the bottom edge or focus it with the keyboard.
