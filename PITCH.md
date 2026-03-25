# SEARCHSQUATCH

### The Internet's Only Cryptid-Powered Search Engine

---

**What if search had a personality? What if that personality was an 8-foot-tall, suit-wearing Sasquatch who's been alive for 400 years and just discovered the internet?**

SearchSquatch is a cinematic, character-driven search engine where a fully voiced and animated Sasquatch reacts to your search query, reads every headline out loud, roasts the results, and lets you browse — all in real-time. You can also talk to him directly through a live AI avatar.

In the future, every business, brand, and celebrity will interact with consumers and fans in this format. SearchSquatch is the proof of concept.

---

## THE EXPERIENCE

You type a query. A loading screen boots up on a retro CRT monitor — the forest mainframe is warming up.

**CUT TO:** Sasquatch. Sitting at his desk. Suit. Tie. Keyboard under those massive paws. He reacts to what you searched.

**CUT BACK:** The CRT. Results start appearing. Real results. Live data. Actual links.

Then Sasquatch starts talking. Claude generates a custom reaction to your specific query. ElevenLabs renders it in a deep, gravelly, custom-cloned Sasquatch voice. Movie-style captions scroll across the bottom.

He reads every headline. He drops a one-liner roast. He's done. You browse.

**CUT TO:** Sasquatch again. He's got opinions about what you just found.

**CUT BACK:** Results on the CRT. Click anything. Paginate. Search again. He's ready when you are.

Want to talk to him directly? Click "Start a Conversation" — a live D-ID avatar responds in real-time with lip sync and voice.

---

## THE TECH

This is a **real-time AI pipeline** stitching together six cutting-edge APIs in a single cinematic experience:

| Layer | Tech | What It Does |
|-------|------|-------------|
| **Search** | Firecrawl API | Live web search — real results, real links. Up to 40 results cached across 10 pages. |
| **Brain** | Claude API (Anthropic) | Generates Sasquatch's custom roast for each search query. Every reaction is unique and specific to the headlines. |
| **Personality** | ElevenLabs Agents | Conversational AI via WebSocket generates the headline reading script with Sasquatch's personality baked in. |
| **Voice** | ElevenLabs TTS | Custom cloned Sasquatch voice renders every script in real-time. Deep, grumbly, full of character. |
| **Atmosphere** | ElevenLabs Sound Effects | AI-generated ambient office sounds and typing effects for the cinematic atmosphere. |
| **Avatar** | D-ID | Live conversational AI avatar with lip sync — talk to Sasquatch directly, ask him anything. Connected to Firecrawl as a tool. |
| **Frontend** | Next.js 14 + Netlify | Cinematic UI with video transitions, timed result reveals, movie captions, audio controls, CRT terminal display. |

The whole pipeline fires in parallel. Search, AI reaction, voice synthesis, and avatar all kick off simultaneously behind the loading screen. By the time you see results, everything is ready. It feels like a show because it IS a show.

---

## THE CHARACTER

Sasquatch speaks in third person. He relates everything to forest life. He's opinionated, grumpy, lovable, and family-friendly (hardened content filter with unicode normalization, leetspeak detection, and phrase matching).

Every search is different. Every reaction is generated live by Claude and ElevenLabs. You'll never get the same Sasquatch twice.

---

## THE DESIGN

- **Idle screen:** D-ID Sasquatch avatar — live, animated, ready to talk. Search bar floating over the scene.
- **CRT screen:** Retro green phosphor monitor. Black text on glowing green. Terminal-style results.
- **Cutback clips:** Cinematic cuts to Sasquatch at his desk between search phases.
- **Transitions:** Hard cuts, no fades. Loading screen, typing clip, search results, avatar reactions — all timed and sequenced.
- **Responsive.** Works on desktop and mobile.

---

## THE SECURITY

- Rate limited across all endpoints (generous but protected)
- Content filter on all user input and TTS output
- API keys in environment variables, never in source code
- CORS restricted on agent endpoints
- Full security headers (XSS, clickjacking, MIME sniffing protection)
- Input length caps, result sanitization

---

## THE VISION

SearchSquatch isn't just a search engine. It's a **character-driven, AI-powered interactive format** that transforms how people consume information.

Every brand wants engagement. Every celebrity wants a deeper connection with fans. Every business wants their customers to actually enjoy the experience. This is the format that delivers it — a personality-first, voice-powered, cinematic interaction built on ElevenLabs, Firecrawl, D-ID, and Claude.

SearchSquatch is the first. It won't be the last.

---

**Live demo:** [searchsquatch.netlify.app](https://searchsquatch.netlify.app)

**Built by** [Conductor Labs](https://conductorailabs.com) — From Problem to Prototype.
