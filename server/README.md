# Cartiva Backend (Express + MongoDB)

## Local development
1. Install dependencies in `server/`
   ```bash
   npm install
   npm start
   ```
2. Copy env:
   ```bash
   cp .env.example .env
   ```
3. Set:
   - `MONGODB_URI` (MongoDB Atlas connection string)
   - `JWT_SECRET` (any strong secret)
   - optional `ORIGIN`

Default admin credentials (from `.env.example`):
- username: `abid`
- password: `cartivabd`

## API
- `GET /api/health`
- Customer auth:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/me/customer` (requires customer token)
- Admin auth:
  - `POST /api/admin/login`
- Store:
  - `GET /api/store`
  - `POST /api/products` (admin)
  - `DELETE /api/products/:id` (admin)
  - `POST /api/settings` (admin)
- Orders:
  - `POST /api/orders` (customer)
  - `GET /api/admin/orders` (admin)

