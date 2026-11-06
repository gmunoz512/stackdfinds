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

### Host commission badge / Top 8 tiles
- Use `HostCommissionBadge` (src/components/host) on host-only screens. Never on guest screens.
- Top 8 tiles: 3:4 photo, 18px radius, dark bottom gradient with white name, category and rating. 2 columns on phones, 4 on wide screens.

### Share by text
- Primary action is "Share by text"; secondary are "More options" and "Copy link" (outline). Always say the text is not sent until the host hits send.
- QR code uses pine green on white inside a card.

### Guest booking
- Price summary card: plain rows (Guests, Subtotal, Service fees, Total); the total is bold. Fees always show, even at $0.
- "Who's booking?" card: an outline button for sign-in, then guest fields. Notices use the soft peach notice box, in plain language, and say whether anything was charged.
- Empty or retired states: one sentence plus one link back to /experiences. No placeholder data.

### Affiliate accounting screens
- Cream background, pine text, max-width 375px phone canvas for host/vendor ledgers (admin summary may use max-w-3xl).
- Status chips use `Badge variant="outline"` with `ledgerStatusTone` — no gradient money amounts.
- Summary cards are flat `border-border/60` Cards; avoid brand/hot gradient fills on new earnings tiles.
- Empty states: icon + short plain sentence, no fake sample bookings.

### Vendor account screens (/admin/vendors/new, /set-password, /vendor/account-email)
- `src/pages/auth/vendor-accounts.css`: cream #f8f3e7 page, frosted card, Georgia regular-weight titles in pine #153d30, pill pine buttons, ghost button for Skip / secondary.
- Credentials show in monospace with a Copy button. Steps show a small "Step 1 of 2" label; optional steps say "optional" and have "Skip for now".
