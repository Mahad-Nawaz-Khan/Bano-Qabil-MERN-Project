# GHALIB Restaurant — Full-Stack App

A 3-app MERN stack: customer-facing website, admin dashboard, and Express API.

```
Bano-Qabil-MERN-Project/
  customer/   -> public website (Home, About, Reservation, Cart, Checkout, Orders, Auth)
  admin/      -> admin dashboard (Menu/Category CRUD, Orders, Reservations, Auth)
  backend/    -> Express + MongoDB API (auth, menu, cart, orders, reservations, email)
```

## Deployment Architecture

| App | Hosting | Notes |
|---|---|---|
| `customer/` | Vercel | SPA — needs `vercel.json` rewrite to `index.html` |
| `admin/` | Vercel | SPA (HashRouter) — no rewrites needed |
| `backend/` | Render | Set `NODE_ENV=production`, `TRUST_PROXY=1` |

> **Cross-origin setup**: Because the frontend (Vercel) and backend (Render) are on different domains, set `COOKIE_SAMESITE=none` in `backend/.env` and set `VITE_API_URL` to the Render backend URL when building the frontends.

## Run Locally (3 terminals)

```bash
# 1. Backend
cd backend
npm install
cp .env.example .env   # fill in MONGODB_URI, JWT secrets, SMTP creds, Cloudinary keys
npm run dev             # http://localhost:5000

# 2. Customer site
cd customer
npm install
npm run dev              # http://localhost:5173

# 3. Admin dashboard
cd admin
npm install
npm run dev               # http://localhost:5174
```

## Environment Variables

See [`backend/.env.example`](backend/.env.example) for all backend variables. Key ones:

| Variable | Required | Purpose |
|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `JWT_ACCESS_SECRET` | ✅ | JWT signing key for access tokens |
| `REFRESH_TOKEN_PEPPER` | ✅ | HMAC key for refresh token hashing |
| `CLIENT_ORIGIN` | Production ✅ | Comma-separated allowed origins for CORS |
| `APP_URL` | Production ✅ | Customer app URL (used in email links) |
| `COOKIE_SAMESITE` | Production ✅ | Set to `none` for cross-origin (Vercel+Render) |
| `CLOUDINARY_*` | Production ✅ | Cloudinary image hosting credentials |
| `SMTP_HOST/PORT/USER/PASS` | Optional | Email delivery (falls back to console in dev) |
| `TRUST_PROXY` | Recommended | Set to `1` behind Render/Vercel proxy |

Frontend apps use `VITE_API_URL` (see `customer/.env.example` and `admin/.env.example`).

## Backend API Overview

### Auth (`/api/auth`)
- `POST /register` / `login` / `logout` / `logout-all`
- `POST /refresh` (refresh token rotation)
- `GET /me` / `PATCH /me`
- `POST /verify-email` / `resend-verification`
- `POST /forgot-password` / `reset-password` / `change-password`

### Menu (`/api`)
- `GET /menu` (public, grouped by category)
- `GET/POST/PATCH/DELETE /categories` (admin)
- `GET/POST/PATCH/DELETE /menu-items` (admin)
- `POST /menu-images` (admin, Cloudinary upload)

### Cart (`/api/cart`)
- `GET /` / `POST /items` / `PATCH /items/:id` / `DELETE /items/:id`
- `POST /merge` (merges guest cart on login)
- `DELETE /` (clear)

### Orders (`/api/orders`)
- `POST /` — place order (requires verified email + idempotency key)
- `GET /` / `GET /:id` — customer's orders
- `POST /:id/cancel` — customer cancel (pending/confirmed only)
- `GET /admin/all` / `PATCH /:id/status` — admin management

### Reservations (`/api/reservations`)
- `POST /` — create reservation
- `GET /` — customer's reservations
- `POST /:id/cancel` — customer cancel
- `GET /admin/all` / `PATCH /:id/status` — admin management

### Health
- `GET /api/health` — returns `{ ok, db }`, 503 if DB is down

## Security Features

- **Refresh token rotation** with family-based revocation (replay detection)
- **Rate limiting** (global 300/15min + credential-specific 10/min)
- **Helmet** security headers
- **CSRF origin checks** on state-changing requests
- **Zod validation** on all routes
- **Account lockout** after 5 failed login attempts (15 min)
- **Email verification** required before placing orders
- Access tokens in memory (not localStorage) — XSS-resistant
- Passwords hashed with bcrypt (10 rounds) + timing-safe dummy hash

## Notes
- Email (verification, password reset, order/reservation notifications) via SMTP through `nodemailer` — needs Gmail **App Password** or equivalent. See `backend/.env.example`.
- `customer/public/images` and `admin/public/images` both hold copies of shared logo/background images.
- The seed script (`npm run seed`) uses GridFS; run `npm run migrate:cloudinary` afterwards to move images to Cloudinary.
