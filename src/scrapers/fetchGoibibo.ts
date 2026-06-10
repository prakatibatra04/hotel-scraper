import puppeteer from "puppeteer";
import { PlatformPrice } from "../types";
import { NIGHTS } from "../config";

export async function fetchGoibiboPrice(
  hotelName: string,
  checkIn: string,
  checkOut: string
): Promise<PlatformPrice | null> {
  console.log("\n🌐 Opening Goibibo in browser...");

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

    // Step 1: Go to Goibibo homepage first
    console.log("   → Loading Goibibo homepage...");
    await page.goto("https://www.goibibo.com/", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });
    await new Promise((r) => setTimeout(r, 4000));

    // Step 2: Use correct Goibibo hotel search URL
    const checkinFmt = checkIn.replace(/-/g, "");
    const checkoutFmt = checkOut.replace(/-/g, "");

    const searchUrl =
      `https://www.goibibo.com/hotels/hotels-in-mumbai-ct/` +
      `?checkin=${checkinFmt}` +
      `&checkout=${checkoutFmt}` +
      `&adults=2&children=1` +
      `&childAge=1` +
      `&cc=IN`;

    console.log("   → Navigating to Mumbai hotels...");
    await page.goto(searchUrl, { waitUntil: "networkidle2", timeout: 40000 });
    await new Promise((r) => setTimeout(r, 5000));

    // Step 3: Search for specific hotel using search box
    try {
      const searchInput = await page.waitForSelector(
        'input[placeholder*="Search"], input[type="search"], [class*="search"] input',
        { timeout: 8000 }
      );
      if (searchInput) {
        await searchInput.click({ count: 3 });
        await searchInput.type(hotelName, { delay: 100 });
        await new Promise((r) => setTimeout(r, 3000));
        await page.keyboard.press("Enter");
        await new Promise((r) => setTimeout(r, 5000));
      }
    } catch {
      console.log("   → Search box not found, using page as-is");
    }

    await page.screenshot({ path: "goibibo-debug.png" });
    console.log("   📸 Screenshot saved: goibibo-debug.png");

    const price = await page.evaluate(() => {
      // Find ₹ price patterns
      const allText = document.body.innerText;
      const matches = allText.match(/₹[\s]?[\d,]+/g);
      if (matches) {
        for (const match of matches) {
          const num = parseInt(match.replace(/[^0-9]/g, ""));
          if (num > 1000 && num < 500000) return num;
        }
      }

      const selectors = [
        '[class*="HotelPrice"]',
        '[class*="hotelPrice"]',
        '[class*="price"]',
        '[class*="Price"]',
        '[class*="fare"]',
        '[class*="amount"]',
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
      console.log("   ⚠️  Could not extract Goibibo price — check goibibo-debug.png");
      return null;
    }

    console.log(`   ✅ Goibibo: ₹${price.toLocaleString("en-IN")}/night`);
    return {
      platform: "Goibibo",
      pricePerNight: price,
      totalPrice: price * NIGHTS,
      nights: NIGHTS,
      bookingUrl,
      isLowestPrice: false,
    };
  } catch (err) {
    await browser.close();
    console.log("   ⚠️  Goibibo failed:", (err as Error).message);
    return null;
  }
}