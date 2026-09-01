# GHALIB Restaurant — React Version

## Menu admin and API

The public menu reads from `GET /api/menu` when the API is running and uses the existing bundled menu while it is unavailable.

1. Copy `backend/.env.example` to `backend/.env` and set your own valid `MONGODB_URI`.
2. Run `npm install` inside `backend`, then `npm run seed` to upload assets and populate the menu.
3. Run `npm run dev` in the root project for the public website (`http://localhost:5173`).
4. Run `npm run dev:admin` separately for the admin website (`http://localhost:5174/admin.html`).

Login and signup are intentionally not included. The public website has no admin route or admin navigation. Once the other team member's authentication is available, protect the POST, PATCH, and DELETE routes in `backend/src/routes/menuRoutes.js` with their middleware.

Original static HTML/CSS/JS project converted to React (Vite + React Router).
3 pages only: **Home** (menu/cards), **About Us**, **Reservation**.

## Structure

```
src/
  components/
    Navbar.jsx     -> shared navbar (was repeated in every .html file)
    Footer.jsx      -> shared footer (was repeated in every .html file)
    Card.jsx        -> one product card (was copy-pasted 43 times in index.html)
    OrderPopup.jsx  -> "Order Now" popup
  data/
    menuData.js     -> all 43 menu items, extracted from index.html, grouped by category
  pages/
    Home.jsx
    AboutUs.jsx
    Reservation.jsx
```

## Run it

```bash
npm install
npm run dev
```

Then open the printed localhost URL.

## Note about images

The original project's zip only contained `logo.png`, `logo.jpg.jpeg`,
`backgroundimage.jpeg`, `backgroundimage.jpg.jpeg`, `background1.png` and
`pre-loader.jpeg` — the actual food photos (e.g. `Arabian-Feast-Platter...jpg`)
referenced in `data-img` were never in the zip, so they'll fail to load here
too. `Card.jsx` and `OrderPopup.jsx` fall back to the logo when an image
errors out, so the layout still looks fine. Drop the real photos into
`public/images/` (same filenames as in `src/data/menuData.js`) to fix this.
