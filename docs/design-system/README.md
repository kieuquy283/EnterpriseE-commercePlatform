# DAYMARK storefront design

The storefront follows the approved full-width fashion editorial direction. The existing landing hero and navigation composition, including the swallow SVG, are retained. This implementation supports browse/discovery (FR-02, REC-01), cart/purchase (FR-03–FR-05) and private account/history (FR-01, FR-07). It changes presentation, not Medusa's commerce ownership or the Next.js application boundary.

## Composition

Home moves from a split hero into a short two-column brand statement, three adjoining full-bleed collection photographs, one curated product selection and a muted olive closing invitation. Repeated collection product rails and decorative section numbers are removed from the home composition. Personal recommendations remain consent-gated and render only when available.

Collection pages pair oversized plain uppercase type with an edge-to-edge clothing photograph. Store/search/category pages use open headers and horizontal discovery/sort controls above a full-width merchandise grid: two columns on mobile and four on desktop. Product detail uses a large unframed media column, a separate purchase column and details aligned beneath that column. Related suggestions share the merchandise type and grid treatment.

Cart and checkout use a quiet ivory summary plane beside the main flow. Account navigation is separated with a rule; login pairs a spacious introduction with the form, while profile and recent orders use rows rather than dashboard cards. Confirmation uses a large heading and a distinct totals area. Empty results use open space and rules, errors use an explicit message with a strong leading rule, and loading placeholders stay still.

## Primitives

`src/styles/globals.css` defines semantic ivory, charcoal and muted olive roles. Inter is the shared font; display headings are plain uppercase, body copy stays sentence case. Fine rules establish hierarchy without shadows. Supporting labels are readable sentence-case text rather than miniature tracked decoration.

- `.dm-btn-*`: square, minimum 48px height, with charcoal primary, outlined secondary and restrained ghost variants. The hero CTA uses this same primitive, preserving its placement. Size props remain compatible but no longer introduce larger type or different padding per page.
- `.dm-link` and `.dm-action-link`: underlined text with a visible keyboard focus ring; inline actions have the shared 48px target. Navigation arrows use one plain 16px icon without a separate bubble or rotating treatment.
- `.dm-field`, `.dm-label`, `.dm-hint`: square fields, fixed labels above inputs, explicit helper/error associations. Password visibility controls retain accessible names. Native selects and quantity controls share the field geometry. `.dm-choice` extends the outlined button for variant/filter/pagination selection with one pressed/current state. `.dm-btn-icon` extends the ghost button with a square 48px target for modal/menu/accordion actions. Native and pressed-state semantics are retained.
- `.dm-card`, `.dm-panel`: transparent surfaces with a structural rule. Summary planes use the surface role explicitly rather than placing every block in a card.
- `.dm-alert-*`: text and leading rule; role and wording communicate the outcome without relying on colour. Status badges are compact, square and quiet.
- `.dm-skeleton`: static neutral placeholders. Product media windows have square corners and no decorative border.

Vietnamese is used for navigation, actions, forms and feedback; collection/product names may be English. Preserve labels, focus indicators, semantic headings, list nesting, test selectors and mobile menu Escape/focus restoration.

## Motion

The generic `Reveal` component and whole-page layout wrappers are removed. There is no route-entry animation and no pathname-triggered replay. Cart, checkout, account, order, search and product purchase controls remain steady.

Motion 14.14.0 is used only by two named home compositions in `editorial-motion`:

- The approach heading settles horizontally by 18px; supporting copy settles from the opposite direction by 12px, with independent 650/800ms timing.
- Collection photographs settle from 1.045 scale to 1 inside their frames over 1.1 seconds, staggered by 90ms. Links and captions do not move.

Both are once-per-mount visibility enhancements, with no opacity hiding, scroll hijack or purchase-action delay. Reduced-motion users bypass both. The broad main-route loading boundary is removed so home server content is delivered visibly without JavaScript; its skeleton is preserved as the reusable `skeleton-page` template. Section-level product loading fallbacks remain. Returning to a newly mounted home may run its home-only enhancement again; scrolling back within the same mount does not replay it.

## Commerce and limits

All commerce access remains in `src/lib/data` and the SDK. Medusa owns prices, discounts, currency, shipping, stock, payment and order outcomes. The variant URL selection fix using native history is preserved. No data-access or catalog importer change is part of this design pass.

Existing real clothing photographs illustrate collection mood. The local class-preview catalog also uses representative clothing photographs attached through Medusa's local file provider; they do not prove exact product or colour variants. Production media continues through the configured Medusa provider and private-S3 proxy. Measured sizing remains missing. Public catalog reads retain inherited 60-second revalidation and complete matching-result price sorting. Email/password changes retain honest unavailable feedback. Production, staff fulfillment, COD cash collection and notification delivery require separate acceptance.

See [validation](VALIDATION.md) for checks actually run for this pass.
