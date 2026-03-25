import { NextRequest, NextResponse } from "next/server";

const DID_API_KEY = process.env.DID_API_KEY || "";
const AVATAR_SOURCE = "https://create-images-results.d-id.com/google-oauth2%7C103456792261608127017/upl_dYq93SXZpcIndedR93aWq/image.png";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string" || text.length > 500) {
      return NextResponse.json({ error: "Invalid text" }, { status: 400 });
    }
    if (!DID_API_KEY) return NextResponse.json({ error: "Not configured" }, { status: 500 });

    // Create talk with D-ID's default TTS (lip sync is what matters)
    console.log("[DID-TALK] Creating talk...");
    const createRes = await fetch("https://api.d-id.com/talks", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${DID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source_url: AVATAR_SOURCE,
        script: {
          type: "text",
          input: text,
        },
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      console.error("[DID-TALK] Create failed:", createRes.status, err);
      return NextResponse.json({ error: "D-ID failed" }, { status: 502 });
    }

    const { id } = await createRes.json();
    console.log("[DID-TALK] Created:", id);

    // Poll until done
    for (let i = 0; i < 25; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const pollRes = await fetch(`https://api.d-id.com/talks/${id}`, {
        headers: { "Authorization": `Basic ${DID_API_KEY}` },
      });
      if (!pollRes.ok) continue;
      const data = await pollRes.json();
      if (data.status === "done" && data.result_url) {
        console.log("[DID-TALK] Done:", data.result_url);
        return NextResponse.json({ video_url: data.result_url });
      }
      if (data.status === "error") {
        console.error("[DID-TALK] Gen error:", JSON.stringify(data));
        return NextResponse.json({ error: "Generation failed" }, { status: 502 });
      }
    }

    return NextResponse.json({ error: "Timeout" }, { status: 504 });
  } catch (err) {
    console.error("[DID-TALK] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
