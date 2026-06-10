import axios from "axios";
import {
  SearchConfig,
  HotelResult,
  PlatformPrice,
  SerpApiPriceEntry,
} from "../types";
import { NIGHTS } from "../config";
import { parsePriceString } from "./getTopHotel";

function buildPlatformPrice(
  source: string,
  link: string | undefined,
  totalExtracted: number | undefined,
  totalStr: string | undefined,
  perNightExtracted: number | undefined,
  perNightStr: string | undefined
): PlatformPrice | null {
  let total = totalExtracted ?? parsePriceString(totalStr);
  let perNight = perNightExtracted ?? parsePriceString(perNightStr);

  if (total === 0 && perNight > 0) total = perNight * NIGHTS;
  if (perNight === 0 && total > 0) perNight = Math.round(total / NIGHTS);
  if (total === 0 && perNight === 0) return null;

  return {
    platform: source,
    pricePerNight: perNight,
    totalPrice: total,
    nights: NIGHTS,
    bookingUrl: link ?? "",
    isLowestPrice: false,
  };
}

// Strategy A: Call the serpapi_property_details_link directly
async function fetchViaDetailsLink(
  detailsLink: string,
  apiKey: string
): Promise<PlatformPrice[]> {
  if (!detailsLink) return [];

  console.log("\n📡 Fetching platform breakdown via property details link...");

  try {
    // Append API key to the details link
    const url = `${detailsLink}&api_key=${apiKey}`;
    const response = await axios.get(url);
    const data = response.data;

    console.log("\n🔍 Property details response keys:", Object.keys(data));

    if (data.error) {
      console.log(`⚠️  Details link error: ${data.error}`);
      return [];
    }

    // Try to find prices in the response
    const rawPrices: SerpApiPriceEntry[] =
      data.prices ??
      data.serp_prices ??
      data.properties?.[0]?.prices ??
      [];

    if (rawPrices.length === 0) {
      console.log("⚠️  No platform prices in details response");
      return [];
    }

    const prices: PlatformPrice[] = [];
    for (const p of rawPrices) {
      const entry = buildPlatformPrice(
        p.source ?? "Unknown",
        p.link,
        p.total_rate?.extracted_lowest,
        p.total_rate?.lowest,
        p.rate_per_night?.extracted_lowest,
        p.rate_per_night?.lowest
      );
      if (entry) prices.push(entry);
    }

    return prices;
  } catch (err) {
    console.log("⚠️  Details link fetch failed, using fallback");
    return [];
  }
}

// Strategy B: Use the rate already returned from the first search
function buildFromSearchRate(hotel: HotelResult): PlatformPrice[] {
  console.log("\n📡 Using rate from initial search result...");

  const perNight = hotel.ratePerNight ?? 0;
  const total = hotel.totalRate ?? 0;

  if (perNight === 0 && total === 0) return [];

  const finalPerNight = perNight > 0 ? perNight : Math.round(total / NIGHTS);
  const finalTotal = total > 0 ? total : perNight * NIGHTS;

  return [
    {
      platform: "Google Hotels (Best Available Rate)",
      pricePerNight: finalPerNight,
      totalPrice: finalTotal,
      nights: NIGHTS,
      bookingUrl: hotel.link ?? "",
      isLowestPrice: true,
    },
  ];
}

export async function fetchPlatformPrices(
  hotel: HotelResult,
  config: SearchConfig,
  apiKey: string
): Promise<PlatformPrice[]> {

  // Strategy A: try to get per-platform breakdown
  let prices: PlatformPrice[] = [];

  if (hotel.serpApiDetailsLink) {
    prices = await fetchViaDetailsLink(hotel.serpApiDetailsLink, apiKey);
  }

  // Strategy B: fall back to rate already in search result
  if (prices.length === 0) {
    prices = buildFromSearchRate(hotel);
  }

  if (prices.length === 0) {
    throw new Error(
      "No prices found for this hotel. Try different dates."
    );
  }

  prices.sort((a, b) => a.totalPrice - b.totalPrice);
  prices[0].isLowestPrice = true;

  console.log(`\n✅ Found prices from ${prices.length} platform(s)`);
  return prices;
}