# stackd cream style guide

- Paper background `#f8f3e7` (cards `rgba(255,253,245,.64–.96)` with blur), pine green ink `#274234` / `#153d30`, muted text `#6b7a6e`, hover wash `#e9ecdc`, hairlines `rgba(216,208,190,.72)`.
- Brand: lowercase **stackd** wordmark + palm sketch. No gradients-on-buttons, no emoji icons, no stock "AI" sparkle flourishes in new UI.
- Shapes: pills (999px) for header controls, 18–24px radius panels, 12–14px radius rows. Soft shadow `0 12px 30px rgba(39,66,52,.12)`.
- Type: serif display headings already in `destination.css`; 13–16px UI text.
- Every new style needs a `.dark` counterpart (night mode).
- Mobile first: the web build is shown inside a 430px phone frame; check at 390px.

- Marketplace chips: pill outline; active = solid primary (pine), inactive = card border. No emoji chips.
- Commission preview cards: muted rows + one bordered "You keep" row; money in USD; no sparkle icons.
- Prefer `Badge variant="secondary"` over gradient commission badges on new screens.

- Public guide: serif title, small uppercase "Local guide" eyebrow, 18px-radius cards with photo 4:3, heart in a cream circle top-right, host tip in a muted rounded box, one solid pine "See details" pill per card. No gradient footers or sparkle CTAs.
- Builder: one card per pick; order with arrow buttons (not drag) so it works in the phone frame; native select for sections.
