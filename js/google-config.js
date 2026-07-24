// ============================================================
// Google Sign-In configuration
// ============================================================
// 1. Go to https://console.cloud.google.com/apis/credentials
// 2. Create an "OAuth client ID" -> Application type: "Web application"
// 3. Add your site URL (e.g. https://your-site.com) under
//    "Authorized JavaScript origins" (and http://localhost:5500 etc. for
//    local testing)
// 4. Copy the Client ID it gives you and paste it below.
//
// This value is PUBLIC by design (Google's own docs confirm the Client ID
// is not a secret) — it's safe to ship in frontend code. The backend does
// the actual security-sensitive verification using this same ID via the
// GOOGLE_CLIENT_ID environment variable.
// ============================================================

window.CartivaGoogleClientId = "29786920881-eek1m6qr22fscqnvm646pv3idvfcth9t.apps.googleusercontent.com";
