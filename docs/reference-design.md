# Tulum mobile reference implementation

The supplied three-screen reference governs the experience catalog, planner form, and join screen. All interface text and controls are native React components. `ReferencePhoto` displays only the photographic regions from the supplied reference, using CSS positioning, for the isolated preview and static onboarding imagery. The app chrome is never a screenshot.

`src/assets/tulum-reference.jpeg` is the user-supplied visual reference. `src/assets/tulum-watercolor.png` is a generated background asset based on the reference: warm ivory parchment, detailed botanical palm edges, pale turquoise sea, distant Tulum ruins, blank upper area, and no interface or text. Generated with the built-in image generation tool.

Live configured builds read published listings from the existing public Supabase view. Unconfigured visual previews use explicitly sample inventory and prices transcribed from the supplied design. AI generation is unavailable without the original service configuration. The planner keeps the existing sendMessage pipeline when configured. Date, traveler, budget, search, category, menu, and save controls are interactive. In the preview, My Stackd reflects locally saved sample records. Production auth and reservation helpers are retained.
