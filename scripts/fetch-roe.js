// S&P 500全銘柄のROEをYahoo Financeから取得してsp500.tsを更新するスクリプト
const fs = require("fs");
const path = require("path");
const https = require("https");

const SP500_FILE = path.join(__dirname, "..", "src", "lib", "sp500.ts");
const PROGRESS_FILE = path.join(__dirname, "roe-progress.json");

function httpsGet(url, headers = {}, cookieJar = "") {
  return new Promise((resolve, reject) => {
    const opts = new URL(url);
    const reqHeaders = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      ...headers,
    };
    if (cookieJar) reqHeaders["Cookie"] = cookieJar;

    https
      .get(
        { hostname: opts.hostname, path: opts.pathname + opts.search, headers: reqHeaders },
        (res) => {
          let data = "";
          const cookies = (res.headers["set-cookie"] || [])
            .map((c) => c.split(";")[0])
            .join("; ");
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => resolve({ data, cookies, status: res.statusCode }));
        }
      )
      .on("error", reject);
  });
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function getCrumbAndCookies() {
  const { cookies } = await httpsGet("https://fc.yahoo.com");
  const { data: crumb } = await httpsGet(
    "https://query2.finance.yahoo.com/v1/test/getcrumb",
    {},
    cookies
  );
  return { crumb, cookies };
}

async function fetchROE(symbol, crumb, cookies) {
  try {
    const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=financialData&crumb=${encodeURIComponent(crumb)}`;
    const { data, status } = await httpsGet(url, {}, cookies);

    if (status === 429) return { roe: null, rateLimited: true };

    const json = JSON.parse(data);
    const fd = json.quoteSummary?.result?.[0]?.financialData;
    if (!fd || !fd.returnOnEquity) return { roe: null, rateLimited: false };

    return {
      roe: Math.round(fd.returnOnEquity.raw * 1000) / 10,
      rateLimited: false,
    };
  } catch {
    return { roe: null, rateLimited: false };
  }
}

async function main() {
  console.log("Reading sp500.ts...");
  const content = fs.readFileSync(SP500_FILE, "utf-8");

  // Parse existing entries
  const entries = [];
  const regex =
    /\{\s*symbol:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*sector:\s*"([^"]+)"(?:,\s*roe:\s*([\d.]+|null))?\s*\}/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    entries.push({
      symbol: match[1],
      name: match[2],
      sector: match[3],
      roe: match[4] && match[4] !== "null" ? parseFloat(match[4]) : null,
    });
  }
  console.log(`Found ${entries.length} entries`);

  // Load progress
  let progress = {};
  if (fs.existsSync(PROGRESS_FILE)) {
    progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf-8"));
    console.log(`Loaded progress: ${Object.keys(progress).length} entries`);
  }

  // Get crumb
  console.log("Getting Yahoo Finance crumb...");
  let { crumb, cookies } = await getCrumbAndCookies();
  console.log(`Crumb: ${crumb}`);

  let fetched = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    // Skip if already have ROE
    if (progress[entry.symbol] !== undefined) {
      skipped++;
      continue;
    }

    const { roe, rateLimited } = await fetchROE(entry.symbol, crumb, cookies);

    if (rateLimited) {
      console.log(`Rate limited at ${entry.symbol}. Waiting 10s...`);
      await delay(10000);
      // Refresh crumb
      const fresh = await getCrumbAndCookies();
      crumb = fresh.crumb;
      cookies = fresh.cookies;
      // Retry
      const retry = await fetchROE(entry.symbol, crumb, cookies);
      progress[entry.symbol] = retry.roe;
      if (retry.roe !== null) fetched++;
      else failed++;
    } else {
      progress[entry.symbol] = roe;
      if (roe !== null) fetched++;
      else failed++;
    }

    if ((fetched + failed) % 10 === 0) {
      console.log(
        `Progress: ${fetched + failed + skipped}/${entries.length} (${fetched} ok, ${failed} failed, ${skipped} skipped)`
      );
      // Save progress
      fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
    }

    await delay(200);
  }

  // Save final progress
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));

  // Update entries
  for (const entry of entries) {
    if (progress[entry.symbol] !== undefined) {
      entry.roe = progress[entry.symbol];
    }
  }

  // Write updated sp500.ts
  const lines = entries.map(
    (e) =>
      `  { symbol: "${e.symbol}", name: "${e.name.replace(/"/g, '\\"')}", sector: "${e.sector}", roe: ${e.roe} },`
  );

  const newContent = `export const SP500_CONSTITUENTS: { symbol: string; name: string; sector: string; roe: number | null }[] = [\n${lines.join("\n")}\n];\n`;

  fs.writeFileSync(SP500_FILE, newContent);
  console.log(`\nDone! ${fetched} fetched, ${failed} failed, ${skipped} skipped`);
  console.log(`Updated ${SP500_FILE}`);
}

main().catch(console.error);
