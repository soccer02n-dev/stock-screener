import { NextResponse } from "next/server";
import { runScreener } from "@/lib/screener";
import type { ScreenerResponse } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const minRoe = Number(searchParams.get("minRoe") ?? "10");

    const { results, totalScreened, totalPassed } = await runScreener(minRoe);

    const response: ScreenerResponse = {
      results,
      lastUpdated: new Date().toISOString(),
      totalScreened,
      totalPassed,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Screener error:", error);
    return NextResponse.json(
      { error: "スクリーニング処理中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
