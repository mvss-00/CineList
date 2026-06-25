import { NextRequest, NextResponse } from "next/server";
import { searchMulti } from "@/lib/tmdb";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const page = parseInt(searchParams.get("page") || "1");

  if (!q) return NextResponse.json({ results: [], total_pages: 0 });

  try {
    const data = await searchMulti(q, page);
    return NextResponse.json(data);
  } catch (err) {
    console.error("TMDB search error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
