export interface FlippFlyer {
  id: number;
  flyer_run_id: number;
  flyer_type_id?: number;
  name: string;
  merchant: string;
  merchant_id: number;
  valid_from: string;
  valid_to: string;
  available_from?: string;
  available_to?: string;
  categories?: string[];
  width?: number;
  height?: number;
  path?: string;
  thumbnail_url?: string | null;
  relationship?: boolean;
  postal_code?: string;
  locale?: string;
  updated_at?: string;
}

export interface FlippFlyerListResponse {
  flyers: FlippFlyer[];
  refreshed_at?: string;
}

export interface FlippFlyerItem {
  id: number;
  flyer_id: number;
  name: string;
  brand?: string | null;
  price?: string | number | null;
  valid_from?: string;
  valid_to?: string;
  cutout_image_url?: string | null;
  page_destination?: string | null;
  text_areas?: unknown[];
  sale_story?: string | null;
  pre_price_text?: string | null;
  post_price_text?: string | null;
}

export interface FlippFlyerPage {
  id: number;
  page: number;
  name?: string;
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
}

export interface FlippFlyerDetails {
  items: FlippFlyerItem[];
  pages?: FlippFlyerPage[];
  has_corrections?: boolean;
}

export interface FlippItemDetail {
  id: number;
  flyer_id: number;
  name: string;
  description?: string | null;
  price_text?: string | null;
  disclaimer_text?: string | null;
  sale_story?: string | null;
  sku?: string | null;
  current_price_range?: [number, number] | null;
  original_price_range?: [number, number] | null;
  in_store_only?: boolean;
  category?: string | null;
  timezone?: number;
  related_items?: unknown[];
}
