import * as dotenv from "dotenv";
import chalk from "chalk";
import { getTopRatedHotel } from "./scrapers/getTopHotel";
import { fetchPlatformPrices } from "./scrapers/fetchPrices";
import { printResultsTable, saveResultsToFile } from "./display";
import { SEARCH_CONFIG } from "./config";
import { ScraperResult } from "./types";

dotenv.config();

function getApiKey(): string {
  const key = process.env.SERPAPI_KEY;
  if (!key || key === "your_serpapi_key_here") {
    console.error(chalk.red("\n❌ ERROR: SERPAPI_KEY not set."));
    console.error(chalk.yellow("   1. Go to https://serpapi.com/ and sign up"));
    console.error(chalk.yellow("   2. Copy your API key from the dashboard"));
    console.error(chalk.yellow("   3. Paste it into the .env file\n"));
    process.exit(1);
  }
  return key;
}

async function main(): Promise<void> {
  console.log(chalk.bold.cyan(
    "\n🏨 Hotel Price Scraper — Powered by SerpAPI (Google Hotels)"
  ));
  console.log(chalk.dim("─".repeat(60)));

  const apiKey = getApiKey();
  const config = SEARCH_CONFIG;

  try {
    // Step 1: Find top rated 5-star hotel
    const topHotel = await getTopRatedHotel(config, apiKey);

    // Step 2: Get all available prices via SerpAPI
    const prices = await fetchPlatformPrices(topHotel, config, apiKey);

    const result: ScraperResult = {
      searchConfig: config,
      topHotel,
      prices,
      lowestPrice: prices[0],
      scrapedAt: new Date().toISOString(),
    };

    // Step 3: Display results table
    printResultsTable(result);
    saveResultsToFile(result);

    // Step 4: Manual check links for Indian OTAs
    const [y, m, d] = config.checkIn.split("-");
    const [y2, m2, d2] = config.checkOut.split("-");
    const hotelEncoded = encodeURIComponent(topHotel.name);

    const mmtUrl =
      `https://www.makemytrip.com/hotels/hotel-listing/` +
      `?checkin=${m}%2F${d}%2F${y}` +
      `&checkout=${m2}%2F${d2}%2F${y2}` +
      `&roomStayQualifier=2e0e` +
      `&locusId=CTMUM&nation=in&locusType=city` +
      `&searchText=${hotelEncoded}`;

    const goibiboUrl =
      `https://www.goibibo.com/hotels/hotels-in-mumbai-ct/` +
      `?checkin=${config.checkIn.replace(/-/g, "")}` +
      `&checkout=${config.checkOut.replace(/-/g, "")}` +
      `&adults=2&children=1&childAge=1`;

    const cleartripUrl =
      `https://www.cleartrip.com/hotels/results/?` +
      `checkin=${config.checkIn}` +
      `&checkout=${config.checkOut}` +
      `&adults=2&children=1&child_ages=1` +
      `&city=Mumbai&country=IN` +
      `&q=${hotelEncoded}`;

    console.log(chalk.bold.yellow(
      "\n  📱 CHECK INDIAN OTAs MANUALLY"
    ));
    console.log(chalk.dim("  " + "─".repeat(55)));
    console.log(chalk.white(
      "  These platforms block automated scraping."
    ));
    console.log(chalk.white(
      "  Click links below to check prices manually:\n"
    ));
    console.log(chalk.cyan("  🔵 MakeMyTrip :"));
    console.log(chalk.white(`     ${mmtUrl}\n`));
    console.log(chalk.cyan("  🔵 Goibibo    :"));
    console.log(chalk.white(`     ${goibiboUrl}\n`));
    console.log(chalk.cyan("  🔵 ClearTrip  :"));
    console.log(chalk.white(`     ${cleartripUrl}\n`));
    console.log(chalk.dim("  " + "─".repeat(55)));
    console.log(chalk.bold.green("  ✅ Scraper completed successfully!\n"));

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(chalk.red(`\n❌ Error: ${message}`));
    process.exit(1);
  }
}

main();