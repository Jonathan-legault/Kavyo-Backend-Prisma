# Kavyo Backend

Kavyo is a Calgary-focused grocery decision platform prototype.

The backend supports product and store data, grocery pricing, user accounts, user preferences, basket comparison, structured flyer-promotion review, and route-aware grocery recommendations.

The goal is to help users determine whether they should:

- stay at their usual store
- switch to another store
- make a second stop
- split a grocery basket between stores

Recommendations currently combine grocery prices with an estimated driving cost. Reviewed flyer offers can contribute retailer-level estimates to the basket, while store-verified price observations take priority. Member-aware pricing, true quantity-aware multibuy checkout, travel time, transit/walking modes, multi-store split recommendations, and multi-stop optimization remain future work.

---

## Current Status

The backend currently includes:

- NestJS application
- PostgreSQL database
- Prisma ORM and migrations
- database seed data
- 3 retailers
- 3 Calgary test stores in the portable fixture
- 5 verified test products
- 15 verified price observations
- user registration
- bcrypt password hashing
- login
- JWT authentication
- USER and ADMIN role authorization
- authenticated user profile GET/PATCH
- user preference GET/PATCH
- usual-store preference relationship
- persisted basket CRUD
- authenticated, user-owned baskets
- guest quick comparison without persistence
- Calgary postal-code lookup by FSA centroid
- basket price comparison with sale/regular price handling
- travel-cost estimation and cheapest-store recommendation
- weekly flyer ingestion from Flipp for Safeway, Walmart, and Calgary Co-op
- staged flyer offers with package-size, unit-price, promotion, and review-flag normalization
- structured promotion conditions for multibuys, member/loyalty pricing, price ranges, BOGO/free-item offers, purchase limits, spend thresholds, coupons, points, and in-store-only offers
- flyer offer listing, summary, exact-match, and similar-product comparison APIs
- protected admin flyer-review queue with approval, rejection, and needs-info decisions
- review approval workflow that upserts a canonical product and a retailer-level advertised offer, with optional store-level price observation publication
- stable `catalogKey` and optional barcode support for idempotent flyer-derived products
- public product catalogue API with search, category, retailer, pagination, product images, and current flyer-estimate metadata
- basket pricing that distinguishes store-verified observations from retailer-level advertised estimates
- DTO validation
- authentication and authorization error handling
- 77 unit tests using Vitest
- 48 end-to-end tests using Vitest and Supertest
- Postman requests for authentication, user, and basket API testing

Basket comparison and travel-aware recommendations are implemented for a single store. Split-basket and multi-stop optimization remain future work.

A team member has prepared a verified 95-location Calgary retail dataset with latitude and longitude. It is not yet applied to this repository's local database; the portable fixture still contains three stores so tests remain reproducible. The store comparison engine already reads active `Store` rows, so the larger dataset can be loaded without changing the comparison contract.

The local `kavyo_dev` database also contains the product-contract handoff data: 227 products (214 active), 351 advertised offers, and a staged flyer backlog. Staged offers are not published automatically. They must be reviewed, linked to a canonical product, and approved before they can affect the catalogue or basket; offers without a linked product or with an expired validity window are ignored by pricing.



A larger local Open Food Facts development dataset containing approximately 62,575 products is also used during development.

The repository's portable SQL test fixture contains only 5 products and 15 verified price observations so the development environment can be reproduced without loading the full product catalogue.

---

## Tech Stack

- Node.js
- TypeScript
- NestJS
- Prisma 7
- PostgreSQL
- `@prisma/adapter-pg`
- JWT
- bcrypt
- class-validator
- class-transformer
- Vitest
- Supertest
- npm

---

## Project Structure

```text
kavyo-backend/
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   ├── seed.ts
│   └── test-data/
│       └── kavyo_test_data_final.sql
│
├── src/
│   ├── auth/
│   │   ├── decorators/
│   │   ├── dto/
│   │   ├── guards/
│   │   ├── types/
│   │   ├── auth.controller.ts
│   │   ├── auth.module.ts
│   │   └── auth.service.ts
│   │
│   ├── users/
│   │   ├── dto/
│   │   ├── users.controller.ts
│   │   ├── users.module.ts
│   │   └── users.service.ts
│   │
│   ├── basket/
│   │   ├── calculation/
│   │   │   ├── postal-code.service.ts
│   │   │   ├── postal-codes.ts
│   │   │   ├── pricing.ts
│   │   │   └── travel.ts
│   │   ├── dto/
│   │   ├── basket.module.ts
│   │   ├── baskets.controller.ts
│   │   ├── baskets.service.ts
│   │   ├── quick-compare.controller.ts
│   │   ├── quick-compare.service.ts
│   │   └── comparison.service.ts
│   │
│   ├── admin/
│   │   ├── dto/
│   │   ├── admin-flyer-offers.controller.ts
│   │   ├── admin-flyer-offers.service.ts
│   │   └── admin.module.ts
│   │
│   ├── flyers/
│   │   ├── dto/
│   │   ├── flipp/
│   │   ├── ingestion/
│   │   ├── normalization/
│   │   │   ├── flyer-normalizer.ts
│   │   │   ├── package-size.ts
│   │   │   └── promotion.ts
│   │   ├── flyers.controller.ts
│   │   ├── flyers.module.ts
│   │   ├── offer-utils.ts
│   │   └── flyers.service.ts
│   │
│   ├── products/
│   │   ├── dto/
│   │   ├── products.controller.ts
│   │   ├── products.module.ts
│   │   └── products.service.ts
│   │
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   │
│   ├── generated/prisma/
│   ├── app.controller.ts
│   ├── app.module.ts
│   ├── app.service.ts
│   └── main.ts
│
├── test/
│   ├── admin-flyer-offers.e2e-spec.ts
│   ├── advertised-offer-basket.e2e-spec.ts
│   ├── app.e2e-spec.ts
│   ├── basket.e2e-spec.ts
│   └── products.e2e-spec.ts
│
├── docs/
│   ├── flyer-ingestion.md
│   └── task-5-6-status.md
│
├── scripts/
│   └── ingest-flyers.ts
│
├── .env.example
├── .gitignore
├── package.json
├── vitest.config.e2e.ts
└── README.md
```

`src/generated/prisma/` is generated locally and is ignored by Git.

---

## Prerequisites

Install:

- Node.js 22+
- npm 10+
- PostgreSQL
- Git

pgAdmin is optional but recommended for local database management.

A fresh development environment has been successfully tested using:

```text
Node.js 22.19.0
npm 10.9.3
PostgreSQL 18
Git 2.51.0
```

Prisma is installed through the project dependencies and does not need to be installed globally.

---

## Local Setup

### 1. Clone the Repository

```bash
git clone Kavyo-Backend-Prisma
cd kavyo-backend
```

Replace `<repository-url>` with the Kavyo backend repository URL.

---

### 2. Install Dependencies

```bash
npm ci
```

`npm ci` installs the dependency versions recorded in `package-lock.json` and is recommended when setting up an existing clone.

---

### 3. Create the Database

Create a PostgreSQL database named:

```text
kavyo_dev
```

This can be done using pgAdmin or PostgreSQL command-line tools.

---

### 4. Configure Environment Variables

Copy:

```text
.env.example
```

to:

```text
.env
```

Example:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/kavyo_dev"
JWT_SECRET="YOUR_LOCAL_JWT_SECRET"
```

Replace `YOUR_PASSWORD` with your local PostgreSQL password.

Use a private local value for `JWT_SECRET`.

Never commit `.env`.

---

### 5. Generate the Prisma Client

```bash
npx prisma generate
```

The generated Prisma client is placed in:

```text
src/generated/prisma
```

---

### 6. Apply Existing Migrations

For a fresh clone:

```bash
npx prisma migrate deploy
```

This applies the migration history stored in:

```text
prisma/migrations/
```

---

### 7. Seed Reference Data

```bash
npx prisma db seed
```

The seed contains reference/setup data including:

- USER role
- ADMIN role
- source systems
- retailers
- Calgary test stores

---

## Test Data Fixture

A portable SQL test fixture is available at:

```text
prisma/test-data/kavyo_test_data_final.sql
```

The fixture contains:

- 5 grocery products
- 3 retailers
- 3 stores with Calgary coordinates
- 15 verified price observations
- associated source and ingest data

The fixture does not require the larger 62,575-product local development catalogue.

### Using psql

```bash
psql -U postgres -d kavyo_dev -f prisma/test-data/kavyo_test_data_final.sql
```

### Using pgAdmin

1. Open pgAdmin.
2. Select the `kavyo_dev` database.
3. Open Query Tool.
4. Open `prisma/test-data/kavyo_test_data_final.sql`.
5. Execute the script.

Expected fixture result:

```text
5 products
3 retailers
3 stores
15 price observations
```

---

## Current Test Products

- Kellogg's Froot Loops, 480 g
- Kellogg's Frosted Flakes, 545 g
- Kellogg's Rice Krispies, 560 g
- Kellogg's Two Scoops Raisin Bran, 600 g
- Kraft Smooth Peanut Butter, 1 kg

Current test stores:

- Save-On-Foods Seton
- Real Canadian Superstore Seton Way
- Sobeys Mahogany

---

## Run the Backend

```bash
npm run start:dev
```

The API runs at:

```text
http://localhost:3000
```

---

## Database Check

A temporary development endpoint is available:

```text
GET /db-check
```

Example response after loading the portable test fixture:

```json
{
  "database": "connected",
  "products": 5,
  "retailers": 3,
  "stores": 3,
  "priceObservations": 15
}
```

This endpoint may be removed later.

---

## Product Catalogue API

The public product catalogue powers the frontend basket picker. It returns active products only and includes current flyer-estimate metadata. Store-level price values are not exposed here; the basket comparison remains the source of priced totals.

```text
GET /products
GET /products?q=candle&postalCode=T3M1T4
GET /products?category=GROCERY&limit=25&offset=50
GET /products?retailerId=<retailer-uuid>
```

Query parameters:

| Parameter | Description |
| --- | --- |
| `q` | Case-insensitive search over product name, brand, and package text |
| `category` | Exact category, case-insensitive (`GROCERY`, `HOUSEHOLD`, `PET`, etc.) |
| `retailerId` | Only products with an advertised offer or a store observation at that retailer |
| `postalCode` | Used to rank current advertised offers by market match |
| `limit` | Page size, 1–250; defaults to 60 |
| `offset` | Zero-based page offset |

Example response shape:

```json
{
  "total": 214,
  "count": 2,
  "limit": 60,
  "offset": 0,
  "postalCode": "T3M 1T4",
  "asOf": "2026-11-15T15:04:14.039Z",
  "products": [
    {
      "id": "26c6dfc2-cd5a-40e3-a4f6-8b617ded1036",
      "productName": "LIFE AT HOME™ 9 OZ CANDLE, CRANBERRY TEA",
      "brand": "LIFE AT HOME™",
      "quantityText": "9 OZ",
      "imageUrl": "https://f.wishabi.net/page_pdf_images/example/x_large",
      "category": "GROCERY",
      "verifiedStorePriceCount": 0,
      "currentOfferCount": 1,
      "latestAdvertisedOffer": {
        "retailerName": "Real Canadian Superstore",
        "marketKey": "T2A4T8",
        "marketMatch": "OTHER_MARKET",
        "advertisedPrice": 12,
        "currency": "CAD",
        "validUntil": "2026-12-17T04:59:59.000Z"
      }
    }
  ]
}
```

A `latestAdvertisedOffer` is an advertised estimate, not a store-verified shelf price. The basket marks these items separately and warns when the flyer market differs from the customer's area.

`imageUrl` is an optional product-detail image discovered through the reviewed flyer data. It is stored on the canonical product, normalized to HTTPS, and reused across weekly offers instead of being replaced by a less-clean flyer cutout. Products without a verified image fall back to the frontend's generated artwork. The frontend also falls back to that artwork if an external image fails to load.

---

## Authentication and User API

Implemented endpoints:

```text
POST  /auth/register
POST  /auth/login
GET   /auth/admin-test
GET   /users/me
PATCH /users/me
GET   /users/me/preferences
PATCH /users/me/preferences
```

Protected endpoints use:

```text
Authorization: Bearer <JWT>
```

Current access model:

- Guest — unauthenticated; guest basket state is frontend-only; can use the public stateless compare endpoint
- USER — authenticated standard user; can create and manage their own persisted baskets
- ADMIN — authenticated administrator

A registered account receives the `USER` role automatically.

An administrator may have both:

```text
USER
ADMIN
```

Roles are included in the JWT when the user logs in. If a user's roles change, the user must log in again to receive a token containing the updated roles.

`GET /auth/admin-test` is a temporary development endpoint used to verify role authorization.

See the API quick-reference document in the project documentation for detailed request bodies, response formats, and returned fields.

---

## User Preferences

Each user may have one preference record.

Current preference fields include:

- usual store
- preferred maximum travel distance
- preferred maximum extra travel time

Travel distance and travel time are soft preferences rather than hard filters.

The future recommendation engine may still recommend a store outside the user's preferred thresholds when the potential savings justify the extra travel.

---

## Basket Comparison and Recommendation

The basket flow is available in both a persisted form and a stateless quick-compare form.

Guest baskets are handled by the frontend and are not persisted by the backend. Guests use the public `POST /basket/compare` endpoint for price and travel comparisons. Persisted baskets require authentication and belong to the authenticated user.

### Persisted basket endpoints

All persisted basket routes require:

```http
Authorization: Bearer <JWT>
```

```text
POST   /baskets
GET    /baskets/:id
PATCH  /baskets/:id
POST   /baskets/:id/items
PATCH  /baskets/:id/items/:itemId
DELETE /baskets/:id/items/:itemId
POST   /baskets/:id/compare
```

A user can only access baskets they own. Requests for another user's basket return `404 Not Found`.

Create a basket with a Calgary postal code:

```http
POST /baskets
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "postalCode": "T3M 1T4"
}
```

The postal code is normalized to `T3M1T4`. A three-character FSA such as `T3M` is also accepted. Unsupported postal codes are rejected with `400 Bad Request`.

Add a product:

```http
POST /baskets/<basket-id>/items
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "productId": "63ddbba5-e68b-4c09-9fa8-321b8bb0531c",
  "quantity": 2
}
```

Compare the basket:

```http
POST /baskets/<basket-id>/compare
Authorization: Bearer <JWT>
Content-Type: application/json

{}
```

The stored basket postal code is used when the compare request omits `postalCode`. A compare request may override it:

```json
{
  "postalCode": "T2P 1J9",
  "travelCostPerKm": 0.35,
  "roundTrip": true,
  "roadDistanceFactor": 1.3,
  "baselineStoreId": "<optional-store-id>"
}
```

Compare options:

| Field | Default | Description |
| --- | --- | --- |
| `postalCode` | Basket value | Calgary postal code or FSA. Required for a persisted comparison when the basket has none. |
| `travelCostPerKm` | `0.35` | Driving cost in CAD per kilometre, between `0` and `5`. |
| `roundTrip` | `true` | Bills the return trip as well as the outbound trip. |
| `roadDistanceFactor` | `1.3` | Approximates road distance from straight-line distance, between `1` and `2`. |
| `baselineStoreId` | none | The user's current/usual store. Enables `STAY` and `SWITCH` recommendations. |

Abbreviated response:

```json
{
  "currency": "CAD",
  "asOf": "2026-10-21T18:00:00.000Z",
  "basketId": "f99a3074-52b9-4475-8821-5b9726e0e37c",
  "postalCode": "T3M1T4",
  "customerLocation": {
    "postalCode": "T3M1T4",
    "fsa": "T3M",
    "latitude": 50.8902,
    "longitude": -113.9892,
    "precision": "FSA_CENTROID"
  },
  "travelAssumptions": {
    "included": true,
    "travelCostPerKm": 0.35,
    "roundTrip": true,
    "roadDistanceFactor": 1.3,
    "averageSpeedKmH": 35,
    "distanceMethod": "HAVERSINE_ROAD_FACTOR",
    "locationPrecision": "FSA_CENTROID"
  },
  "comparisons": [
    {
      "storeId": "2d08df42-04ee-4c82-bcaa-9818dfea239f",
      "storeName": "Real Canadian Superstore Seton Way",
      "retailerName": "Real Canadian Superstore",
      "distanceKm": 3.45,
      "roundTripDistanceKm": 6.89,
      "travelCost": 2.41,
      "productSubtotal": 33.93,
      "estimatedTotal": 36.34,
      "isComplete": true,
      "missingProducts": [],
      "hasExpiredSale": false,
      "hasStalePrice": true
    }
  ],
  "cheapestCompleteStore": {
    "storeId": "2d08df42-04ee-4c82-bcaa-9818dfea239f",
    "storeName": "Real Canadian Superstore Seton Way",
    "productSubtotal": 33.93,
    "travelCost": 2.41,
    "estimatedTotal": 36.34
  },
  "closestPartialStore": null,
  "recommendation": {
    "action": "GO_TO_STORE",
    "storeId": "2d08df42-04ee-4c82-bcaa-9818dfea239f",
    "storeName": "Real Canadian Superstore Seton Way",
    "productSubtotal": 33.93,
    "travelCost": 2.41,
    "estimatedTotal": 36.34,
    "savingsVsNextCheapest": 6.96,
    "savingsVsBaseline": null,
    "message": "Go to Real Canadian Superstore Seton Way. The estimated total is $36.34 total ($33.93 groceries + $2.41 round-trip travel for 6.9 km). This is $6.96 cheaper than the next complete store (Sobeys Mahogany)."
  },
  "warnings": [
    "Travel distance is estimated from the postal-code area (FSA) centroid and a road-distance factor; actual driving distance may differ.",
    "Some prices are more than 24 hours old. Confirm them before travelling."
  ]
}
```

Recommendation actions:

- `GO_TO_STORE` — the cheapest complete store is recommended.
- `STAY` — the supplied `baselineStoreId` is already the cheapest complete store.
- `SWITCH` — another store is cheaper than the supplied baseline.
- `NO_COMPLETE_STORE` — no complete store is eligible because products are missing or a travel estimate is unavailable. The response lists missing products and/or the affected stores.

### Stateless quick comparison

The original endpoint remains available:

```http
POST /basket/compare
Content-Type: application/json

{
  "postalCode": "T3M 1T4",
  "items": [
    {
      "productId": "63ddbba5-e68b-4c09-9fa8-321b8bb0531c",
      "quantity": 2
    }
  ]
}
```

This returns the same comparison shape with `"basketId": null`. If `postalCode` is omitted, prices are compared without travel cost and the response includes a warning.

### Pricing and travel rules

- The latest usable store price observation per store and product is used.
- An active sale price is used when the current time is inside its `validFrom`/`validUntil` window.
- An expired or not-yet-started sale falls back to the regular price. Expired sales produce a warning.
- If no usable store observation exists, a current advertised offer for the same retailer can be used as a retailer-level estimate.
- Advertised offers must be date-valid, in CAD, positive, and free of blocking conditions. Member-only, price-range, multi-variant, BOGO, free-item, coupon, and minimum-spend offers cannot become single-unit basket prices.
- Multibuy offers (for example "2 for $5") are allowed as per-item estimates when a reliable unit price can be computed from the promotion (quantity ≥ 2, positive total). The item carries the promotion label, the response counts them under `advertisedOfferItemCount`, and a warning notes that items bought outside the promoted multiples may ring up at the regular price. Multibuys without a usable quantity/total pair, and multibuy offers stacked with member/BOGO/coupon/minimum-spend conditions, stay excluded.
- Verified store observations outrank advertised estimates. The response includes `priceSource`, `priceConfidence`, advertised-offer metadata, and per-store estimate counts.
- Advertised offers from another postal-code market are included but ranked lower and flagged `OTHER_MARKET`. Expired flyer offers are never used.
- A store missing any requested product is incomplete and is never recommended as the cheapest store. Missing products are listed explicitly.
- Store-verified prices older than 24 hours are flagged with a warning. An older flyer observation is not mislabeled as a stale shelf price.
- Travel distance is estimated from the customer's FSA centroid to the store's recorded latitude/longitude using the Haversine formula.
- Driving distance is approximated as straight-line distance × `roadDistanceFactor`, then doubled for a round trip.
- Travel cost is driving distance × `travelCostPerKm`. The defaults are `0.35 CAD/km`, a `1.3` road factor, and a round trip.
- The estimate does not include live traffic, parking, transit fares, walking/cycling time, or vehicle ownership costs. Use it as a prototype-level decision aid, not a precise trip quote.
- Calgary FSA centroids are stored locally in `src/basket/calculation/postal-codes.ts`; no external geocoding service is called at runtime.

Persisted baskets are authenticated and owned by the user who created them. The backend does not create anonymous persistent baskets; guest basket state is kept by the frontend and can be compared through the public stateless endpoint.

---

## Automated Testing

End-to-end tests use:

- Vitest
- Supertest
- NestJS Testing utilities

Run:

```bash
npm run test:e2e
```

Current result:

```text
77 unit tests passing
48 end-to-end tests passing
```

Unit tests cover active/expired sale pricing, quantity multiplication, missing-product handling, latest-observation selection, advertised-offer eligibility and market ranking, store-verified versus advertised source precedence, Haversine distance, travel-cost rounding, postal-code normalization, numeric parsing, flyer package-size parsing, unit-price conversion, multi-pack and range handling, promotion parsing (multibuy, member/loyalty, price range, BOGO, limits, spend thresholds, coupons, points), member-price detection, and flyer offer normalization.

The current E2E suite verifies:

- successful registration
- duplicate email rejection
- successful login
- invalid password rejection
- JWT route protection
- authenticated profile retrieval
- password hashes are not exposed
- DTO whitelist validation
- preference route authentication
- invalid travel distance rejection
- valid preference persistence
- invalid store handling
- USER rejection from ADMIN routes
- ADMIN authorization
- basket creation and item management
- authentication required for persisted baskets
- basket ownership isolation between users
- persisted basket comparison with travel cost
- expired-sale fallback to regular prices
- baseline-store `STAY`/`SWITCH` recommendation behavior
- stateless `POST /basket/compare`
- postal-code validation
- rejection of a persisted comparison without a postal code
- admin review-queue authentication and role protection
- admin approval creating a canonical product and an advertised offer
- admin approval optionally publishing a validated store price observation
- admin rejection withdrawing both published records
- canonical product reuse across weekly offers
- refusal to publish member-only, multibuy, or unresolved multi-variant price observations
- advertised-offer basket estimates, including source and market-match metadata
- public product catalogue search and current-offer metadata

Test accounts, baskets, flyers, staged offers, advertised offers, and canonical products created during the E2E suite are removed after testing.

---

## Database Workflow

The Prisma schema represents the desired current database structure.

Migration files represent the database change history.

When changing the database schema:

```bash
npx prisma migrate dev --name <migration_name>
npx prisma generate
```

Commit both:

```text
prisma/schema.prisma
prisma/migrations/
```

Do not modify an applied migration that has already been shared.

If a correction is required, create a new migration.

For a fresh environment:

```bash
npx prisma migrate deploy
```

---

## Seed vs Test Fixture

### `prisma/seed.ts`

Contains reference/setup data such as:

- roles
- source systems
- retailers
- stores

Run with:

```bash
npx prisma db seed
```

### `prisma/test-data/kavyo_test_data_final.sql`

Contains the portable grocery test dataset:

- 5 products
- 15 price observations
- source and ingest information

These two files serve different purposes and should not be treated as the same dataset.

---

## Promotion Model

The canonical pricing model still stores regular and sale prices. Flyer-derived promotion conditions are captured on `StagedOffer` before a human review promotes an offer.

Structured promotion fields include:

- `promotionType`: `NONE`, `MULTIBUY`, `MEMBER_PRICE`, `PRICE_RANGE`, `BOGO`, `SPEND_THRESHOLD`, `PURCHASE_LIMIT`, `IN_STORE_ONLY`, `POINTS_OFFER`, or `OTHER`
- `promotionQuantity`, `promotionTotalPrice`, and `promotionUnitPrice` for multibuys
- `memberProgram`, `memberPriceAmount`, and `nonMemberPriceAmount` for member/loyalty pricing
- `priceMinAmount` and `priceMaxAmount` for advertised ranges
- `conditionsText` and `promotionConditions` for the original conditions and machine-readable flags
- review audit fields: `reviewDecision`, `reviewNotes`, `reviewedAt`, and `reviewedByUserId`

Supported condition parsing includes:

- multibuy forms such as `3 for $7`, `2/$5`, and `$5 for 2`
- member/loyalty programs such as Scene+, PC Optimum, Air Miles, and More Rewards
- ranges from flyer text and Flipp `current_price_range`
- BOGO and free-item offers
- purchase limits such as `limit 4`
- minimum-spend thresholds
- quantity requirements such as `when you buy 2` or `$5.99 ea when you buy 2 or more`
- coupon, points, and in-store-only conditions

`StagedOffer` remains the audit record. The protected admin review workflow can approve, reject, or request more information, create or match a canonical `Product`, and publish a validated `PriceObservation`. Products derived from flyers use a stable `catalogKey` so weekly runs reuse the same product instead of duplicating it; barcodes remain optional and are never invented.

Price publishing is opt-in (`publishPrice: true`) and is blocked for member-only, multibuy, BOGO, free-item, coupon, and minimum-spend offers until the basket engine can represent those conditions. Price-range, multi-variant, and otherwise ambiguous offers require an explicit resolved `unitPrice`. Multi-variant offers also require an explicit `productId`. Rejecting a previously approved offer withdraws its published price.

See [`docs/flyer-ingestion.md`](docs/flyer-ingestion.md) for the full review workflow and payload examples.

---

## Backend Progress

### Completed

- database foundation
- Prisma integration
- PostgreSQL integration
- migrations
- seed data
- portable test fixture
- registration
- bcrypt password hashing
- login
- JWT authentication
- JWT authentication guard
- USER / ADMIN role authorization
- authenticated user profile
- user profile update
- user preferences
- usual-store relationship
- request validation
- authentication and authorization error handling
- persisted basket CRUD
- basket price comparison
- effective sale-price selection with expiry fallback
- FSA-centroid postal-code lookup
- Haversine travel-distance and driving-cost estimation
- cheapest complete-store recommendation
- `STAY` / `SWITCH` baseline-store comparison
- Flipp flyer ingestion for Safeway, Walmart, and Calgary Co-op
- staged flyer offers with package-size, unit-price, and promotion normalization
- structured promotion conditions for member, multibuy, range, BOGO, limit, spend, coupon, points, and in-store flags
- review flags for ambiguous or unsupported pricing
- exact-product and similar-product flyer comparison APIs
- protected admin flyer-review queue and summary endpoints
- approval workflow with canonical product upsert, advertised-offer publication, and optional store price publication
- stable flyer product keys and optional barcodes
- public product catalogue with product images and current flyer-estimate metadata
- reviewed flyer offers wired into basket estimates and the frontend product picker
- automated authentication/user E2E tests
- automated basket comparison and advertised-offer E2E tests
- automated admin review E2E tests
- automated product catalogue E2E tests
- automated flyer normalization and promotion parser tests
- Postman authentication/user testing

### Next Backend Milestones

1. Member-aware and multibuy-aware basket pricing
2. Import and validate the team's 95-location Calgary store dataset
3. Transit, walking, and cycling travel modes
4. Route-aware travel time and multi-stop optimization
5. Split-basket recommendation
6. Administrative analytics and operational tooling

---

## Security

Never commit:

- `.env`
- passwords
- PostgreSQL passwords
- JWT secrets
- API keys
- private database connection strings
- private keys
- production credentials

Only safe templates such as `.env.example` should be committed.

---

## Weekly Flyer Pricing

Weekly flyer prices are ingested from Flipp's public flyer JSON for Safeway, Walmart, and Calgary Co-op. The full source notes, normalization rules, API examples, review policy, and limitations are in [`docs/flyer-ingestion.md`](docs/flyer-ingestion.md).

Run an ingestion:

```bash
npm run ingest:flyers -- --postal-code T3M1T4
```

The command creates a new `IngestBatch`, one `Flyer` row per retailer flyer, and `StagedOffer` rows for each priced item. Ingestion does **not** publish prices by itself. The latest completed batch is used by these public endpoints:

```text
GET /products?q=butter&postalCode=T3M1T4
GET /flyers/summary
GET /flyers/offers?q=butter&status=NORMALIZED
GET /flyers/offers?status=ALL&promotionType=ANY
GET /flyers/compare?q=Quality%20Street&mode=EXACT
GET /flyers/compare?q=butter&mode=FAMILY&status=ALL
```

Reviewed offers can be promoted through protected admin endpoints:

```text
GET   /admin/flyer-offers
GET   /admin/flyer-offers/summary
GET   /admin/flyer-offers/:id
PATCH /admin/flyer-offers/:id/review
```

The review endpoint accepts `APPROVE`, `REJECT`, or `NEEDS_INFO`. Approval can match an existing product or create a canonical product with `createProduct: true`. Every approval upserts an `AdvertisedOffer` that the public product catalogue and basket can use as a retailer-level estimate. `publishPrice: true` additionally writes a store-level `PriceObservation` and requires a `storeId`; store-verified observations always outrank advertised estimates. Rejecting or returning an approved offer to `NEEDS_INFO` withdraws both published records. Ambiguous or unsupported promotions are retained with their conditions and excluded from single-unit basket pricing until an administrator resolves them. See [`docs/flyer-ingestion.md`](docs/flyer-ingestion.md).

For weekly cycles, offers that already passed the normalizer (date-valid, `review_required = false`, never reviewed) can be batch-approved without hand-editing every row. Add `--include-multibuy` to also approve usable multibuy offers such as "2 for $5": only offers whose sole blocking reason is `MULTIBUY` with a computable per-item price (plus informational `NO_GTIN`/`POINTS_OFFER` flags) are included; condition-heavy multibuys (member pricing, size ranges, multi-variants) stay in the review queue:

```bash
# one-time: create the local dev reviewer account (ADMIN role)
node scripts/create-admin-user.mjs

# preview the linking outcome, then approve
npx tsx scripts/approve-current-flyer-offers.ts
npx tsx scripts/approve-current-flyer-offers.ts --apply
npx tsx scripts/approve-current-flyer-offers.ts --apply --include-multibuy
```

The batch script reuses `AdminFlyerOffersService.reviewOffer`, so the audit trail is identical to a manual review. It links offers to existing products by `catalogKey` (or exact normalized name + package size for legacy rows seeded without a key, whose `catalogKey` is then backfilled) and only creates new products when no confident match exists. Offers whose name matches an existing product but whose package size differs are skipped for manual review, so different SKUs are never merged, and offers without a stable match key are never approved blindly.

Comparison policy:

- `mode=EXACT` groups only offers with the same normalized brand/product name and package size. Use it for direct product substitutions.
- `mode=FAMILY` groups offers by grocery family and unit-price basis. These are similar products, not guaranteed identical items; label them clearly in the frontend.
- `status=NORMALIZED` (the default) excludes offers with blocking review flags such as member-only pricing, multi-buys, size ranges, and multi-variants. `status=ALL` exposes those rows with their review reasons intact.
- `promotionType` filters promotional rows by type; use `promotionType=ANY` to return every offer whose type is not `NONE`.

Staged-offer counts change with every flyer cycle. A single cycle can contain several hundred offers across the supported retailers, so the review queue is expected to be the gating step between ingestion and published pricing.

The frontend discovery surface is `/flyers`. It searches the latest batch, shows exact matches separately from similar products, keeps review flags visible, and stores the search in the URL (`/flyers?q=cheese&status=ALL`). A **Promotion watch** strip loads multibuy, member-price, price-range, and other promotional rows even when the default view is limited to verified prices. Promotion cards show the advertised deal, quantity requirement, per-item calculation (for example, `2 for $5.00` → `$2.50 each`), member/non-member prices, and conditions.

The basket comparison uses current `AdvertisedOffer` rows as retailer-level estimates only when no usable store-level `PriceObservation` exists for that product and store. Verified observations win; offers from another postal-code market are included but ranked lower and flagged `OTHER_MARKET`; expired flyer offers never affect basket totals. Member-only, price-range, multi-variant, BOGO, free-item, coupon, and minimum-spend offers cannot become single-unit sale prices. Usable multibuy offers ("2 for $5" → $2.50 each) are included as labelled per-item estimates with a basket warning; their prices are still never published as store-verified `PriceObservation` rows. The frontend product picker reads the public catalogue and labels flyer estimates separately from store prices.

**Source terms:** confirm Flipp and retailer terms of use before production use. The ingester uses rate limiting and does not bypass access controls.

---

## Data Source Guidelines

Grocery data should be collected only from permitted or authorized sources.

The project should not intentionally bypass:

- CAPTCHAs
- paywalls
- authentication controls
- retailer access restrictions
- technical protections

Pricing data should retain provenance wherever possible so observations can be traced back to their original source.

The flyer ingester reads public Flipp flyer JSON used by retailer flyer widgets. It stores the Flipp flyer ID, retailer, validity window, source URL, and raw payload for provenance. Production use still requires a Flipp/retailer terms-of-use review; see [`docs/flyer-ingestion.md`](docs/flyer-ingestion.md).

---

## Useful Development Commands

Install dependencies:

```bash
npm ci
```

Start development server:

```bash
npm run start:dev
```

Run E2E tests:

```bash
npm run test:e2e
```

Run tests:

```bash
npm run test
```

Run coverage:

```bash
npm run test:cov
```

Validate Prisma schema:

```bash
npx prisma validate
```

Generate Prisma client:

```bash
npx prisma generate
```

Create a migration:

```bash
npx prisma migrate dev --name <migration_name>
```

Apply existing migrations:

```bash
npx prisma migrate deploy
```

Seed reference data:

```bash
npx prisma db seed
```

Ingest weekly flyer prices:

```bash
npm run ingest:flyers -- --postal-code T3M1T4
```

---

## Development Notes

- `src/generated/prisma` is generated locally and should not be committed.
- Prisma migrations should not be edited after they have been applied and shared.
- JWT roles are determined when the token is issued.
- Users must log in again after a role change.
- `maxTravelDistanceKm` currently serializes as a JSON string because it is stored as a PostgreSQL `DECIMAL`.
- API timestamps use UTC ISO 8601 format.
- Travel preference values are soft preferences rather than hard recommendation filters.
- Basket recommendations use current store coordinates and locally stored FSA centroids; they do not call a live geocoder.
- Travel cost is an estimate based on distance only. It excludes traffic, parking, transit fares, and vehicle ownership costs.
- Prices older than 24 hours are reported as stale but are still used with a warning.
- `/db-check` is a temporary development endpoint.
- `/auth/admin-test` is a temporary authorization endpoint.
- Persisted basket routes require JWT authentication.
- Guest basket state is managed by the frontend; the public quick-compare endpoint does not persist anything.
