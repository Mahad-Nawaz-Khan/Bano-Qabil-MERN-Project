# GHALIB Restaurant

A MERN restaurant site: a public storefront (menu, cart, checkout, order history) and a separate staff admin app (menu management, order pipeline), backed by one Express + MongoDB API with token-based auth.

Two Vite bundles share one `src/`:

| Bundle | Dev URL | Entry | Router |
|---|---|---|---|
| Public site | `http://localhost:5173` | `index.html` → `src/main.jsx` | `BrowserRouter` |
| Admin app | `http://localhost:5174/admin.html` | `admin.html` → `src/admin-main.jsx` | `HashRouter` |

Both proxy `/api` to the API on `http://localhost:5000`.

---

## Quick start

```bash
cd backend && npm install && cd .. && npm install
```

1. Copy `backend/.env.example` to `backend/.env` and fill it in (see [Environment](#environment)).
2. Seed the menu and the first admin:
   ```bash
   cd backend && npm run seed && npm run seed:admin
   ```
3. Start the API, then each front end, in three terminals:
   ```bash
   cd backend && npm run dev
   ```
   ```bash
   npm run dev
   ```
   ```bash
   npm run dev:admin
   ```

The public menu reads `GET /api/menu` and falls back to the bundled `src/data/menuData.js` when the API is unreachable, so the site never blanks out. Cart and checkout are server-backed and are simply unavailable in that offline state.

## Environment

`backend/.env` — every key is documented inline in `backend/.env.example`.

| Key | Notes |
|---|---|
| `MONGODB_URI` | Atlas or local. Checkout avoids transactions, so a standalone `mongod` is fine. |
| `PORT`, `NODE_ENV` | |
| `CLIENT_ORIGIN` | **Comma-separated allowlist.** Anything else is rejected by CORS and by the same-origin guard. Empty in production means *nothing* is allowed — it fails closed. In development it falls back to the two Vite ports. |
| `APP_URL` | Storefront base URL used to build links inside emails. |
| `TRUST_PROXY` | Number of reverse proxies in front of the API. `0` locally. Wrong values break rate limiting. |
| `JWT_ACCESS_SECRET` | Signs access tokens. |
| `REFRESH_TOKEN_PEPPER` | Refresh tokens are HMAC'd with this before storage — a database dump alone cannot be replayed. |
| `ACCESS_TOKEN_TTL`, `REFRESH_TOKEN_TTL_DAYS` | Default `15m` / `30`. |
| `COOKIE_SAMESITE` | `lax` for a same-site deploy, `none` (implies `Secure`, so HTTPS only) when the API is on a different site. |
| `SMTP_*`, `MAIL_FROM` | See below. |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Used by `npm run seed:admin`. |

Generate the secrets:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

The root `.env.example` holds only `VITE_API_URL=/api`. Vite bakes `VITE_*` values into the bundle at build time, so never put a secret there.

### Email (Gmail SMTP)

`nodemailer` sends verification and password-reset mail through `smtp.gmail.com:465`.

1. Turn on 2-Step Verification for the sending Google account.
2. Create an App Password at <https://myaccount.google.com/apppasswords>.
3. Put the address in `SMTP_USER` and the 16-character App Password in `SMTP_PASS`.

Leave `SMTP_USER`/`SMTP_PASS` empty in development: registration and password reset still succeed, and the link is printed to the API console instead of being emailed.

## Auth flow

- **Access token** — JWT (HS256, 15 min) returned in the JSON body and kept **in React memory only** (`src/services/apiClient.js`). It is never written to `localStorage`, so XSS cannot read it. It dies with the tab.
- **Refresh token** — opaque 256-bit random value in an `httpOnly` cookie scoped to `/api/auth`, hashed at rest, valid 30 days.
- **Rotation** — every `POST /api/auth/refresh` issues a new refresh token and revokes the old one.
- **Reuse detection** — presenting an already-revoked token means it was stolen, so the *entire token family* is revoked, the cookie is cleared, and the response is `401`. All sessions from that login are gone.
- **Silent refresh** — `apiClient` retries a `401` exactly once after refreshing. Concurrent 401s share a single in-flight refresh promise, so an expired token cannot trigger a request storm.
- **`requireAuth` re-reads the user from the database**, so a role change or deletion takes effect immediately rather than at token expiry.

Additional hardening: `helmet`, a strict CORS allowlist with `credentials: true`, an `Origin`/`Referer` check on every state-changing request (CSRF), `zod` validation that strips unknown keys, 100 req/15 min globally and 10 req/min on `/api/auth/*`, and a 15-minute account lockout after 5 failed logins.

`role` is **never** read from a request body. Public signup always creates a `customer`; the only way to get an `admin` is `npm run seed:admin`.

## Cart and orders

- A signed-out visitor's cart lives in `localStorage`. On login or signup it is `POST`ed to `/api/cart/merge`, quantities are summed per dish, **every price is re-derived from the database**, and local storage is cleared only after the merge succeeds.
- Cart lines store `{ menuItem, quantity }` — never a price. The cart is re-priced from the database on every read, so a tampered request changes nothing.
- Checkout re-validates each line (still exists, still available, current price), snapshots the priced lines into the order, and recomputes the total server-side. Ordering requires a verified email.
- Status lifecycle: `pending → confirmed → preparing → ready → completed`, with `cancelled` reachable only from `pending` or `confirmed`. Customers may cancel early; admins follow the transition table. Anything else is `409`.
- `GET /api/orders/:id` returns **404** for someone else's order — a `403` would confirm the id exists.

## API

Responses keep one envelope: `{ data }` on success, `{ message }` on error.

| Method | Path | Auth |
|---|---|---|
| `POST` | `/api/auth/register` · `/login` · `/refresh` · `/forgot-password` · `/reset-password` | public |
| `GET` | `/api/auth/verify-email?token=` | public |
| `POST` | `/api/auth/logout` · `/logout-all` · `/change-password` · `/resend-verification` | user |
| `GET`/`PATCH` | `/api/auth/me` | user |
| `GET` | `/api/menu` · `/api/categories` · `/api/menu-items` | public |
| `POST`/`PATCH`/`DELETE` | `/api/categories`(`/:id`) · `/api/menu-items`(`/:id`) | **admin** |
| `GET`/`DELETE` | `/api/cart` | user |
| `POST` | `/api/cart/items` · `/api/cart/merge` | user |
| `PATCH`/`DELETE` | `/api/cart/items/:menuItemId` | user |
| `POST` | `/api/orders` | user + verified |
| `GET` | `/api/orders` · `/api/orders/:id` | owner |
| `POST` | `/api/orders/:id/cancel` | owner |
| `GET` | `/api/orders/admin/all?status=&page=&limit=` | admin |
| `PATCH` | `/api/orders/:id/status` | admin |

## Scripts

| Where | Command | Does |
|---|---|---|
| `backend` | `npm run dev` | API with `--watch` |
| `backend` | `npm run seed` | Uploads assets and populates menu items and categories |
| `backend` | `npm run seed:admin` | Upserts the admin from `ADMIN_*`; safe to re-run |
| `backend` | `npm run smoke` | Boots the app without a database and asserts the security posture (guards, headers, CORS rejection, validation) |
| root | `npm run dev` / `npm run dev:admin` | Public site / admin app |
| root | `npm run build` / `npm run build:admin` | `dist/` / `dist-admin/` |

## Structure

```
backend/src/
  app.js                 createApp() — middleware stack and route mounting
  server.js              connect, listen, graceful shutdown
  config/db.js
  models/                User RefreshToken Cart Order Category MenuItem
  controllers/           auth cart order menu
  services/              authService tokenService emailService cartService
  middleware/            auth validate rateLimit security
  routes/                auth cart order menu assets
  utils/errors.js        AppError asyncHandler requireId
  seed/                  seedMenu seedAdmin
backend/scripts/smoke.mjs

src/
  services/              apiClient authApi cartApi orderApi menuApi guestCart
  context/               AuthContext CartContext
  hooks/                 useAuth useCart
  components/            Navbar Footer Card OrderPopup CartDrawer CartLines
    auth/RequireAuth.jsx RequireAuth RequireVerified RequireAdmin
  pages/                 Home AboutUs Reservation
                         Login Register VerifyEmail ForgotPassword ResetPassword
                         Cart Checkout Orders OrderDetail Profile
    admin/               AdminLayout AdminLogin AdminOrders
  data/menuData.js       offline fallback menu
  utils/format.js
```

`app.js` is split from `server.js` so the whole middleware stack can be exercised without a database — that is what `npm run smoke` does.

## Note about images

The original project's zip only contained `logo.png`, `logo.jpg.jpeg`, `backgroundimage.jpeg`, `backgroundimage.jpg.jpeg`, `background1.png` and `pre-loader.jpeg` — the food photos referenced in `data-img` were never included, so they fail to load here too. `Card.jsx` and `OrderPopup.jsx` fall back to the logo when an image errors out, so the layout still holds. Drop the real photos into `public/images/` using the filenames in `src/data/menuData.js` to fix this, or upload them with `npm run seed`, which stores them in GridFS and serves them from `/api/assets`.
