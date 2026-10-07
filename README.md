# Jyoti Sales — Electronics E-Commerce Platform

Full-stack e-commerce site for **Jyoti Sales** ("Jyoti Television Center"), Rampura Phul, Punjab.
Java 21 / Spring Boot backend, React + Vite + TypeScript frontend, PostgreSQL, JWT auth, and a
pluggable payment-gateway architecture that ships with a sandboxed dummy provider.

```
jyoti-sales/
├── jyoti-sales-backend/     Spring Boot API (Java 21, Postgres, JWT, Flyway)
├── jyoti-sales-frontend/    React 18 + Vite + TS + Tailwind storefront & admin panel
├── docker-compose.yml       One-command startup for all three services
└── .env.example             Copy to .env and fill in real values
```

## Quick start (Docker — recommended)

Requires Docker + Docker Compose.

```bash
cp .env.example .env      # edit values as needed (safe defaults are provided)
docker compose up --build
```

This starts:
- **postgres** on `localhost:5432`
- **backend** on `localhost:8080` (Swagger UI at `http://localhost:8080/swagger-ui.html`)
- **frontend** on `localhost:5173`

Flyway runs automatically on backend startup and seeds demo data (see below). No manual DB setup needed.

## Running locally without Docker

**Backend** (needs Java 21, Maven, a running Postgres instance):
```bash
cd jyoti-sales-backend
createdb jyoti_sales   # or use your own Postgres instance; update application.yml / env vars to match
mvn spring-boot:run
```

**Frontend** (needs Node 20+):
```bash
cd jyoti-sales-frontend
cp .env.example .env    # set VITE_API_BASE_URL if backend isn't on localhost:8080
npm install
npm run dev
```

## Default logins (seeded by Flyway)

| Role     | Email                     | Password      |
|----------|---------------------------|---------------|
| Admin    | admin@jyotisales.in       | Admin@123     |
| Customer | customer@example.com      | Customer@123  |

**Change the admin password immediately in any real deployment.** These are demo credentials only.

## API documentation

Swagger / OpenAPI UI: `http://localhost:8080/swagger-ui.html`
Raw spec: `http://localhost:8080/v3/api-docs`

## Running tests

```bash
# backend (JUnit5 + Mockito)
cd jyoti-sales-backend && mvn test

# frontend (Vitest)
cd jyoti-sales-frontend && npm run test
```

---

## Payment gateway — how it's wired

The checkout flow depends only on the `PaymentGatewayService` interface
(`jyoti-sales-backend/src/main/java/com/jyotisales/service/payment/PaymentGatewayService.java`).
**The currently active provider is `dummy`** (`DummyPaymentGatewayProvider`), controlled by:

```
app.payment.provider=dummy    # application.yml
PAYMENT_PROVIDER=dummy        # env var / .env override
```

### The dummy provider is a sandbox simulator only

- **It is NOT PCI-DSS compliant** and must never be used with real card data or in production as-is.
- No network calls are made to any card network, bank, or UPI switch — everything is simulated
  in-memory with 1–2s artificial latency to mimic a real gateway's feel.
- Test card outcomes are deterministic by seeded value:
  - Card numbers ending in `1111` → **success**
  - Card numbers ending in `0002` → **declined**
  - Any other Luhn-valid 16-digit test number → **success**
  - UPI id `success@upi` → success, `failure@upi` → failure, anything else → success
  - Net banking bank code `FAILBANK` → failure, anything else → success
  - Cash on Delivery → always accepted (settled on delivery in a real flow)
- Every response from the dummy provider is labeled **"TEST MODE"** in both the API payload
  (`testMode: true` on `PaymentResponse`) and the checkout UI.

### Switching to a real gateway (Razorpay / PayU / etc.)

1. Implement `PaymentGatewayService` in a new class, e.g. `RazorpayGatewayProvider`
   (starter template at `jyoti-sales-backend/src/main/resources/payment-provider-templates/RazorpayGatewayProvider.java.template`
   — rename to `.java` and drop it into `service/payment/` to activate).
2. Add the provider's SDK to `pom.xml` and its API keys as env vars.
3. Set `PAYMENT_PROVIDER=razorpay` (or `payu`).
4. **Nothing else changes.** Controllers, services, and the database schema are untouched —
   `PaymentProviderResolver` picks up the new provider automatically by matching `providerName()`
   against the config flag.

The REST endpoints (`POST /api/payments/initiate`, `POST /api/payments/verify`,
`GET /api/payments/{id}/status`) stay identical regardless of which provider is active.

---

## Seed data

Flyway migrations seed:
- `V1__init.sql`: 8 top-level categories (+ 2 TV subcategories), 27 sample products across all
  categories, 2 demo users (1 admin, 1 customer — see login table above), 2 active coupons
  (`WELCOME500`, `DIWALI10`), 2 homepage banners
- `V2__more_products.sql`: 5 additional example products (TCL TV, Godrej fridge, Bosch washing
  machine, Morphy Richards kettle, boAt headphones) — added as a separate migration rather than
  editing `V1`, since already-applied Flyway migrations should never be modified

32 products total. Product images use placeholder URLs (`placehold.co`) tinted to the new brand
palette — swap for real product photography via the admin Product form before going live.

## Design system

**Light-premium by default, with a dark-theme toggle** (top-right of the navbar, also in the mobile
menu) — the preference is remembered per visitor in `localStorage` and applied before first paint
to avoid a flash of the wrong theme.

- **Light theme**: warm off-white base (`#FAF8F5`), near-black warm-gray text (`#2A2620`)
- **Dark theme**: charcoal/obsidian base (`#0B0D10`), warm off-white text (`#F4F1EA`)
- **Signature accents** (same hue family in both themes, for continuity): deep plum / ink-indigo
  (`#3B2E5A`, lightened to a readable lavender tint on dark backgrounds) paired with a warm
  coral/copper accent (`#E8734A` / `#D98C4A`)
- Typography: Space Grotesk (headings) + Inter (body)
- Glassmorphism cards, soft gradient-glow hero, cursor-tracked hover-tilt product photography,
  a signature "rounded-sharp" corner (soft on three corners, crisp on one) used across cards and buttons
- Motion: route-level page transitions, scroll-reveal on homepage sections, a fly-to-cart animation
  from product photo to the cart icon, shimmering skeleton loaders, a confetti burst on order
  confirmation, and `prefers-reduced-motion` is respected throughout
- Mobile-first (360px–4K) with a bottom tab bar on mobile; theme tokens are tuned for WCAG AA
  contrast in both light and dark modes

All theme colors are defined as CSS custom properties in `jyoti-sales-frontend/src/index.css`
(`:root` for light, `:root.dark` for dark) and surfaced as Tailwind utilities in `tailwind.config.js`
— change the palette in one place and it propagates everywhere.

---

## ⚠️ Unfilled business-detail placeholders (Section 1)

The following placeholders from the original spec are **not yet filled in** and currently render
literally as `[[...]]` in the running app. Search-and-replace them before launch:

| Placeholder | Used in |
|---|---|
| `[[Full shop address, PIN]]` | `jyoti-sales-frontend/src/lib/business.ts` (`BUSINESS.address`), backend `application.yml` (`app.business.address`), footer, About-style content |
| `[[10-digit number]]` (phone) | `business.ts` (`BUSINESS.phone`, `BUSINESS.whatsapp`), `application.yml` (`app.business.phone`), footer |
| `[[e.g. 10AM–8:30PM, closed Sunday]]` | `business.ts` (`BUSINESS.timings`), footer |
| `[[GSTIN]]` | `business.ts` (`BUSINESS.gstin`), `application.yml` (`app.business.gstin`), footer, would-be invoice template |
| `[[email]]` | `business.ts` (`BUSINESS.email`), `application.yml` (`app.business.email`), footer |
| `[[e.g. "Trusted electronics retailer since 19XX"]]` | `business.ts` (`BUSINESS.tagline`), homepage hero |

All of these are centralized in **one file** on the frontend (`src/lib/business.ts`) and as env vars
on the backend (`BIZ_NAME`, `BIZ_ADDRESS`, `BIZ_PHONE`, `BIZ_EMAIL`, `BIZ_GSTIN` in `.env` /
`docker-compose.yml`), so updating them is a single edit in each place.

## What's scaffolded vs. simplified in this build

To keep this deliverable buildable and runnable end-to-end, a few Section 3/4 items were
implemented in a simplified form rather than fully fleshed out — noted here so they're easy to
pick up next:

- **Review verified-purchase gating**: `ReviewController` currently always passes `verifiedPurchase=false`.
  Wire it to check `OrderItemRepository` for a DELIVERED order containing the product before allowing/flagging a review.
- **Admin user invites with scoped permissions**: not implemented — all admins currently share the
  single `ROLE_ADMIN` authority. Add an `AdminInvite` entity + email-based invite flow if per-admin
  permission scoping is needed.
- **Invoice PDF generation**: order status management and data are in place; wiring a PDF library
  (e.g. OpenPDF) into `AdminOrderController` to generate a downloadable invoice is the next step.
- **Forgot-password flow**: `AuthService.forgotPassword()` is mocked (returns a generic message,
  no email/SMS actually sent) as specified in Section 3.5.
- **Product image upload/reorder UI**: the admin Product form accepts image URLs (newline-separated)
  rather than a drag-and-drop multi-file uploader — swap in a real upload widget (e.g. to S3/Cloudinary)
  and wire it to the same `imageUrls` field when ready.

## Tech stack recap

**Backend:** Java 21 · Spring Boot 3.3 (Web, Data JPA/Hibernate, Security+JWT, Validation) ·
PostgreSQL · Flyway · Maven · springdoc-openapi (Swagger) · JUnit5/Mockito

**Frontend:** React 18 · Vite · TypeScript · Tailwind CSS (custom theme) · Framer Motion ·
Zustand · React Router · TanStack Query · Vitest
