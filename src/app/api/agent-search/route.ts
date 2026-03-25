import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = rateLimit(ip, "agent-search-1m", 15, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const query = req.nextUrl.searchParams.get("query");
  if (!query || typeof query !== "string" || query.length > 300) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  try {
    const res = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ query, limit: 8 }),
    });

    if (!res.ok) return NextResponse.json({ error: "Search failed" }, { status: 502 });
    const data = await res.json();
    const results = (data.data || []).map(
      (item: { url?: string; title?: string; description?: string }, i: number) => ({
        position: i + 1,
        title: item.title || "Untitled",
        url: item.url && /^https?:\/\//i.test(item.url) ? item.url : "",
        description: (item.description || "").slice(0, 200),
      })
    );

    return NextResponse.json({ query, result_count: results.length, results }, {
      headers: {
        "Access-Control-Allow-Origin": "https://agents.d-id.com",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "https://agents.d-id.com",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
