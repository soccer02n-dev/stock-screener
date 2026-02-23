// Yahoo Finance API client (no API key required)

const YAHOO_BASE_URL = "https://query2.finance.yahoo.com";

export interface YahooChartData {
  symbol: string;
  price: number;
  yearHigh: number;
  yearLow: number;
  volume: number;
  name: string;
  closes: number[];
  volumes: number[];
}

export async function fetchYahooChart(
  symbol: string
): Promise<YahooChartData | null> {
  try {
    const url = `${YAHOO_BASE_URL}/v8/finance/chart/${encodeURIComponent(symbol)}?range=1y&interval=1d`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 86400 },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const result = data.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    const quotes = result.indicators?.quote?.[0];
    if (!quotes) return null;

    const closes = (quotes.close as (number | null)[]).filter(
      (v): v is number => v !== null
    );
    const vols = (quotes.volume as (number | null)[]).filter(
      (v): v is number => v !== null
    );

    return {
      symbol: meta.symbol,
      price: meta.regularMarketPrice,
      yearHigh: meta.fiftyTwoWeekHigh,
      yearLow: meta.fiftyTwoWeekLow,
      volume: meta.regularMarketVolume,
      name: meta.longName || meta.shortName || symbol,
      closes,
      volumes: vols,
    };
  } catch {
    return null;
  }
}
