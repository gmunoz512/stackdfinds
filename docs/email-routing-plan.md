# Plan: vendor mail for @stackdfinds.com (NOT APPLIED)

Choice: Cloudflare Email Routing (free), catch-all forwarding. No mailboxes; every
`<anything>@stackdfinds.com` lands in German's own inbox. Replies go out from his own
address (forwarding only receives).

Zone: stackdfinds.com, 5baf83279770b99aeccffd5d4562922d. Current web records (GitHub Pages A x4, www CNAME) are untouched. /workspace/dns-backup.json holds the pre-GitHub records.

Steps (need German's OK + which inbox):
1. Add destination address = German's inbox. Cloudflare emails it a verify link; he clicks it.
2. Enable Email Routing on the zone. Cloudflare adds these records (zone currently has no MX/SPF):
   - MX  stackdfinds.com  route1.mx.cloudflare.net  priority ~ (Cloudflare-assigned)
   - MX  stackdfinds.com  route2.mx.cloudflare.net
   - MX  stackdfinds.com  route3.mx.cloudflare.net
   - TXT stackdfinds.com  "v=spf1 include:_spf.mx.cloudflare.net ~all"
   - TXT cf2024-1._domainkey.stackdfinds.com  (DKIM key Cloudflare generates)
3. Catch-all rule: action Forward -> German's inbox, enabled.
4. Test: mail tacosnumerouno@stackdfinds.com, confirm it arrives.

Undo: disable Email Routing, delete the MX/TXT records above.
Note: Supabase sends password-reset mail to the vendor address, so it will reach German, not the vendor, until a vendor changes their login email.
