
import { Injectable } from '@nestjs/common';

import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

import type { NormalizedOffer } from '../contracts/normalized-offer.js';
import { prepareStagedOffers } from './staged-offer.mapper.js';

export interface StagingResult {
  batchId: string;
  received: number;
  inserted: number;
  skippedExisting: number;
}

@Injectable()
export class StagingService {
  constructor(private readonly prisma: PrismaService) {}

  async stageOffers(
    ingestBatchId: string,
    offers: NormalizedOffer[],
  ): Promise<StagingResult> {

    // 1. Prepare records and check for duplicate keys
    const prepared = prepareStagedOffers(offers);

    // 2. Verify that the ingestion batch exists
    const batch = await this.prisma.ingestBatch.findUnique({
      where: {
        id: ingestBatchId,
      },
      include: {
        sourceSystem: true,
      },
    });

    if (!batch) {
      throw new Error(
        `Ingestion batch not found: ${ingestBatchId}`,
      );
    }

    // 3. Verify that all offers belong to the batch source
    for (const offer of offers) {
      if (offer.sourceSystem !== batch.sourceSystem.name) {
        throw new Error(
          `Source mismatch: expected ${batch.sourceSystem.name}, ` +
          `received ${offer.sourceSystem}`,
        );
      }
    }

    // 4. Convert prepared records into Prisma input
    const data: Prisma.StagedOfferCreateManyInput[] =
      prepared.map((offer) => ({
        ingestBatchId,

        recordKey: offer.recordKey,
        sourceRecordId: offer.sourceRecordId,
        sourceReference: offer.sourceReference,

        retailerName: offer.retailerName,
        storeIdentifier: offer.storeIdentifier,
        applicability: offer.applicability,

        productName: offer.productName,
        brand: offer.brand,

        advertisedPriceText: offer.advertisedPriceText,
        advertisedPriceAmount: offer.advertisedPriceAmount,
        advertisedPriceUnit: offer.advertisedPriceUnit,

        extractionMethod: offer.extractionMethod,

        status: 'PENDING_REVIEW',
        reviewRequired: offer.reviewRequired,

        reviewReasons: offer.reviewReasons,
        normalizedPayload:
          offer.normalizedPayload as Prisma.InputJsonValue,
      }));

    // 5. Insert into the staging table only
    const result = await this.prisma.stagedOffer.createMany({
      data,
      skipDuplicates: true,
    });

    // 6. Return the insertion summary
    return {
      batchId: ingestBatchId,
      received: offers.length,
      inserted: result.count,
      skippedExisting: offers.length - result.count,
    };
  }
}
