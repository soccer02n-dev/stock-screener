"use client";

import type { ScreenerResult } from "@/lib/types";

function formatNumber(num: number): string {
  if (num >= 1e12) return `${(num / 1e12).toFixed(1)}T`;
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  return num.toLocaleString();
}

function getScoreColor(score: number): string {
  if (score >= 75) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 50) return "text-blue-600 dark:text-blue-400";
  if (score >= 25) return "text-amber-600 dark:text-amber-400";
  return "text-zinc-600 dark:text-zinc-400";
}

function getScoreBg(score: number): string {
  if (score >= 75) return "bg-emerald-50 dark:bg-emerald-950/30";
  if (score >= 50) return "bg-blue-50 dark:bg-blue-950/30";
  if (score >= 25) return "bg-amber-50 dark:bg-amber-950/30";
  return "bg-zinc-50 dark:bg-zinc-900";
}

export default function StockCard({ stock }: { stock: ScreenerResult }) {
  const momentum1MColor =
    stock.momentum1M >= 0
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-red-600 dark:text-red-400";

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      {/* Top row: rank + symbol + score */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-sm font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {stock.rank}
          </span>
          <div>
            <p className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              {stock.symbol}
            </p>
            <p className="max-w-[180px] truncate text-xs text-zinc-500 dark:text-zinc-400">
              {stock.companyName}
            </p>
          </div>
        </div>
        <div
          className={`rounded-lg px-3 py-1.5 ${getScoreBg(stock.compositeScore)}`}
        >
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
            スコア
          </p>
          <p
            className={`text-lg font-bold leading-tight ${getScoreColor(stock.compositeScore)}`}
          >
            {stock.compositeScore.toFixed(1)}
          </p>
        </div>
      </div>

      {/* Price */}
      <div className="mb-3">
        <span className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          ${stock.price.toFixed(2)}
        </span>
        {stock.marketCap > 0 && (
          <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">
            時価総額 ${formatNumber(stock.marketCap)}
          </span>
        )}
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-3 gap-2">
        <MetricBadge
          label="ROE"
          value={`${stock.roe.toFixed(1)}%`}
          color="text-blue-600 dark:text-blue-400"
        />
        <MetricBadge
          label="1M モメンタム"
          value={`${stock.momentum1M >= 0 ? "+" : ""}${stock.momentum1M.toFixed(1)}%`}
          color={momentum1MColor}
        />
        <MetricBadge
          label="相対出来高"
          value={`${stock.relativeVolume.toFixed(2)}x`}
          color="text-purple-600 dark:text-purple-400"
        />
      </div>

      {/* Sector + 52W range */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500">
        <span>{stock.sector}</span>
        <span>
          52W: ${stock.yearLow.toFixed(0)} - ${stock.yearHigh.toFixed(0)}
        </span>
      </div>
    </div>
  );
}

function MetricBadge({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-lg bg-zinc-50 px-2 py-1.5 dark:bg-zinc-800/50">
      <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className={`text-sm font-semibold ${color}`}>{value}</p>
    </div>
  );
}
