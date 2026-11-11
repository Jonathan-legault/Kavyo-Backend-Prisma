# Prisma models — implementation draft, NOT merged into schema

These snippets are for reviewed B.2 implementation **after** the B.1 audit/backup.
Do not paste this entire file into schema.prisma without adding required reverse relations.

## Existing Product change
```prisma
// Within Product:
barcode String? @unique @db.VarChar(64)
// Add relations:
// evidence ProductEvidence[]
// advertisedOffers AdvertisedOffer[]
```

## New ProductEvidence
```prisma
model ProductEvidence {
  id             String   @id @default(uuid()) @db.Uuid
  productId      String   @map("product_id") @db.Uuid
  sourceSystemId String   @map("source_system_id") @db.Uuid
  sourceRecordId String   @map("source_record_id") @db.VarChar(300)
  evidenceType   String   @map("evidence_type") @db.VarChar(40)
  verified       Boolean  @default(false)
  capturedAt     DateTime @default(now()) @map("captured_at") @db.Timestamptz(6)
  rawPayload     Json?    @map("raw_payload") @db.JsonB

  product      Product      @relation(fields: [productId], references: [id], onDelete: Restrict)
  sourceSystem SourceSystem @relation(fields: [sourceSystemId], references: [id], onDelete: Restrict)

  @@index([productId, capturedAt])
  @@index([sourceSystemId, sourceRecordId])
  @@map("product_evidence")
}
```

## New AdvertisedOffer
```prisma
model AdvertisedOffer {
  id                    String    @id @default(uuid()) @db.Uuid
  stableKey             String    @unique @map("stable_key") @db.VarChar(64)
  sourceSystemId         String    @map("source_system_id") @db.Uuid
  retailerId             String    @map("retailer_id") @db.Uuid
  storeId                String?   @map("store_id") @db.Uuid
  productId              String?   @map("product_id") @db.Uuid
  flyerId                String?   @map("flyer_id") @db.Uuid
  flyerExternalId        String    @map("flyer_external_id") @db.VarChar(100)
  sourceRecordId         String    @map("source_record_id") @db.VarChar(300)
  marketKey              String    @map("market_key") @db.VarChar(60)
  productName            String    @map("product_name") @db.VarChar(500)
  packageSizeText        String?   @map("package_size_text") @db.VarChar(200)
  advertisedPriceAmount  Decimal?  @map("advertised_price_amount") @db.Decimal(12, 3)
  regularPriceAmount     Decimal?  @map("regular_price_amount") @db.Decimal(12, 3)
  currency               String    @default("CAD") @db.VarChar(3)
  promotionText          String?   @map("promotion_text") @db.Text
  conditionEvidence      Json?     @map("condition_evidence") @db.JsonB
  sourceUrl              String?   @map("source_url") @db.VarChar(1000)
  rawPayload             Json?     @map("raw_payload") @db.JsonB
  observedAt             DateTime  @map("observed_at") @db.Timestamptz(6)
  validFrom              DateTime? @map("valid_from") @db.Timestamptz(6)
  validUntil             DateTime? @map("valid_until") @db.Timestamptz(6)
  lastSeenAt             DateTime  @map("last_seen_at") @db.Timestamptz(6)
  createdAt              DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt              DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

  sourceSystem SourceSystem @relation(fields: [sourceSystemId], references: [id], onDelete: Restrict)
  retailer     Retailer     @relation(fields: [retailerId], references: [id], onDelete: Restrict)
  store        Store?       @relation(fields: [storeId], references: [id], onDelete: SetNull)
  product      Product?     @relation(fields: [productId], references: [id], onDelete: SetNull)
  flyer        Flyer?       @relation(fields: [flyerId], references: [id], onDelete: SetNull)

  @@index([retailerId, validUntil])
  @@index([productId, validUntil])
  @@index([sourceSystemId, flyerExternalId, sourceRecordId])
  @@map("advertised_offers")
}
```

## Reverse relationships to add to existing models
- `Product`: `evidence ProductEvidence[]` and `advertisedOffers AdvertisedOffer[]`
- `SourceSystem`: `productEvidence ProductEvidence[]` and `advertisedOffers AdvertisedOffer[]`
- `Retailer`: `advertisedOffers AdvertisedOffer[]`
- `Store`: `advertisedOffers AdvertisedOffer[]`
- `Flyer`: `advertisedOffers AdvertisedOffer[]`

## Required review before migration
1. Is `marketKey` enough to distinguish location-specific advertised prices? Confirm real Flipp keys.
2. Should the same external item retain history when its price changes mid-flyer? If yes, add append-only offer revisions.
3. Should `validUntil` be inclusive at source granularity? Preserve original timestamp; avoid guessing date format.
4. Are nullable barcodes safe for every existing API/validator? Search all code usages before migration.
5. Check catalog references and historical migrations in the restored DB.
6. Run `npx prisma validate`, `npx prisma migrate dev --create-only`, review SQL, generate client, compile and test.
