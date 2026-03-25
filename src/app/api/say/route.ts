import { NextRequest, NextResponse } from "next/server";
import { isQuerySafe } from "@/lib/content-filter";
import { rateLimit } from "@/lib/rate-limit";

const VOICE_ID = "geRJ8HegoRjaLG1XLdkH";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = rateLimit(ip, "say-1m", 10, 60_000);
    if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

    const { text } = await req.json();
    if (!text || typeof text !== "string" || text.length > 300)
      return NextResponse.json({ error: "Invalid" }, { status: 400 });
    if (!isQuerySafe(text))
      return NextResponse.json({ error: "Blocked" }, { status: 400 });

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Not configured" }, { status: 500 });

    const ttsRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "xi-api-key": apiKey },
        body: JSON.stringify({
          text,
          model_id: "eleven_flash_v2",
          voice_settings: { stability: 0.5, similarity_boost: 0.7, style: 0.4, use_speaker_boost: false },
        }),
      }
    );

    if (!ttsRes.ok) return NextResponse.json({ error: "TTS failed" }, { status: 502 });
    const buf = await ttsRes.arrayBuffer();
    return new NextResponse(buf, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-cache" } });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
