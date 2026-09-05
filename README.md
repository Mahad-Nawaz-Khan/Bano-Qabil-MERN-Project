# GHALIB Restaurant — Full-Stack App

Structure now matches a standard 3-app layout:

```
Bano-Qabil-MERN-Project/
  customer/   -> public website (Home, About, Reservation, Cart, Checkout, Orders, Auth)
  admin/      -> admin dashboard (Menu/Category CRUD, Orders management, Auth)
  backend/    -> Express + MongoDB API (auth, menu, cart, orders, email notifications)
```

## Run Everything (3 terminals)

```bash
# 1. Backend
cd backend
npm install
cp .env.example .env   # then fill in MONGODB_URI, JWT secrets, EMAIL_USER, EMAIL_PASS
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

## Backend API Overview

### Auth
- `POST /api/auth/register` / `login` / `logout` / `logout-all`
- `POST /api/auth/refresh` (refresh token rotation)
- `GET /api/auth/me` / `PATCH /api/auth/me`
- `POST /api/auth/verify-email` / `resend-verification`
- `POST /api/auth/forgot-password` / `reset-password`
- `POST /api/auth/change-password`

### Menu
- `GET /api/menu` (public)
- `GET/POST/PATCH/DELETE /api/categories` (admin)
- `GET/POST/PATCH/DELETE /api/menu-items` (admin)

### Cart
- `GET /api/cart` / `POST /api/cart/items` / `PATCH/DELETE /api/cart/items/:id`
- `POST /api/cart/merge` (merges guest cart on login)
- `DELETE /api/cart` (clear)

### Orders
- `POST /api/orders` / `GET /api/orders` / `GET /api/orders/:id`
- `PATCH /api/orders/:id/cancel` (customer)
- `GET /api/orders/admin` / `PATCH /api/orders/:id/status` (admin)

## Security Features

- **Refresh token rotation** with family-based revocation (replay detection)
- **Rate limiting** (global + credential-specific)
- **Helmet** security headers
- **CSRF origin checks** on state-changing requests
- **Zod validation** on all auth & cart routes
- **Account lockout** after 5 failed login attempts

## Notes
- Email (verification, password reset, order confirmation, admin alerts, status updates) is sent via Gmail SMTP through `nodemailer` — needs a Gmail **App Password**, see `backend/.env.example`.
- `customer/public/images` and `admin/public/images` both hold a copy of the shared logo/background images.
- Reservations are stored in `localStorage` as an accumulating array via the `reservationStorage` service.
