"use client";

import { use } from "react";
import Link from "next/link";

export default function StockDetailPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = use(params);
  const decodedSymbol = decodeURIComponent(symbol);

  const chartUrl = `https://www.tradingview.com/widgetembed/?frameElementId=tv_chart&symbol=${encodeURIComponent(decodedSymbol)}&interval=D&hidesidetoolbar=0&symboledit=0&saveimage=0&toolbarbg=f1f3f6&theme=light&style=1&timezone=Asia%2FTokyo&locale=ja&utm_source=localhost&utm_medium=widget_new&utm_campaign=chart`;

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
          <Link
            href="/"
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {decodedSymbol}
          </h1>
        </div>
      </header>

      {/* Chart */}
      <div className="flex-1" style={{ minHeight: "calc(100vh - 57px)" }}>
        <iframe
          id="tv_chart"
          src={chartUrl}
          className="h-full w-full border-0"
          style={{ minHeight: "calc(100vh - 57px)" }}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          loading="lazy"
          allowFullScreen
        />
      </div>
    </div>
  );
}
