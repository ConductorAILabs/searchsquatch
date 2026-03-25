import { NextRequest, NextResponse } from "next/server";
import { isQuerySafe } from "@/lib/content-filter";
import { rateLimit } from "@/lib/rate-limit";

const VOICE_ID = "geRJ8HegoRjaLG1XLdkH";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = rateLimit(ip, "react-1m", 10, 60_000);
    if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

    const { query } = await req.json();
    if (!query || typeof query !== "string" || query.length > 500)
      return NextResponse.json({ error: "Invalid query" }, { status: 400 });
    if (!isQuerySafe(query))
      return NextResponse.json({ error: "BAD SEARCH TERMS", blocked: true }, { status: 400 });

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Not configured" }, { status: 500 });

    // Use Claude to generate a unique reaction
    let reaction = `${query}? Alright, Sasquatch is on it.`;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicKey) {
      try {
        const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": anthropicKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 150,
            messages: [{
              role: "user",
              content: `You are Sasquatch — an 8-foot-tall bigfoot in a suit who works as a search engine. Funny, grumpy, lovable. Relates everything to forest life. 400 years old.

Someone just searched for "${query}". Give a quick, unique, funny reaction to this search term and say you're about to look it up. Be specific to the topic — reference what "${query}" actually is and make a joke about it.

RULES:
- NEVER say "Google" or any search engine name
- Keep it under 120 characters
- Be different every time
- Output ONLY the reaction, nothing else`
            }],
          }),
        });
        if (claudeRes.ok) {
          const data = await claudeRes.json();
          reaction = data.content?.[0]?.text || reaction;
        }
      } catch (e) {
        console.error("[REACT] Claude error:", e);
      }
    }

    const ttsRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "xi-api-key": apiKey },
        body: JSON.stringify({
          text: reaction,
          model_id: "eleven_flash_v2",
          voice_settings: { stability: 0.5, similarity_boost: 0.7, style: 0.4, use_speaker_boost: false },
        }),
      }
    );

    if (!ttsRes.ok) return NextResponse.json({ error: "Voice failed" }, { status: 502 });
    const audioBuffer = await ttsRes.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-cache",
        "X-Reaction-Text": encodeURIComponent(reaction),
      },
    });
  } catch (err) {
    console.error("[REACT] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
