# Hotel Scraper

A TypeScript-based hotel price comparison tool that uses SERP API hotel search results to identify hotel pricing and determine the lowest available listing price for a specified city, date range, and guest configuration.

## Project Overview

This project was developed to compare hotel listing prices for a 5-night stay and identify the lowest available price from search results.

The application:

* Accepts a city, check-in date, check-out date, and guest information.
* Retrieves hotel listing information using SERP API.
* Compares returned hotel prices.
* Identifies the lowest available listing price.
* Displays results in INR.
* Saves results for further analysis.

## Features

* Search hotel prices for any supported city.
* Configurable date range.
* Support for:

  * 2 Adults
  * 1 Infant (Age < 2 years)
* Price comparison across available SERP API results.
* Lowest price identification.
* Results exported to JSON.

## Technology Stack

* TypeScript
* Node.js
* SERP API
* Axios
* dotenv

## Prerequisites

Before running the project, ensure the following are installed:

* Node.js (v18 or later)
* npm

Verify installation:

```bash
node -v
npm -v
```

## Installation

Clone the repository:

```bash
git clone https://github.com/prakatibatra04/hotel-scraper.git
cd hotel-scraper
```

Install dependencies:

```bash
npm install
```

## Getting a SERP API Key

This project requires a SERP API key.

### Step 1: Create a SERP API Account

Visit:

https://serpapi.com/

Create an account and verify your email address.

### Step 2: Obtain Your API Key

After logging in:

1. Open the Dashboard.
2. Locate the API Key section.
3. Copy your API key.

### Step 3: Configure Environment Variables

Create a file named:

```text
.env
```

in the project root directory.

Example:

```env
SERP_API_KEY=YOUR_API_KEY_HERE

CITY=Mumbai
CHECK_IN=2026-07-10
CHECK_OUT=2026-07-15

ADULTS=2
INFANT_AGE=1
CURRENCY=INR
```

Replace:

```text
YOUR_API_KEY_HERE
```

with your actual API key.

## Running the Application

Start the application:

```bash
npm run dev
```

## Build

Compile TypeScript:

```bash
npm run build
```

## Example Configuration

```env
CITY=Mumbai
CHECK_IN=2026-07-10
CHECK_OUT=2026-07-15
ADULTS=2
INFANT_AGE=1
CURRENCY=INR
```

## Output

The application:

1. Queries hotel search results using SERP API.
2. Retrieves hotel listing information.
3. Compares available prices.
4. Identifies the lowest available listing price.
5. Saves results for further analysis.

Example output:

```json
{
  "city": "Mumbai",
  "checkIn": "2026-07-10",
  "checkOut": "2026-07-15",
  "lowestPrice": 12450,
  "currency": "INR"
}
```

## Project Structure

```text
hotel-scraper/
│
├── src/
│   ├── config.ts
│   ├── types.ts
│   ├── index.ts
│   └── utils/
│
├── .env
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Security

The `.env` file should never be committed to GitHub.

Ensure `.gitignore` contains:

```text
node_modules/
dist/
.env
results.json
playwright-report/
test-results/
.DS_Store
*.log
```

If an API key is accidentally exposed, immediately revoke it and generate a new one.

## Notes

* Currency used: INR.
* Hotel information is obtained through SERP API.
* This project does not directly scrape MakeMyTrip, Goibibo, Cleartrip, Booking.com, or Agoda.
* Any references to third-party booking platforms are for manual verification only.
* API usage limits depend on your SERP API plan.

## Author

Prakati Batra

GitHub:
https://github.com/prakatibatra04
