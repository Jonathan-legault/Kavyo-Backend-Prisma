# Kavyo Backend

Kavyo is a Calgary-focused grocery decision platform prototype.

The backend supports product and store data, grocery pricing, user accounts, user preferences, basket comparison, promotion handling, and future route-aware grocery recommendations.

The goal is to help users determine whether they should:

- stay at their usual store
- switch to another store
- make a second stop
- split a grocery basket between stores

Recommendations will eventually consider grocery prices, promotions, travel distance, travel time, and user preferences.

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
- DTO validation
- authentication and authorization error handling
- 13 passing end-to-end tests using Vitest and Supertest
- Postman requests for authentication and user API testing

Basket comparison and recommendation logic are still under development.

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
│   └── app.e2e-spec.ts
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
- 3 stores
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

- Guest — unauthenticated; no database role
- USER — authenticated standard user
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
13 tests passing
```

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

Test accounts created during the E2E suite are removed after testing.

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
- automated authentication/user E2E tests
- Postman authentication/user testing

### Next Backend Milestones

1. Product and price APIs
2. Basket management
3. Store comparison engine
4. Promotion-condition model
5. Route and travel-cost calculations
6. Stay / switch / split recommendation
7. Administrative APIs and analytics

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
- `/db-check` is a temporary development endpoint.
- `/auth/admin-test` is a temporary authorization endpoint.
- Basket comparison and recommendation functionality are still under development.