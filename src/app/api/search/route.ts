import { NextRequest, NextResponse } from "next/server";
import { isQuerySafe } from "@/lib/content-filter";
import { rateLimit } from "@/lib/rate-limit";
import { logSearch } from "@/lib/analytics";

const MAX_QUERY_LENGTH = 200;

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 3 per minute AND 8 per 5 minutes
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl1 = rateLimit(ip, "search-1m", 3, 60_000);
    const rl5 = rateLimit(ip, "search-5m", 8, 300_000);
    if (!rl1.ok || !rl5.ok) {
      return NextResponse.json(
        { error: "Too many requests. Try again shortly." },
        { status: 429 }
      );
    }

    const { query } = await req.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    if (query.length > MAX_QUERY_LENGTH) {
      return NextResponse.json(
        { error: "Query too long" },
        { status: 400 }
      );
    }

    if (!isQuerySafe(query)) {
      logSearch({ query: "[BLOCKED]", resultCount: 0, timestamp: new Date().toISOString(), ip, blocked: true }).catch(() => {});
      return NextResponse.json(
        { error: "ERROR: BAD SEARCH TERMS.", blocked: true },
        { status: 400 }
      );
    }

    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Service unavailable" },
        { status: 500 }
      );
    }

    const res = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query,
        limit: 40,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Firecrawl error:", res.status, errorText);
      return NextResponse.json(
        { error: "Search failed" },
        { status: 502 }
      );
    }

    const data = await res.json();

    const results = (data.data || []).map(
      (item: { url?: string; title?: string; description?: string }) => ({
        url: item.url && /^https?:\/\//i.test(item.url) ? item.url : "",
        title: item.title || "Untitled",
        description: item.description || "",
      })
    );

    logSearch({ query, resultCount: results.length, timestamp: new Date().toISOString(), ip, blocked: false }).catch(() => {});
    return NextResponse.json({ results });
  } catch (err) {
    console.error("Search route error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
