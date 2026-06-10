import axios from "axios";
import {
  SearchConfig,
  HotelResult,
  SerpApiHotelSearchResponse,
  SerpApiHotelProperty,
} from "../types";
import { SERPAPI_BASE } from "../config";

function parseStarClass(hotelClass?: string, extracted?: number): number {
  if (extracted) return extracted;
  if (!hotelClass) return 0;
  const match = hotelClass.match(/(\d)/);
  return match ? parseInt(match[1]) : 0;
}

export function parsePriceString(priceStr?: string): number {
  if (!priceStr) return 0;
  return parseFloat(priceStr.replace(/[^0-9.]/g, "")) || 0;
}

export async function getTopRatedHotel(
  config: SearchConfig,
  apiKey: string
): Promise<HotelResult> {
  console.log(`\n🔍 Searching for top-rated 5-star hotels in ${config.city}...`);

  const params = {
    engine: "google_hotels",
    q: `5 star hotels in ${config.city}`,
    check_in_date: config.checkIn,
    check_out_date: config.checkOut,
    adults: config.adults.toString(),
    children: "1",
    children_ages: config.infantAge.toString(),
    currency: config.currency,
    hotel_class: "5",
    sort_by: "3",
    hl: "en",
    gl: "in",
    api_key: apiKey,
  };

  const response = await axios.get<SerpApiHotelSearchResponse>(SERPAPI_BASE, { params });
  const data = response.data;

  if (data.error) {
    throw new Error(`SerpAPI error: ${data.error}`);
  }

  const properties: SerpApiHotelProperty[] = data.properties || [];

  if (properties.length === 0) {
    throw new Error("No hotels found. Check your city name or API key.");
  }

  // Log top 5 hotels returned
  console.log("\n📋 Top hotels returned by SerpAPI:");
  properties.slice(0, 5).forEach((h, i) => {
    console.log(
      `   ${i + 1}. ${h.name} | ` +
      `Rating: ${h.overall_rating ?? "N/A"} | ` +
      `Stars: ${h.hotel_class ?? "N/A"} | ` +
      `Address: ${h.address ?? h.location ?? h.neighborhood ?? "N/A"}`
    );
  });

  // Filter to 5-star only, sort by rating
  const fiveStarHotels = properties
    .filter((h) => parseStarClass(h.hotel_class, h.extracted_hotel_class) === 5)
    .sort((a, b) => (b.overall_rating ?? 0) - (a.overall_rating ?? 0));

  const sorted =
    fiveStarHotels.length > 0
      ? fiveStarHotels
      : [...properties].sort((a, b) => (b.overall_rating ?? 0) - (a.overall_rating ?? 0));

  const top = sorted[0];

  // Debug: print full raw object so we know all available fields
  console.log("\n🔍 Full raw data for top hotel:");
  console.log(JSON.stringify(top, null, 2));

  // Extract property token for details lookup
  const detailsLink = top.serpapi_property_details_link ?? "";
  const tokenMatch = detailsLink.match(/property_token=([^&]+)/);
  const propertyToken =
    top.property_token ?? (tokenMatch ? tokenMatch[1] : undefined);

  // Extract address from whichever field is available
  const address =
    top.address ??
    top.location ??
    top.neighborhood ??
    config.city;

 const hotel: HotelResult = {
    name: top.name,
    rating: top.overall_rating ?? 0,
    reviewCount: top.reviews ?? 0,
    stars: parseStarClass(top.hotel_class, top.extracted_hotel_class),
    address: address,
    description: top.description,
    thumbnail: top.thumbnail,
    serpApiPropertyId: propertyToken,
    serpApiDetailsLink: top.serpapi_property_details_link,  // ← ADD
    ratePerNight: top.rate_per_night?.extracted_lowest,
    totalRate: top.total_rate?.extracted_lowest,
    link: top.link,
  };

  console.log(`\n✅ Top hotel found : ${hotel.name}`);
  console.log(`   ⭐ Rating        : ${hotel.rating} (${hotel.reviewCount.toLocaleString()} reviews)`);
  console.log(`   🏨 Stars         : ${hotel.stars}-star`);
  console.log(`   📍 Address       : ${hotel.address}`);

  return hotel;
}