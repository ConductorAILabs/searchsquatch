# SearchSquatch

**The internet's only cryptid-powered search engine.**

## What did you build?

SearchSquatch transforms the boring blue-link search experience into an unforgettable character-driven cinematic interaction. A Sasquatch in a suit and tie reacts to your query, reads every headline out loud with commentary, and drops his unfiltered opinion on the results — all in real-time with a custom cloned voice. You can also talk to him directly through a live AI avatar. In the future, every brand, celebrity, and business will interact with their audience in this format — character-driven, voice-powered, personality-first. SearchSquatch is the proof of concept.

**Live demo:** [searchsquatch.netlify.app](https://searchsquatch.netlify.app)

## What problem does it solve?

Search is boring and forgettable. SearchSquatch makes every query an experience people actually want to share.

## How does it use ElevenLabs?

Custom cloned voice via TTS for all reactions and headline reading, ElevenLabs Agents via Conversational AI WebSocket API for contextual commentary generation, and Sound Effects API for the ambient office atmosphere. Every search gets a unique voice performance.

## How does it use Firecrawl?

Firecrawl's Search API powers every query — up to 40 real-time web results that feed both the CRT display and the voice script. A dedicated agent endpoint also lets the D-ID avatar call Firecrawl as a tool for voice-driven search.

## Tech Stack

- **Firecrawl** — Real-time web search
- **ElevenLabs** — Custom cloned voice, TTS, Conversational AI Agents, Sound Effects
- **D-ID** — Live conversational AI avatar
- **Next.js 14** + **Netlify**

## Built by

[Conductor Labs](https://conductorailabs.com) — From Problem to Prototype.
