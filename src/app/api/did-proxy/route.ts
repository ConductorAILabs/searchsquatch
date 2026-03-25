import { NextRequest, NextResponse } from "next/server";

// Proxy D-ID agent config request to avoid CORS
export async function GET(req: NextRequest) {
  const agentId = req.nextUrl.searchParams.get("agentId");
  if (!agentId) {
    return NextResponse.json({ error: "Missing agentId" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://api.d-id.com/agents/${agentId}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[DID Proxy] Error:", res.status, text);
      return NextResponse.json({ error: "D-ID API error" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("[DID Proxy] Failed:", err);
    return NextResponse.json({ error: "Proxy error" }, { status: 500 });
  }
}
