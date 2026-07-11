# TODO

- [ ] Review server MongoDB connection code in `server/index.js` and identify connection-blocking / retry issues
- [x] Refactor `connectToDatabase()` to be retry-safe (clear cached promise on failure)

- [x] Add Mongoose connection timeouts/options for clearer failure modes

- [x] Avoid blocking *every* request with DB connection (limit middleware to API routes / health)

- [ ] Ensure `/api/health` returns meaningful status
- [ ] Run local tests: `cd server && npm install && npm start`
- [ ] Validate endpoints: `GET /api/health`, auth routes, product/admin routes

