# TODO - Cartiva (Login + Orders + MongoDB reliability)

- [ ] Fix/verify Google login flow end-to-end (frontend -> /api/auth/google -> JWT -> protected customer pages).
- [ ] Ensure user model supports googleId/name/picture/authProvider required by /api/auth/google and /api/me/customer.
- [ ] Add missing `/api/auth/google` frontend UI on login.html (Google Sign-In button).
- [ ] Resolve MongoDB disconnect/reconnect issue for Vercel serverless (single cached mongoose connection, no forced disconnects).
- [ ] Verify orders always saved to MongoDB and show in admin panel (remove auth gating if needed, validate payload schema).
- [ ] Confirm admin panel reads `/api/admin/orders` correctly.
- [ ] Run local test: start server, place order, verify it appears in admin orders list.


