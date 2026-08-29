# Sri RR Crackers — Bilingual Fireworks Catalogue & Estimate Website

A responsive, bilingual (English/Tamil) fireworks product catalogue and
estimate-request website with a full admin panel, built to the Version 1
specification in `PROJECT_SPEC.md`.

This is **not an online store** — customers browse products, build an
"Estimate" list, and submit their details. The business team follows up by
phone/WhatsApp to confirm pricing, availability and delivery. No online
payment is included, matching the agreed Version 1 scope.

---

## 1. What's included

**Customer website**
- Home, Products (search/filter/sort/pagination), Category pages, Product
  detail, My Estimate (cart), Customer details form, Confirmation page,
  About, Contact, Safety, Privacy Policy, Terms & Conditions
- English/Tamil language switcher (persisted), Tamil font support
- Fully responsive (mobile-first), premium festive design using the brand
  colour palette and your supplied logo
- Floating WhatsApp button + WhatsApp links on product pages

**Admin panel** (`/admin`)
- Secure login (JWT + bcrypt password hashing + login rate-limiting)
- Dashboard with key stats and recent estimates
- Product management: create/edit/activate/deactivate/delete, feature
  toggle, pricing (original + discounted), bilingual fields
- Category management: create/edit/activate/deactivate/delete
- Estimate management: search/filter by status, detail view, status
  workflow (NEW → CONTACTED → CONFIRMED → COMPLETED/CANCELLED), admin notes
- Customer directory with estimate history
- Website settings (business info, phone, WhatsApp number, address,
  business hours, social links, Google Maps embed)

**Backend**
- REST API under `/api/v1`, versioned, with a consistent response format
- Server-side price re-validation on every estimate (never trusts the
  browser), with **historical price locking** so future price changes never
  alter a past estimate
- Rate limiting on login and estimate submission, Helmet security headers,
  CORS allow-list, centralized error handling

---

## 2. Tech stack

| Layer      | Technology |
|------------|------------|
| Frontend   | React 19 + Vite + Tailwind CSS v4 + React Router + i18next |
| Backend    | Node.js + Express |
| Database   | SQLite via Node's built-in `node:sqlite` (dev) — see §5 for MySQL |
| Auth       | JWT + bcrypt (admin only; no customer accounts, per spec) |

### Why SQLite instead of MySQL/Prisma for local dev?

The original plan (see `Sri_RR_Crackers_Claude_Development_Guide.md`) calls
for MySQL + Prisma + XAMPP. This build uses Node 22's built-in `node:sqlite`
module instead, purely so the project **runs immediately with zero external
setup** (no MySQL server, no native binary downloads). All database access
goes through a small repository layer (`backend/src/repositories/`), so the
route/controller code never touches SQL directly — swapping the data layer
for MySQL (via `mysql2` or Prisma) does not require touching business logic.
See `docs/DATABASE.md` for the swap guide.

---

## 3. Quick start (local development)

**Requirements:** Node.js **22.5+** (for `node:sqlite`) or Node 24 LTS as
originally targeted — either works. Check with `node -v`.

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run seed     # creates the SQLite DB, sample data, and admin user
npm run dev       # starts API on http://localhost:5000
```

Seed output gives you the demo admin login:
```
username: admin
password: Admin@123   <-- CHANGE THIS BEFORE PRODUCTION
```

### Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev       # starts the site on http://localhost:5173
```

The Vite dev server proxies `/api` to `http://localhost:5000` automatically
(see `frontend/vite.config.js`), so just open **http://localhost:5173**.

Admin panel: **http://localhost:5173/admin/login**

---

## 4. Project structure

```
sri-rr-crackers/
├── backend/
│   ├── data/app.db              ← SQLite database file (created on first run)
│   ├── prisma/seed.js           ← seed script (name kept for continuity with spec)
│   └── src/
│       ├── app.js, server.js
│       ├── config/db.js         ← database connection + schema
│       ├── repositories/        ← all SQL lives here
│       ├── routes/              ← public, estimate, admin, admin.auth
│       └── middleware/          ← auth, error handling
├── frontend/
│   └── src/
│       ├── pages/public/        ← customer-facing screens
│       ├── pages/admin/         ← admin panel screens
│       ├── components/          ← layout, product, admin, common
│       ├── context/             ← Estimate (cart), Auth, Settings
│       ├── services/api.js      ← single Axios client, all API calls
│       └── i18n/                ← en.json / ta.json translations
└── docs/
    ├── DATABASE.md
    ├── API.md
    └── DEPLOYMENT.md
```

---

## 5. Replacing placeholder content (IMPORTANT before launch)

Everything works out of the box with **sample data** so you can see the
whole flow immediately. Before going live, replace it via the **admin
panel** (no code changes needed):

- [ ] Final product list, codes, prices, discounts, units
- [ ] Final Tamil names/descriptions (do not rely on machine translation)
- [ ] Product images (upload to your own image host / CDN and paste the URL,
      or extend the admin form with a file-upload endpoint — see §7)
- [ ] Business settings: phone numbers, WhatsApp number, email, address,
      business hours, Google Maps embed link, social links
- [ ] About / Contact / Safety copy (currently placeholder text, clearly
      marked in the page source)
- [ ] Privacy Policy & Terms & Conditions (currently generic placeholder —
      have these legally reviewed)
- [ ] Change the default admin password immediately

---

## 6. Deployment

See `docs/DEPLOYMENT.md` for the full guide covering:
- Switching the database to production MySQL
- Building the frontend (`npm run build` → static files)
- Running the backend under a process manager (PM2) or Hostinger's Node.js
  app runner
- Environment variables checklist
- Domain, SSL, CORS configuration

---

## 7. What's next / not included in this build

This is a complete, working Version 1 foundation. A few things are flagged
as "next steps" rather than built now, matching the spec's own phased
approach:

- **Image uploads**: the admin product/category forms currently take an
  **image URL** (works well with any image host or CDN). A file-upload
  endpoint (multer + image resizing) can be added as the next increment —
  it's a self-contained addition to `backend/src/routes/admin.routes.js`.
- **MySQL migration**: see `docs/DATABASE.md` — the repository layer makes
  this a data-layer-only change.
- **Swagger/OpenAPI docs, automated tests**: `docs/API.md` documents every
  endpoint manually for now; formal Swagger + a test suite are natural
  Milestone 2 additions per the original development guide.
- Everything explicitly marked **out of scope for V1** in
  `PROJECT_SPEC.md` (online payment, WhatsApp API, customer accounts,
  delivery tracking, etc.) has intentionally **not** been built.

---

## 8. Support docs carried over from planning

Your original planning documents are included for reference:
- `PROJECT_SPEC.md` — full business/functional specification
- `Sri_RR_Crackers_Claude_Development_Guide.md` — original Claude Code
  development playbook (useful if you continue building with Claude Code
  milestone-by-milestone from here)
