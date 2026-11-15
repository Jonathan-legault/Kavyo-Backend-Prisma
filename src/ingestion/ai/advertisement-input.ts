
/**
 * Kavyo AI — Source advertisement input.
 *
 * The original Flipp fields remain authoritative.
 * This object is an interpretation request, not a Product
 * or AdvertisedOffer database record.
 */

export interface AdvertisementInput {
    source: 'flipp';
    sourceItemId: string;
    flyerId: string | null;

    retailer: string;
    name: string;
    brandText: string | null;
    description: string | null;

    currentPrice: string | null;
    priceText: string | null;
    prePriceText: string | null;
    saleStory: string | null;
    disclaimerText: string | null;

    sku: string | null;
    imageUrl: string | null;
    cutoutImageUrl: string | null;
}

interface FlippItem {
    id: string | number;
    flyer_id?: string | number | null;
    merchant?: string | null;
    name?: string | null;
    brand?: string | null;
    description?: string | null;
    current_price?: string | number | null;
    price_text?: string | null;
    pre_price_text?: string | null;
    sale_story?: string | null;
    disclaimer_text?: string | null;
    sku?: string | null;
    image_url?: string | null;
    cutout_image_url?: string | null;
}

export interface FlippCaptureRecord {
    item: FlippItem;
}

function optionalText(
    value: string | number | null | undefined,
): string | null {
    if (value === null || value === undefined) {
        return null;
    }

    const text = String(value).trim();
    return text.length > 0 ? text : null;
}

/**
 * Converts one archived Flipp item into our AI input.
 *
 * No AI inference, database access or product matching.
 * No brand-to-product relationships are assumed.
 */
export function fromFlippRecord(
    record: FlippCaptureRecord,
): AdvertisementInput {
    const item = record.item;

    if (!item || item.id === null || item.id === undefined) {
        throw new Error('Flipp item identifier is missing.');
    }

    if (!item.name?.trim()) {
        throw new Error(
            `Flipp item ${item.id} has no product name.`,
        );
    }

    if (!item.merchant?.trim()) {
        throw new Error(
            `Flipp item ${item.id} has no retailer.`,
        );
    }

    return {
        source: 'flipp',
        sourceItemId: String(item.id),
        flyerId: optionalText(item.flyer_id),

        retailer: item.merchant,
        name: item.name,
        brandText: optionalText(item.brand),
        description: optionalText(item.description),

        currentPrice: optionalText(item.current_price),
        priceText: optionalText(item.price_text),
        prePriceText: optionalText(item.pre_price_text),
        saleStory: optionalText(item.sale_story),
        disclaimerText: optionalText(item.disclaimer_text),

        sku: optionalText(item.sku),
        imageUrl: optionalText(item.image_url),
        cutoutImageUrl: optionalText(item.cutout_image_url),
    };
}

/**
 * Textual evidence available for interpretation.
 *
 * Structured price and identifier fields are deliberately
 * excluded: they should be handled as source facts rather
 * than reconstructed by the language model.
 */
export function advertisementEvidenceText(
    input: AdvertisementInput,
): string {
    return [
        input.name,
        input.brandText,
        input.description,
        input.priceText,
        input.prePriceText,
        input.saleStory,
        input.disclaimerText,
    ]
        .filter(
            (value): value is string =>
                typeof value === 'string' && value.length > 0,
        )
        .join('\n');
}
