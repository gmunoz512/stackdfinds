# Vendor email routing — NOT NEEDED

Vendors now sign in with a username (see FEATURES.md, "Vendor accounts").
Their login uses a hidden `<username>@vendors.stackdfinds.com` address that
never receives mail, so no Cloudflare MX, SPF, DKIM or forwarding is required.
Nothing from the earlier plan was applied. Vendors who want email can add their
own address from /vendor/account-email.
