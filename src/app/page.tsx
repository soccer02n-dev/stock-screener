"use client";

import useSWR from "swr";
import type { ScreenerResponse } from "@/lib/types";
import Header from "@/components/Header";
import StockList from "@/components/StockList";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useFilterStore } from "@/store/filterStore";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function Home() {
  const { minRoe } = useFilterStore();
  const { data, error, isLoading, mutate } = useSWR<ScreenerResponse>(
    `/api/screen?minRoe=${minRoe}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-4">
        {/* Info bar */}
        <div className="mb-4 flex items-center justify-between rounded-lg bg-blue-50 px-4 py-2.5 dark:bg-blue-950/30">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            条件: 52週新高値 + ROE &ge; {minRoe}%
          </p>
          <button
            onClick={() => mutate()}
            disabled={isLoading}
            className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            更新
          </button>
        </div>

        {/* Status */}
        {data && !isLoading && (
          <div className="mb-4 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>
              スクリーニング: {data.totalScreened}銘柄中 {data.totalPassed}
              銘柄が該当
            </span>
            <span>
              更新:{" "}
              {new Date(data.lastUpdated).toLocaleString("ja-JP", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        )}

        {/* Content */}
        {isLoading && <LoadingSpinner />}
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-center text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
            データの取得に失敗しました。しばらくしてから再度お試しください。
          </div>
        )}
        {data && data.results && data.results.length > 0 && (
          <StockList stocks={data.results} />
        )}
        {data && data.results && data.results.length === 0 && !isLoading && (
          <div className="py-20 text-center text-sm text-zinc-500 dark:text-zinc-400">
            条件に一致する銘柄が見つかりませんでした。
          </div>
        )}
      </main>
    </div>
  );
}
