"use client";

import { use, useEffect, useRef } from "react";
import Link from "next/link";

export default function StockDetailPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = use(params);
  const decodedSymbol = decodeURIComponent(symbol);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous widget
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if (!containerRef.current) return;
      new (window as unknown as { TradingView: { widget: new (config: Record<string, unknown>) => unknown } }).TradingView.widget({
        symbol: decodedSymbol,
        container_id: "tv-chart",
        autosize: true,
        interval: "D",
        timezone: "Asia/Tokyo",
        theme: "light",
        style: "1",
        locale: "ja",
        toolbar_bg: "#f1f3f6",
        enable_publishing: false,
        hide_top_toolbar: false,
        hide_legend: false,
        save_image: false,
        allow_symbol_change: false,
      });
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup script on unmount
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [decodedSymbol]);

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
      <div
        ref={containerRef}
        id="tv-chart"
        className="flex-1"
        style={{ minHeight: "calc(100vh - 57px)" }}
      />
    </div>
  );
}
