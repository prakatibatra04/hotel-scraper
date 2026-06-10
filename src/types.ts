export interface SearchConfig {
  city: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  infantAge: number;
  currency: string;
  starRating: number;
}

export interface HotelResult {
  name: string;
  rating: number;
  reviewCount: number;
  stars: number;
  address: string;
  description?: string;
  thumbnail?: string;
  serpApiPropertyId?: string;
}

export interface PlatformPrice {
  platform: string;
  pricePerNight: number;
  totalPrice: number;
  nights: number;
  bookingUrl: string;
  taxes?: number;
  isLowestPrice: boolean;
}

export interface ScraperResult {
  searchConfig: SearchConfig;
  topHotel: HotelResult;
  prices: PlatformPrice[];
  lowestPrice: PlatformPrice;
  scrapedAt: string;
}

export interface SerpApiRateInfo {
  lowest?: string;
  extracted_lowest?: number;
  before_taxes_fees?: string;
  extracted_before_taxes_fees?: number;
}

export interface SerpApiPriceEntry {
  source: string;
  logo?: string;
  link?: string;
  rate_per_night?: SerpApiRateInfo;
  total_rate?: SerpApiRateInfo;
}

export interface SerpApiHotelProperty {
  name: string;
  overall_rating?: number;
  reviews?: number;
  hotel_class?: string;
  extracted_hotel_class?: number;
  address?: string;
  location?: string;
  neighborhood?: string;
  gps_coordinates?: { latitude: number; longitude: number };
  description?: string;
  thumbnail?: string;
  serpapi_property_details_link?: string;
  property_token?: string;
  link?: string;
  rate_per_night?: SerpApiRateInfo;
  total_rate?: SerpApiRateInfo;
  prices?: SerpApiPriceEntry[];
  serp_prices?: SerpApiPriceEntry[];
  [key: string]: unknown;
}
export interface HotelResult {
  name: string;
  rating: number;
  reviewCount: number;
  stars: number;
  address: string;
  description?: string;
  thumbnail?: string;
  serpApiPropertyId?: string;
  serpApiDetailsLink?: string;   // ← ADD THIS
  ratePerNight?: number;
  totalRate?: number;
  link?: string;
}

export interface SerpApiHotelSearchResponse {
  search_metadata?: { status: string; id: string };
  search_parameters?: Record<string, unknown>;
  error?: string;
  properties?: SerpApiHotelProperty[];
}

export interface SerpApiPropertyDetailsResponse {
  error?: string;
  prices?: SerpApiPriceEntry[];
  name?: string;
  overall_rating?: number;
}