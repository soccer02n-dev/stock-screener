"use client";

import type { ScreenerResult } from "@/lib/types";
import { useFilterStore } from "@/store/filterStore";
import StockCard from "./StockCard";

const SORT_OPTIONS = [
  { key: "compositeScore" as const, label: "スコア" },
  { key: "momentum1M" as const, label: "モメンタム" },
  { key: "roe" as const, label: "ROE" },
  { key: "relativeVolume" as const, label: "出来高" },
  { key: "marketCap" as const, label: "時価総額" },
] as const;

export default function StockList({ stocks }: { stocks: ScreenerResult[] }) {
  const { sortBy, sortDesc, setSortBy } = useFilterStore();

  const sorted = [...stocks].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    return sortDesc ? bVal - aVal : aVal - bVal;
  });

  // Re-rank after sorting
  const ranked = sorted.map((s, i) => ({ ...s, rank: i + 1 }));

  return (
    <div>
      {/* Sort controls */}
      <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1">
        <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
          並び替え:
        </span>
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setSortBy(opt.key)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              sortBy === opt.key
                ? "bg-blue-600 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            }`}
          >
            {opt.label}
            {sortBy === opt.key && (sortDesc ? " ↓" : " ↑")}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
        {stocks.length}銘柄が条件に一致
      </p>

      {/* Cards */}
      <div className="flex flex-col gap-3">
        {ranked.map((stock) => (
          <StockCard key={stock.symbol} stock={stock} />
        ))}
      </div>
    </div>
  );
}
