# SEARCHSQUATCH

### The World's First Cryptid-Powered Search Engine

---

**What if Google had a personality? What if that personality was a 7-foot-tall, forest-dwelling Sasquatch who just discovered the internet?**

SearchSquatch is a live, real-time search engine where a fully animated Sasquatch character reads your search results out loud — and gives you his unfiltered, hilarious opinion on every headline.

---

## THE EXPERIENCE

You type a query. The words appear letter-by-letter on a glowing green CRT monitor — like a retro computer terminal straight out of 1983. The screen holds. Dramatic pause.

**CUT TO:** Sasquatch. Sitting at his desk. Surrounded by vintage computers in his forest bunker. He's been waiting for this.

**CUT BACK:** The CRT. Results start appearing. Real results. Live data. Actual links you can click.

Then the magic happens.

**Sasquatch starts talking.**

In a deep, gravelly, crunchy voice, he reads every headline out loud — then drops his take. His opinion. From the perspective of a creature who's lived in the woods for 400 years and just figured out what WiFi is.

Movie-style captions scroll across the bottom. You're watching a Sasquatch react to the internet in real time.

When he's done? The CRT stays live. Click any result. Browse pages. Search again. He's ready when you are.

---

## THE TECH

This isn't a gimmick with canned responses. This is a **real-time AI pipeline** stitching together four cutting-edge APIs in a single seamless experience:

| Layer | Tech | What It Does |
|-------|------|-------------|
| **Search** | Firecrawl API | Live web search — real results, real links, real data. Up to 40 results cached across 10 pages. |
| **Brain** | Claude API (Anthropic) | Generates Sasquatch's contextual commentary. He actually understands the headlines. Every reaction is unique, funny, and relevant. |
| **Voice** | ElevenLabs TTS | Converts Sasquatch's script into deep, gravelly speech using a tuned "Husky Trickster" voice model with maxed-out expressiveness. |
| **Frontend** | Next.js 14 + React | Cinematic UI with typewriter effects, video switching, timed result reveals synced to audio, movie captions, pagination, mute controls. |

The whole pipeline — search, AI reaction, voice synthesis — fires in parallel behind a fake loading screen. By the time the progress bar hits 100%, everything is ready. Results reveal one by one, timed to his narration. It feels like a show because it IS a show.

---

## THE CHARACTER

Sasquatch speaks in third person. He relates everything back to forest life. He's opinionated. He's lovable. He's family-friendly (we built a hardened content filter with unicode normalization, leetspeak detection, and phrase matching — this guy stays clean).

> *"Let's see what we got here... 'NASA Discovers New Exoplanet in Habitable Zone.' Sasquatch been saying there's other forests out there for years. Nobody listens to Sasquatch."*

> *"'Apple Announces New MacBook Pro.' Sasquatch prefer real apples. But Sasquatch respects the hustle."*

Every search is different. Every reaction is generated live by Claude. You'll never get the same Sasquatch twice.

---

## THE DESIGN

- **Idle screen:** Sasquatch at his desk, waiting. A clean, minimal search bar floats over the scene. No clutter. Just vibes.
- **CRT screen:** A close-up of a retro green phosphor monitor. Black text on glowing green. The "SearchSquatch" logo in pixel font. Results right-aligned like a terminal.
- **Transitions:** Cinematic cuts between Sasquatch and his monitor. Typewriter effects. Timed reveals. Movie captions. Audio activity bars.
- **Built for mobile.** Responsive down to 480px. Works everywhere Sasquatch gets signal.

---

## THE SECURITY

Yeah, we locked it down. This Sasquatch doesn't mess around:

- Rate limited: 3 searches/minute, 8 per 5 minutes
- Hardened content filter with unicode/leetspeak/spacing bypass protection
- Prompt injection defense on all AI inputs
- Input length caps, result sanitization, zero error detail leakage
- Full security headers (XSS, clickjacking, MIME sniffing protection)

---

## THE PITCH

SearchSquatch isn't just a search engine. It's a **character-driven, AI-powered entertainment experience** disguised as a utility.

It's the answer to the question nobody asked: *"What if search results were fun?"*

It's a tech demo that makes people laugh. A hackathon project that makes people lean in. A proof of concept that four APIs, one cryptid, and a green CRT monitor can create something genuinely delightful.

**SearchSquatch. He searches. He reads. He reacts.**

*And he accepts payment in berries and fish.*
