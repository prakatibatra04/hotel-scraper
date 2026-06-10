import { SearchConfig } from "./types";

export const SEARCH_CONFIG: SearchConfig = {
  city: "Mumbai",
  checkIn: "2026-07-10",    // ← changed 2025 to 2026
  checkOut: "2026-07-15",   // ← changed 2025 to 2026
  adults: 2,
  infantAge: 1,
  currency: "INR",
  starRating: 5,
};

export const NIGHTS =
  (new Date(SEARCH_CONFIG.checkOut).getTime() -
    new Date(SEARCH_CONFIG.checkIn).getTime()) /
  (1000 * 60 * 60 * 24);

export const SERPAPI_BASE = "https://serpapi.com/search.json";