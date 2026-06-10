import puppeteer from "puppeteer";
import { PlatformPrice } from "../types";
import { NIGHTS } from "../config";

export async function fetchMakeMyTripPrice(
  hotelName: string,
  checkIn: string,
  checkOut: string
): Promise<PlatformPrice | null> {
  console.log("\n🌐 Opening MakeMyTrip in browser...");

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--window-size=1280,800",
    ],
  });

  const page = await browser.newPage();

  try {
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
    });
    await page.setExtraHTTPHeaders({ "Accept-Language": "en-IN,en;q=0.9" });

    // Step 1: Go to MMT homepage to get cookies
    console.log("   → Loading MakeMyTrip homepage...");
    await page.goto("https://www.makemytrip.com/", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });
    await new Promise((r) => setTimeout(r, 4000));

    // Step 2: Navigate to hotels section
    await page.goto("https://www.makemytrip.com/hotels/", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });
    await new Promise((r) => setTimeout(r, 3000));

    // Step 3: Build correct MMT date format MM/DD/YYYY
    const [y, m, d] = checkIn.split("-");
    const [y2, m2, d2] = checkOut.split("-");

    const searchUrl =
      `https://www.makemytrip.com/hotels/hotel-listing/` +
      `?checkin=${m}%2F${d}%2F${y}` +
      `&checkout=${m2}%2F${d2}%2F${y2}` +
      `&roomStayQualifier=2e0e` +
      `&locusId=CTMUM` +
      `&nation=in` +
      `&locusType=city` +
      `&searchText=${encodeURIComponent(hotelName)}` +
      `&type=hotel`;

    console.log("   → Navigating to search results...");
    await page.goto(searchUrl, { waitUntil: "networkidle2", timeout: 40000 });
    await new Promise((r) => setTimeout(r, 8000));

    await page.screenshot({ path: "mmt-debug.png" });
    console.log("   📸 Screenshot saved: mmt-debug.png");

    const price = await page.evaluate(() => {
      // Try to find ₹ price patterns in page text
      const allText = document.body.innerText;
      const matches = allText.match(/₹[\s]?[\d,]+/g);
      if (matches) {
        for (const match of matches) {
          const num = parseInt(match.replace(/[^0-9]/g, ""));
          if (num > 1000 && num < 500000) return num;
        }
      }

      const selectors = [
        '[data-cy="hotelPrice"]',
        ".hlistpg-hotel-price",
        ".actual-price",
        '[class*="price"]',
        '[class*="Price"]',
        '[class*="amount"]',
        '[class*="tariff"]',
      ];
      for (const sel of selectors) {
        for (const el of Array.from(document.querySelectorAll(sel))) {
          const text = el.textContent?.replace(/[^0-9]/g, "") ?? "";
          const num = parseInt(text);
          if (num > 1000 && num < 500000) return num;
        }
      }
      return null;
    });

    const bookingUrl = page.url();
    await browser.close();

    if (!price) {
      console.log("   ⚠️  Could not extract MakeMyTrip price — check mmt-debug.png");
      return null;
    }

    console.log(`   ✅ MakeMyTrip: ₹${price.toLocaleString("en-IN")}/night`);
    return {
      platform: "MakeMyTrip",
      pricePerNight: price,
      totalPrice: price * NIGHTS,
      nights: NIGHTS,
      bookingUrl,
      isLowestPrice: false,
    };
  } catch (err) {
    await browser.close();
    console.log("   ⚠️  MakeMyTrip failed:", (err as Error).message);
    return null;
  }
}