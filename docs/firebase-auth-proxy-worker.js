// Cloudflare Worker: route  getxh.in/__/auth/*   ->  Firebase's own auth pages.
// Keeps the Google sign-in popup on getxh.in instead of getxh-42588.firebaseapp.com.
const FIREBASE_HOST = "getxh-42588.firebaseapp.com";

export default {
  async fetch(request) {
    const url = new URL(request.url);
    // Only Firebase's auth helper pages are forwarded; anything else is not served by this Worker.
    if (!url.pathname.startsWith("/__/auth/") && !url.pathname.startsWith("/__/firebase/")) {
      return new Response("Not found", { status: 404 });
    }
    url.hostname = FIREBASE_HOST;
    url.protocol = "https:";
    url.port = "";
    return fetch(new Request(url.toString(), request));
  },
};
