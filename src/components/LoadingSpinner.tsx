"use client";

export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-3 border-zinc-300 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-400" />
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        スクリーニング中...
      </p>
    </div>
  );
}
