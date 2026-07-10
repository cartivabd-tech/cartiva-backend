# TODO (Cartiva) — Vercel + MongoDB production fixes

## Backend (server/)
- [x] Fix Mongo connection handling for Vercel serverless cold starts (cache connection/promise; avoid race conditions).
- [x] Remove insecure auth bypass for `/api/products` and `/api/products/:id` and `/api/settings` (require Bearer admin token).
- [x] Fix/standardize `/api/products` & `/api/settings` so auth middleware is always enforced.
- [ ] Ensure `/api/orders` request validation matches Mongoose `Order` schema.


## Frontend
- [ ] Fix `checkout.html` broken/duplicated inline JS: currently it seems to include order form logic directly and may be corrupted.
- [ ] Ensure checkout JS sends payload fields that match backend Order schema.

## Config
- [ ] Ensure required env vars documented: `MONGODB_URI`, `JWT_SECRET`, `ORIGIN`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`.
- [ ] Confirm `vercel.json` routing works for `/api/*`.

