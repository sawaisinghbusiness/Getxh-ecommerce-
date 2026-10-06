# Google sign-in shows "getxh.in" instead of "getxh-42588.firebaseapp.com"

The site is on GitHub Pages, which cannot serve Firebase's `/__/auth/*` pages. A Cloudflare Worker passes
`getxh.in/__/auth/*` through to Firebase, and every page uses `authDomain: "getxh.in"`.

## Set up, in this order (the website change must be merged LAST)

1. **Cloudflare → Workers & Pages → Create → Worker**, paste `docs/firebase-auth-proxy-worker.js`, deploy.
   Then Worker → Settings → Domains & Routes → **Add route** `getxh.in/__/auth/*` (zone `getxh.in`).
   The DNS record for `getxh.in` must be proxied (orange cloud).
2. Check in a browser: `https://getxh.in/__/auth/handler` must show a blank/Firebase page, not a GitHub 404.
3. **Google Cloud Console → APIs & Services → Credentials →** the "Web client (auto created by Google Service)"
   → **Authorized redirect URIs → Add** `https://getxh.in/__/auth/handler` → Save.
   (The Authorized JavaScript origins can also get `https://getxh.in`.)
4. **Firebase Console → Authentication → Settings → Authorized domains**: `getxh.in` must be in the list.
5. Merge the website change, then try Google sign-in in a private window.

If anything goes wrong, change `authDomain` back to `getxh-42588.firebaseapp.com` (nothing else depends on it).
