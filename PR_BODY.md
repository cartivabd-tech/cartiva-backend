## Summary

Fix Google Sign-In integration, login button visibility on the shop page, and checkout HTML structure issues.

## Changes

### 🧑‍💻 Google Sign-In (Customer Authentication)
- **`login.html`**: Added Google Sign-In button using Google Identity Services (GIS) with proper `g_id_onload` and `g_id_signin` elements
- **`js/google-config.js`**: Configured with actual Google Client ID (`29786920881-eek1m6qr22fscqnvm646pv3idvfcth9t.apps.googleusercontent.com`)
- **`server/models/User.js`**: Added `googleId`, `name`, `picture`, and `authProvider` fields to support Google-authenticated users
- **`server/index.js`**: Updated `/api/auth/google` endpoint with robust credential verification, account linking (existing email/password accounts can now sign in with Google), and fresh profile syncing

### 🔐 Login Pill Visibility
- **`index.html`**: Fixed the Login pill (`#authPill`) to always be visible in the nav bar (`display: inline-flex`), ensuring users can always find the login link regardless of screen size or other conditions

### 🛠️ Checkout HTML Fix
- **`checkout.html`**: Fixed malformed HTML structure — the `<div class="topbar">` element was missing its closing `</div>` tag, which broke the layout. Also fixed template literal issues in `calculateAndRenderSummary`

### 🧹 Housekeeping
- **`TODO.md`**: Updated progress tracking for the Google Login & Order Fix implementation

## Testing Notes
- Google Sign-In flow works end-to-end: frontend sends credential → backend verifies with Google API → account is created/linked → JWT issued → user redirected to shop
- Guest checkout (no login) continues to work as before
- Admin login unchanged

