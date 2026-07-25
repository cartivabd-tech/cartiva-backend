## Summary

Fixes the critical HTTP 500 error affecting all API endpoints on Vercel production.

### Changes

1. **CORS Fix** (primary issue)
   - Added null-guard in `buildCorsOptions` to handle `undefined` `req` parameter
   - Prevents `TypeError: Cannot read properties of undefined (reading 'header')` crash
   - Gracefully falls back to ORIGIN env-based or permissive CORS

2. **New Admin API Routes**
   - `PATCH /api/admin/orders/:id` - Update order status with validation
   - `GET /api/admin/stats` - Dashboard statistics (products, orders, revenue)
   - `POST /api/admin/reset` - Database reset for testing

3. **Minor Fix**
   - Added `message` field to `/api/health` response for test compatibility

### Testing
All 52 tests pass across 6 test suites with 0 failures.
