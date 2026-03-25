import { NextRequest, NextResponse } from "next/server";
import { isQuerySafe } from "@/lib/content-filter";
import { rateLimit } from "@/lib/rate-limit";

const VOICE_ID = "geRJ8HegoRjaLG1XLdkH";

type SearchResult = { url: string; title: string; description: string };

// Varied intros
const INTROS = [
  "Alright, let Sasquatch read these for ya.",
  "Okay here's what the internet coughed up.",
  "Buckle up, here come the results.",
  "Sasquatch found some stuff. Let's dig in.",
  "The forest mainframe has spoken. Here we go.",
  "Results are in. Sasquatch is about to educate you.",
];

// Varied connectors — picks random ones each time
const CONNECTOR_SETS = [
  ["First up", "Next we got", "Then there's", "And last but not least"],
  ["Kicking it off with", "Moving on to", "Oh and check this out", "And wrapping up with"],
  ["Number one", "After that", "Then we got", "And finally"],
  ["Starting strong with", "Following that", "Ooh and then", "And to close it out"],
  ["Right off the bat", "Then boom", "Also found", "And the last one"],
];

// Query-aware outros that actually roast the results
const OUTROS = [
  (q: string, h: string) => `So yeah, the internet's take on ${q} starts with "${h}". Sasquatch has been in the woods for four centuries and even HE knows that's a bold first result.`,
  (q: string, _h: string, h2: string) => `If Sasquatch had to pick a favorite, "${h2}" is the one. But honestly, searching for ${q} on the regular internet is like asking a raccoon for directions. You'll get there eventually.`,
  (q: string) => `And that's the internet on ${q}. You know what's wild? Sasquatch remembers when you had to actually WALK somewhere to learn things. Now you just yell at a hairy guy behind a desk. Progress.`,
  (q: string, h: string) => `"${h}" — the internet really said that with its whole chest. Sasquatch typed ${q} with these big paws and this is what came back. I'm not mad, I'm just disappointed.`,
  (q: string) => `There you go. Everything humans have written about ${q}, served up by a cryptid in a necktie. The other search engines could NEVER.`,
  (q: string, h: string) => `${q} results are in and "${h}" is leading the charge. Four hundred years of forest wisdom and Sasquatch still can't predict what the internet will say. That's the beauty of it.`,
  (q: string) => `And that's a wrap on ${q}. Sasquatch's professional opinion? Half of these are actually useful, the other half are just vibes. Click at your own risk.`,
  (q: string, _h: string, _h2: string, h3: string) => `Real talk though, "${h3}" caught Sasquatch's eye. When you search for ${q} you expect the usual stuff but sometimes the internet surprises even an ancient forest creature.`,
  (q: string) => `So there's your ${q} results fresh off the forest server. No cookies tracked, no ads served, just pure cryptid-powered search. You're welcome.`,
  (q: string, h: string) => `"${h}" — see that right there? That's why Sasquatch does this job. Somebody types ${q} and the internet delivers exactly what you'd expect and also somehow not at all what you'd expect. Beautiful.`,
];

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl1 = rateLimit(ip, "speak-1m", 5, 60_000);
    const rl5 = rateLimit(ip, "speak-5m", 12, 300_000);
    if (!rl1.ok || !rl5.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

    const { query, results } = await req.json();
    if (!query || typeof query !== "string" || query.length > 500)
      return NextResponse.json({ error: "Invalid query" }, { status: 400 });
    if (!isQuerySafe(query))
      return NextResponse.json({ error: "BAD SEARCH TERMS", blocked: true }, { status: 400 });
    if (!results || !Array.isArray(results) || results.length === 0)
      return NextResponse.json({ error: "No results" }, { status: 400 });

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Not configured" }, { status: 500 });

    const headlines = results.slice(0, 4).map((r: SearchResult) => r.title);

    // Use Claude to generate a unique Sasquatch script
    let script = "";
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
            max_tokens: 400,
            messages: [{
              role: "user",
              content: `You are Sasquatch — an 8-foot-tall bigfoot in a suit and tie who works as a search engine. You speak in third person sometimes, you're funny and grumpy but lovable, and you relate everything to forest life. You've been alive for 400 years.

A user searched for "${query}". Here are the top results:
${headlines.map((h: string, i: number) => `${i + 1}. "${h}"`).join("\n")}

Write a script where you:
1. Say a quick intro like "alright let Sasquatch read these" (vary it every time)
2. Read EVERY headline with fun connectors between them (like "next up", "oh and check this", etc)
3. End with a unique, funny roast/opinion about the results and the search topic. Make it specific to what the headlines say. Be creative and different every time.

RULES:
- NEVER say the word "Google" or any other search engine name
- Keep it under 500 characters
- Be funny and opinionated
- Output ONLY the script text, nothing else`
            }],
          }),
        });
        if (claudeRes.ok) {
          const claudeData = await claudeRes.json();
          script = claudeData.content?.[0]?.text || "";
        }
      } catch (e) {
        console.error("[SPEAK] Claude error:", e);
      }
    }

    // Fallback to templates if Claude fails
    if (!script) {
      const intro = INTROS[Math.floor(Math.random() * INTROS.length)];
      const connectors = CONNECTOR_SETS[Math.floor(Math.random() * CONNECTOR_SETS.length)];
      const parts = headlines.map((h: string, i: number) => `${connectors[i] || "Also"}, "${h}".`);
      const outroFn = OUTROS[Math.floor(Math.random() * OUTROS.length)];
      const outro = outroFn(query, headlines[0] || "", headlines[1] || "", headlines[2] || "");
      script = `${intro} ${parts.join(" ")} ${outro}`;
    }

    console.log("[SPEAK] Script:", script.substring(0, 120));

    const ttsRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "xi-api-key": apiKey },
        body: JSON.stringify({
          text: script,
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
        "X-Reaction-Text": encodeURIComponent(script),
      },
    });
  } catch (err) {
    console.error("[SPEAK] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
