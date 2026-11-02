import type {
  FlippFlyer,
  FlippFlyerDetails,
  FlippFlyerListResponse,
  FlippItemDetail,
} from "./flipp.types.js";

const DEFAULT_BASE_URL = "https://backflipp.wishabi.com/flipp";
const DEFAULT_USER_AGENT =
  "KavyoFlyerIngestion/1.0 (+https://kavyo.ca; flyer price research)";

export interface FlippClientOptions {
  postalCode?: string;
  locale?: string;
  baseUrl?: string;
  userAgent?: string;
  timeoutMs?: number;
  retryCount?: number;
  concurrency?: number;
  requestDelayMs?: number;
}

export class FlippRequestError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
    readonly url: string,
  ) {
    super(message);
    this.name = "FlippRequestError";
  }
}

/**
 * Small client for the public JSON used by Flipp's flyer widget.
 *
 * This is intentionally conservative: requests are rate limited, identified,
 * retried only for transient failures, and never attempt to bypass access
 * controls. Confirm the source's terms of use before using it in production.
 */
export class FlippClient {
  private readonly postalCode: string;
  private readonly locale: string;
  private readonly baseUrl: string;
  private readonly userAgent: string;
  private readonly timeoutMs: number;
  private readonly retryCount: number;
  private readonly concurrency: number;
  private readonly requestDelayMs: number;

  constructor(options: FlippClientOptions = {}) {
    this.postalCode = (options.postalCode ?? "T3M1T4").replace(/\s+/g, "").toUpperCase();
    this.locale = options.locale ?? "en-ca";
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this.userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
    this.timeoutMs = options.timeoutMs ?? 20_000;
    this.retryCount = options.retryCount ?? 3;
    this.concurrency = Math.max(1, options.concurrency ?? 4);
    this.requestDelayMs = Math.max(0, options.requestDelayMs ?? 75);
  }

  async listFlyers(): Promise<FlippFlyer[]> {
    const url = new URL(`${this.baseUrl}/flyers`);
    url.searchParams.set("locale", this.locale);
    url.searchParams.set("postal_code", this.postalCode);

    const response = await this.requestJson<FlippFlyerListResponse>(url);
    return response.flyers ?? [];
  }

  async getFlyer(flyerId: number): Promise<FlippFlyerDetails> {
    const url = new URL(`${this.baseUrl}/flyers/${flyerId}`);
    url.searchParams.set("locale", this.locale);
    url.searchParams.set("postal_code", this.postalCode);

    return this.requestJson<FlippFlyerDetails>(url);
  }

  async getItem(itemId: number): Promise<FlippItemDetail> {
    const url = new URL(`${this.baseUrl}/items/${itemId}`);
    url.searchParams.set("locale", this.locale);

    const response = await this.requestJson<{ item: FlippItemDetail }>(url);
    return response.item;
  }

  async getItemDetails(
    itemIds: number[],
    onProgress?: (completed: number, total: number) => void,
  ): Promise<Map<number, FlippItemDetail>> {
    const uniqueIds = [...new Set(itemIds)];
    const details = new Map<number, FlippItemDetail>();
    let nextIndex = 0;
    let completed = 0;

    const worker = async () => {
      while (nextIndex < uniqueIds.length) {
        const itemId = uniqueIds[nextIndex++];

        const detail = await this.getItem(itemId);
        details.set(itemId, detail);
        completed += 1;
        onProgress?.(completed, uniqueIds.length);

        if (this.requestDelayMs > 0 && nextIndex < uniqueIds.length) {
          await sleep(this.requestDelayMs);
        }
      }
    };

    await Promise.all(
      Array.from({ length: Math.min(this.concurrency, uniqueIds.length) }, () =>
        worker(),
      ),
    );

    return details;
  }

  private async requestJson<T>(url: URL): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= this.retryCount; attempt += 1) {
      try {
        const response = await fetch(url, {
          headers: {
            Accept: "application/json",
            "User-Agent": this.userAgent,
          },
          signal: AbortSignal.timeout(this.timeoutMs),
        });

        if (!response.ok) {
          const retryable = response.status === 429 || response.status >= 500;
          const error = new FlippRequestError(
            `Flipp request failed with HTTP ${response.status}`,
            response.status,
            url.toString(),
          );

          if (!retryable || attempt === this.retryCount) {
            throw error;
          }

          lastError = error;
        } else {
          return (await response.json()) as T;
        }
      } catch (error) {
        lastError = error;
        const status = error instanceof FlippRequestError ? error.status : null;
        const retryable =
          status === null || status === 429 || (status !== null && status >= 500);

        if (!retryable || attempt === this.retryCount) {
          throw error;
        }
      }

      await sleep(500 * 2 ** (attempt - 1));
    }

    throw lastError instanceof Error
      ? lastError
      : new Error(`Flipp request failed: ${url.toString()}`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
