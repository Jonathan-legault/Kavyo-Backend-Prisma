# Kavyo Backend

Kavyo is a Calgary-focused grocery decision platform prototype.

The backend supports product and store data, grocery pricing, user accounts, user preferences, basket comparison, promotion handling, and future route-aware grocery recommendations.

The goal is to help users determine whether they should:

- stay at their usual store
- switch to another store
- make a second stop
- split a grocery basket between stores

Recommendations currently combine grocery prices with an estimated driving cost. Future iterations will add promotions, travel time, transit/walking modes, and multi-store split recommendations.

---

## Current Status

The backend currently includes:

- NestJS application
- PostgreSQL database
- Prisma ORM and migrations
- database seed data
- 3 retailers
- 3 Calgary test stores
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
- DTO validation
- authentication and authorization error handling
- 27 unit tests using Vitest
- 31 end-to-end tests using Vitest and Supertest
- Postman requests for authentication, user, and basket API testing

Basket comparison and travel-aware recommendations are implemented for a single store. Split-basket and multi-stop optimization remain future work.

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
│   ├── app.e2e-spec.ts
│   └── basket.e2e-spec.ts
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

- The latest price observation per store and product is used.
- An active sale price is used when the current time is inside its `validFrom`/`validUntil` window.
- An expired or not-yet-started sale falls back to the regular price. Expired sales produce a warning.
- A store missing any requested product is incomplete and is never recommended as the cheapest store. Missing products are listed explicitly.
- Prices older than 24 hours are flagged with a warning.
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
27 unit tests passing
31 end-to-end tests passing
```

Unit tests cover active/expired sale pricing, quantity multiplication, missing-product handling, latest-observation selection, Haversine distance, travel-cost rounding, postal-code normalization, and numeric parsing.

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

Test accounts and baskets created during the E2E suite are removed after testing.

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

## Promotion Model - Planned

The current pricing model supports regular and sale prices.

Future promotion handling will require structured conditions including:

- `QUANTITY_LIMIT`
- `MEMBER_PRICE`
- `LOYALTY_CARD`
- `MULTI_BUY`
- `BOGO`
- `MINIMUM_SPEND`
- `APP_OFFER`

`MULTI_BUY` will need to distinguish between:

- `PRO_RATA`
- `THRESHOLD_REQUIRED`

Promotion-condition support is planned for a later backend milestone.

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
- automated authentication/user E2E tests
- automated basket comparison E2E tests
- Postman authentication/user testing

### Next Backend Milestones

1. Product and price APIs
2. Promotion-condition model
3. Transit, walking, and cycling travel modes
4. Route-aware travel time and multi-stop optimization
5. Split-basket recommendation
6. Administrative APIs and analytics

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

## Data Source Guidelines

Grocery data should be collected only from permitted or authorized sources.

The project should not intentionally bypass:

- CAPTCHAs
- paywalls
- authentication controls
- retailer access restrictions
- technical protections

Pricing data should retain provenance wherever possible so observations can be traced back to their original source.

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