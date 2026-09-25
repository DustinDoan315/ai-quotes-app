# Invite links

Inkly now generates one public invite URL per user:

```text
https://inkly-web-taupe.vercel.app/invite/<code>
```

The same URL is used by the Friends share sheet and QR code. Installed builds
receive it through iOS Universal Links or Android App Links and route to
`/invite/[code]`. A browser fallback redirects to the published App Store
listing.

## Deployment requirements

Deploy the web export from this repository to the Vercel project that owns
`inkly-web-taupe.vercel.app`. The export includes:

- `/.well-known/apple-app-site-association`
- `/.well-known/assetlinks.json`
- `/invite.html`
- `vercel.json`, which rewrites `/invite/<code>` to `/invite.html`

The iOS association file uses Team ID `6SXWS6JV43` and bundle ID
`com.dustindoan.inkly`.

The checked-in Android project currently signs local debug and local release
builds with `android/app/debug.keystore`, and the EAS production keystore
fingerprint is also included. If Google Play re-signs the published app with
a different Play App Signing certificate, add that SHA-256 fingerprint to
`public/.well-known/assetlinks.json` and redeploy the web host.

If the Vercel project is not controlled by the Inkly team, use a domain or
Vercel project that is controlled by the team and set
`EXPO_PUBLIC_INVITE_WEB_ORIGIN` to that origin before building the app.
