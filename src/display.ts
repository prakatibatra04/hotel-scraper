const Table = require("cli-table3");
import * as fs from "fs";
import * as path from "path";
import chalk from "chalk";
import { ScraperResult, PlatformPrice } from "./types";
import { NIGHTS } from "./config";

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function printResultsTable(result: ScraperResult): void {
  const { topHotel, prices, lowestPrice, searchConfig } = result;

  console.log("\n" + chalk.bold("═".repeat(70)));
  console.log(chalk.bold.cyan("  🏨 HOTEL PRICE COMPARISON RESULTS"));
  console.log(chalk.bold("═".repeat(70)));

  console.log(chalk.yellow(`\n  📍 City        : ${searchConfig.city}`));
  console.log(chalk.yellow(`  📅 Dates       : ${searchConfig.checkIn}  →  ${searchConfig.checkOut}  (${NIGHTS} nights)`));
  console.log(chalk.yellow(`  👥 Guests      : ${searchConfig.adults} Adults + 1 Infant (age ${searchConfig.infantAge})`));
  console.log(chalk.yellow(`  💰 Currency    : ${searchConfig.currency}`));

  console.log(chalk.bold("\n  🏆 TOP-RATED 5-STAR HOTEL"));
  console.log(`  Name    : ${chalk.bold.white(topHotel.name)}`);
  console.log(`  Rating  : ${chalk.green(topHotel.rating + " ⭐")}  (${topHotel.reviewCount.toLocaleString()} reviews)`);
  console.log(`  Address : ${topHotel.address}`);

  console.log(chalk.bold("\n  💸 PRICES ACROSS PLATFORMS\n"));

  const table = new Table({
    head: [
      chalk.bold("Platform"),
      chalk.bold("Per Night"),
      chalk.bold(`Total (${NIGHTS} Nights)`),
      chalk.bold("Booking URL"),
    ],
    colWidths: [22, 16, 20, 45],
    style: { head: [], border: [] },
  });

  for (const p of prices) {
    const isLowest = p.isLowestPrice;
    const row = [
      isLowest ? chalk.green.bold("★ " + p.platform) : p.platform,
      isLowest ? chalk.green(formatINR(p.pricePerNight)) : formatINR(p.pricePerNight),
      isLowest ? chalk.green.bold(formatINR(p.totalPrice)) : formatINR(p.totalPrice),
      p.bookingUrl ? p.bookingUrl.substring(0, 42) + "…" : "N/A",
    ];
    table.push(row);
  }

  console.log(table.toString());

  console.log("\n" + chalk.bold("═".repeat(70)));
  console.log(
    chalk.bold.green(
      `  ✅ LOWEST PRICE: ${lowestPrice.platform}  →  ${formatINR(lowestPrice.totalPrice)} for ${NIGHTS} nights`
    )
  );
  console.log(chalk.bold.green(`  🔗 Book here   : ${lowestPrice.bookingUrl}`));
  console.log(chalk.bold("═".repeat(70)) + "\n");
}

export function saveResultsToFile(result: ScraperResult): void {
  const outputPath = path.resolve(process.cwd(), "results.json");

  const output = {
    scrapedAt: result.scrapedAt,
    searchConfig: result.searchConfig,
    topHotel: {
      name: result.topHotel.name,
      rating: result.topHotel.rating,
      reviewCount: result.topHotel.reviewCount,
      stars: result.topHotel.stars,
      address: result.topHotel.address,
    },
    lowestPrice: {
      platform: result.lowestPrice.platform,
      pricePerNight: result.lowestPrice.pricePerNight,
      totalPrice: result.lowestPrice.totalPrice,
      nights: result.lowestPrice.nights,
      bookingUrl: result.lowestPrice.bookingUrl,
    },
    allPrices: result.prices.map((p: PlatformPrice) => ({
      platform: p.platform,
      pricePerNight: p.pricePerNight,
      totalPrice: p.totalPrice,
      bookingUrl: p.bookingUrl,
    })),
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf-8");
  console.log(chalk.dim(`  💾 Results saved to: ${outputPath}\n`));
}