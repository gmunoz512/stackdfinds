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

### Affiliate / payout screens
- Wrap pages in `stackd-ledger` and import `src/styles/ledger.css` (cream `#f8f3e7`, pine `#153d30`, Georgia serif headings at light weight).
- Max-width 375px phone canvas for host/vendor ledgers (admin summary may use max-w-3xl).
- Status chips use `Badge variant="outline"` with `ledgerStatusTone` — Upcoming / Released (not "fees owed"). No gradient money amounts.
- Summary cards are flat `border-border/60` Cards (`.ledger-card`); avoid brand/hot gradient fills on new earnings tiles.
- Empty states: icon + short plain sentence, no fake sample bookings.
- Show the release date (reservation + 24h) on upcoming lines.

### Vendor account screens (/admin/vendors/new, /set-password, /vendor/account-email)
- `src/pages/auth/vendor-accounts.css`: cream #f8f3e7 page, frosted card, Georgia regular-weight titles in pine #153d30, pill pine buttons, ghost button for Skip / secondary.
- Credentials show in monospace with a Copy button. Steps show a small "Step 1 of 2" label; optional steps say "optional" and have "Skip for now".
- First login also shows `VendorSetupSteps`: Password, then Email (optional), then How you get paid (optional). The current step is a filled pine circle.

### Focus, press, and photos
- Keyboard focus is a 2px pine `#153d30` ring (`src/styles/polish.css`), with a light ring in night mode. Do not invent a second focus color.
- Cards that can be pressed (`.reference-listing`, `.guide-photo-tile`, `.stackd-card`) ease down to 0.985 scale. No bounce. `@media (prefers-reduced-motion: reduce)` removes the move.
- Network photos use `FadePhoto`: a cream wash, then a 480ms opacity fade. Vendor photos never use emoji; a missing photo stays initials or a simple icon.

### Forms and dialogs
- Sign-in, set-password, and add-email errors use a clay box (`role="alert"`) and a warm field border. Success uses a pale green box (`role="status"`).
- Booking cancel dialogs are cream panels with a Georgia regular title. "Keep this booking" is the pine button. "Cancel booking" is the quiet clay button. No zoom, no confetti rain.

### Experience catalog
- Page background stays cream `#f8f3e7`. Headings are Georgia at regular weight in pine `#153d30`. Card titles stay on one line and ellipsize.
- Experience cards show the title, then the business name, then the category. Rating and review count appear only when that listing has them. No `$0`, no empty description, no placeholder price.
- Photos are local files. The business tile and the business page use the top experience’s main photo. If a photo is missing or broken, show the cream initials tile (`#f3ebdd`, pine letters). Never an emoji, never a hotlinked image.
- Category chips scroll sideways. “Show more” is a pine outline pill. Night mode keeps a dark initials tile and a light outline on that pill.

### Payout totals
- Released is the large Georgia figure. Upcoming is the smaller number under it, with a one-line note. Same on `/vendor/affiliate` and `/host/earnings`. Amounts stay in `formatLedgerMoney`.
