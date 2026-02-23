import type { ScreenerResult } from "./types";
import { SP500_CONSTITUENTS } from "./sp500";
import { fetchYahooChart, type YahooChartData } from "./fmp";

/**
 * 52週新高値を検出する
 * yearHigh（日中高値含む52週高値）の95%以上なら新高値圏とみなす
 * これにより週末や小幅調整後でも該当銘柄を逃さない
 */
function isAtNewHigh(chart: YahooChartData): boolean {
  if (chart.closes.length < 10) return false;
  return chart.price >= chart.yearHigh * 0.95;
}

/**
 * 1ヶ月リターン（%）を計算
 */
function calculateMomentum1M(closes: number[]): number {
  if (closes.length < 20) return 0;
  const latest = closes[closes.length - 1];
  const oneMonthAgo = closes[closes.length - 21];
  if (!oneMonthAgo || oneMonthAgo === 0) return 0;
  return ((latest - oneMonthAgo) / oneMonthAgo) * 100;
}

/**
 * 相対出来高を計算（直近出来高 / 30日平均出来高）
 */
function calculateRelativeVolume(volumes: number[]): number {
  if (volumes.length < 30) return 1;
  const latest = volumes[volumes.length - 1];
  const avg30 = volumes.slice(-30).reduce((sum, v) => sum + v, 0) / 30;
  if (avg30 === 0) return 1;
  return latest / avg30;
}

/**
 * パーセンタイルランクを計算（0〜100）
 */
function percentileRank(values: number[], value: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const idx = sorted.findIndex((v) => v >= value);
  if (idx === -1) return 100;
  return (idx / sorted.length) * 100;
}

/**
 * メインスクリーニング処理
 *
 * 価格データ: Yahoo Finance（APIキー不要）
 * ROEデータ: sp500.tsにプリコンピュート済み
 */
export async function runScreener(minRoe: number = 10): Promise<{
  results: ScreenerResult[];
  totalScreened: number;
  totalPassed: number;
}> {
  const totalScreened = SP500_CONSTITUENTS.length;

  // 銘柄情報マップ（ROE含む）
  const infoMap = new Map(
    SP500_CONSTITUENTS.map((c) => [c.symbol, c])
  );

  // Step 1: ROEフィルタ（事前にフィルタしてYahoo APIコールを節約）
  const roePassedSymbols = SP500_CONSTITUENTS.filter(
    (c) => c.roe !== null && c.roe >= minRoe
  ).map((c) => c.symbol);

  console.log(
    `[Screener] ROE >= ${minRoe}%: ${roePassedSymbols.length} / ${totalScreened}`
  );

  // Step 2: ROE通過銘柄のみYahoo Financeから価格データ取得
  const chartMap = new Map<string, YahooChartData>();
  const batchSize = 10;

  for (let i = 0; i < roePassedSymbols.length; i += batchSize) {
    const batch = roePassedSymbols.slice(i, i + batchSize);
    const promises = batch.map(async (symbol) => {
      const chart = await fetchYahooChart(symbol);
      if (chart) chartMap.set(symbol, chart);
    });
    await Promise.all(promises);
  }

  console.log(
    `[Screener] Charts fetched: ${chartMap.size} / ${roePassedSymbols.length}`
  );

  // Step 3: 52週新高値フィルタ
  const passedStocks: {
    symbol: string;
    roe: number;
    momentum1M: number;
    relativeVolume: number;
    chart: YahooChartData;
  }[] = [];

  for (const [symbol, chart] of chartMap) {
    if (!isAtNewHigh(chart)) continue;

    const info = infoMap.get(symbol)!;
    const momentum1M = calculateMomentum1M(chart.closes);
    const relativeVolume = calculateRelativeVolume(chart.volumes);

    passedStocks.push({
      symbol,
      roe: info.roe!,
      momentum1M,
      relativeVolume,
      chart,
    });
  }

  console.log(`[Screener] New high + ROE passed: ${passedStocks.length}`);

  if (passedStocks.length === 0) {
    return { results: [], totalScreened, totalPassed: 0 };
  }

  // Step 4: 複合スコア計算
  const momentumValues = passedStocks.map((s) => s.momentum1M);
  const roeValues = passedStocks.map((s) => s.roe);
  const relVolValues = passedStocks.map((s) => s.relativeVolume);

  const scoredStocks = passedStocks.map((stock) => {
    const momentumRank = percentileRank(momentumValues, stock.momentum1M);
    const roeRank = percentileRank(roeValues, stock.roe);
    const relVolRank = percentileRank(relVolValues, stock.relativeVolume);

    const compositeScore =
      momentumRank * 0.4 + roeRank * 0.3 + relVolRank * 0.3;

    return { ...stock, compositeScore };
  });

  // スコア降順ソート
  scoredStocks.sort((a, b) => b.compositeScore - a.compositeScore);

  // Step 5: 結果を整形
  const avgVolume30 = (volumes: number[]) =>
    volumes.length >= 30
      ? volumes.slice(-30).reduce((s, v) => s + v, 0) / 30
      : volumes.reduce((s, v) => s + v, 0) / (volumes.length || 1);

  const results: ScreenerResult[] = scoredStocks.map((stock, index) => {
    const info = infoMap.get(stock.symbol)!;
    return {
      rank: index + 1,
      symbol: stock.symbol,
      companyName: info.name,
      sector: info.sector,
      price: stock.chart.price,
      yearHigh: stock.chart.yearHigh,
      yearLow: stock.chart.yearLow,
      roe: Math.round(stock.roe * 10) / 10,
      momentum1M: Math.round(stock.momentum1M * 10) / 10,
      relativeVolume: Math.round(stock.relativeVolume * 100) / 100,
      compositeScore: Math.round(stock.compositeScore * 10) / 10,
      marketCap: 0,
      volume: stock.chart.volume,
      avgVolume: Math.round(avgVolume30(stock.chart.volumes)),
    };
  });

  return { results, totalScreened, totalPassed: results.length };
}
