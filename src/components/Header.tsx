"use client";

export default function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">&#x1F4C8;</span>
          <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            新高値スクリーナー
          </h1>
        </div>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          S&P 500
        </span>
      </div>
    </header>
  );
}
