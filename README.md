# Kavyo Backend

Kavyo is a Calgary-focused grocery decision platform prototype. This backend supports the data layer for product matching, store pricing, basket comparison, promotion handling, and future route-aware grocery recommendations.

## Current Status

- NestJS project running
- PostgreSQL connected through Prisma
- Prisma migrations and seed configured
- 62,575 products currently loaded in the main local development database
- 3 retailers and 3 Calgary test stores
- 15 verified real price observations across 5 products and 3 stores
- `GET /db-check` successfully reads PostgreSQL data through Prisma
- Authentication, login, JWT, basket comparison, and recommendation logic are not implemented yet

## Tech Stack

- Node.js
- TypeScript
- NestJS
- Prisma 7
- PostgreSQL
- `@prisma/adapter-pg`
- npm

## Project Structure

```text
kavyo-backend/
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   ├── seed.ts
│   └── test-data/
│       └── kavyo_test_data_final.sql
├── src/
│   ├── generated/prisma/      # generated locally; ignored by Git
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── app.controller.ts
│   ├── app.module.ts
│   ├── app.service.ts
│   └── main.ts
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Prerequisites

Install:

- Node.js
- npm
- PostgreSQL
- Git

pgAdmin is optional.

## Local Setup

### 1. Clone and install

```bash
git clone <repository-url>
cd kavyo-backend
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env`.

Example:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/kavyo_dev"
```

Do not commit `.env`.

### 3. Create the database

Create a PostgreSQL database named:

```text
kavyo_dev
```

### 4. Generate Prisma client

```bash
npx prisma generate
```

The generated client is placed in:

```text
src/generated/prisma
```

### 5. Apply migrations

For normal local development:

```bash
npx prisma migrate dev
```

For deployment-style migration application:

```bash
npx prisma migrate deploy
```

### 6. Seed reference data

```bash
npx prisma db seed
```

The seed includes roles, source systems, retailers, and the three current Calgary test stores.

## Optional Real Test Fixture

The repository contains:

```text
prisma/test-data/kavyo_test_data_final.sql
```

It creates or updates:

- 5 exact grocery products
- 3 retailer website source systems
- 3 ingest batches
- 15 real price observations

It does **not** require the full 62,575-product catalogue.

Run with `psql` if available:

```bash
psql -U postgres -d kavyo_dev -f prisma/test-data/kavyo_test_data_final.sql
```

Or execute the file from pgAdmin Query Tool.

Expected fixture result:

```text
5 products
3 stores
15 price observations
```

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

## Run the Backend

```bash
npm run start:dev
```

API:

```text
http://localhost:3000
```

Current database test endpoint:

```text
GET /db-check
```

Example response from the main development database:

```json
{
  "database": "connected",
  "products": 5,
  "retailers": 3,
  "stores": 3,
  "priceObservations": 15
}
```

## Database Model

Current Prisma models include:

- Users
- Roles
- User-role assignments
- Products
- Retailers
- Stores
- Source systems
- Ingest batches
- Price observations

Price observations retain provenance, observation time, regular price, sale price, and validity dates when available.

## Promotion Model - Planned

The current schema stores `regular_price` and `sale_price`, but the comparison engine will need structured promotion conditions.

Planned condition types:

- `QUANTITY_LIMIT`
- `MEMBER_PRICE`
- `LOYALTY_CARD`
- `MULTI_BUY`
- `BOGO`
- `MINIMUM_SPEND`
- `APP_OFFER`

`MULTI_BUY` must distinguish between:

- `PRO_RATA` — e.g. 3 for $9 where one item is still $3
- `THRESHOLD_REQUIRED` — e.g. buy 3 for $9 or pay a different single-unit price

Temporary Superstore quantity-limit details are currently retained in ingest provenance until promotion tables are added.

## Next Backend Milestones

1. Authentication module
2. User registration
3. Password hashing
4. Login
5. JWT authentication
6. Role handling
7. Product and price APIs
8. Basket management
9. Store comparison engine
10. Promotion-condition model
11. Route/travel-cost calculations
12. Stay / switch / split recommendation

## Database Workflow

Schema changes belong in Prisma migrations.

After changing `schema.prisma`:

```bash
npx prisma migrate dev --name <migration_name>
npx prisma generate
```

Commit both:

```text
prisma/schema.prisma
prisma/migrations/
```

## Security

Never commit:

- `.env`
- passwords
- private database connection strings
- API keys
- private keys
- production secrets
