"use client";

import { useState, useRef, useCallback, useEffect } from "react";

type SearchResult = { url: string; title: string; description: string };
type Phase =
  | "idle"
  | "buffering"  // fun loading screen while TTS generates
  | "typing"     // CRT — typing + Sasquatch says the search term
  | "searching"  // CRT — SEARCHING...
  | "avatar-react" // avatar visible — D-ID talking with lip sync
  | "loading"    // CRT — progress bar while speak generates
  | "revealing"  // CRT — results + voice reads headlines
  | "browse";

const VIDEO_SCREEN = "/videos/screen.mp4";
const PER_PAGE = 4;
const REVEAL_INTERVAL = 3500;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function sendDIDMessage(text: string) {
  // Step 1: Find the chatbox icon ANYWHERE on the page and click it
  // D-ID uses classes with "didagent__" prefix — scan all clickable elements
  const everything = document.querySelectorAll("button, [role='button'], div[class*='chat'], div[class*='didagent'], svg, img");
  let clicked = false;

  for (let i = 0; i < everything.length; i++) {
    const el = everything[i] as HTMLElement;
    const cl = el.className?.toString?.()?.toLowerCase() || "";
    const aria = el.getAttribute("aria-label")?.toLowerCase() || "";
    const title = el.getAttribute("title")?.toLowerCase() || "";

    if (cl.includes("didagent") || cl.includes("chat") || cl.includes("toggle") ||
        aria.includes("chat") || aria.includes("open") || aria.includes("message") ||
        title.includes("chat") || title.includes("message")) {
      el.click();
      clicked = true;
      console.log("[DID] Clicked:", el.tagName, cl.substring(0, 60), aria);
      break;
    }
  }

  if (!clicked) {
    // Try clicking anything in top-right area that looks like an icon
    const topRight = document.elementsFromPoint(window.innerWidth - 50, 50);
    for (const el of topRight) {
      if (el.tagName === "BUTTON" || el.tagName === "SVG" || el.getAttribute("role") === "button" ||
          el.className?.toString?.().includes("didagent")) {
        (el as HTMLElement).click();
        clicked = true;
        console.log("[DID] Clicked top-right element:", el.tagName, el.className);
        break;
      }
    }
  }

  if (!clicked) console.log("[DID] Could not find chatbox icon");

  // Step 2: Wait for chat input to appear, then type and send
  const tryFind = (attempt: number) => {
    if (attempt > 10) { console.log("[DID] Gave up finding input after 10 attempts"); return; }

    const inputs = document.querySelectorAll("input, textarea, [contenteditable='true']");
    for (let i = 0; i < inputs.length; i++) {
      const el = inputs[i] as HTMLInputElement;
      const ph = el.placeholder?.toLowerCase() || "";
      const cl = el.className?.toString?.()?.toLowerCase() || "";
      // Skip our search input
      if (cl.includes("search-input")) continue;
      // Any input that's not ours is likely D-ID's
      if (ph || cl.includes("didagent") || cl.includes("chat") || cl.includes("message") || el.type === "text" || el.tagName === "TEXTAREA") {
        console.log("[DID] Found input:", el.tagName, ph, cl.substring(0, 60));
        el.focus();
        // Native setter to trigger React/framework state
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set ||
                       Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
        if (setter) setter.call(el, text); else el.value = text;
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));

        setTimeout(() => {
          // Try Enter key
          const enterEvent = new KeyboardEvent("keydown", { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true, cancelable: true });
          el.dispatchEvent(enterEvent);
          el.dispatchEvent(new KeyboardEvent("keypress", { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true }));
          el.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true }));

          // Also try finding a send button near the input
          const parent = el.closest("form, div, section") || document.body;
          const btns = parent.querySelectorAll("button");
          for (let j = 0; j < btns.length; j++) {
            const b = btns[j] as HTMLElement;
            const bc = b.className?.toString?.()?.toLowerCase() || "";
            const ba = b.getAttribute("aria-label")?.toLowerCase() || "";
            if (bc.includes("send") || ba.includes("send") || b.querySelector("svg")) {
              b.click();
              console.log("[DID] Clicked send:", b.tagName, bc.substring(0, 40));
              break;
            }
          }
          console.log("[DID] Message sent:", text.substring(0, 50));
        }, 200);
        return;
      }
    }
    // Retry
    console.log(`[DID] Input not found yet, retry ${attempt + 1}...`);
    setTimeout(() => tryFind(attempt + 1), 500);
  };

  setTimeout(() => tryFind(0), 1000);
}

const SQUATCH_QUIPS = [
  "Booting up the forest computer...",
  "Warming up the pinecone processor...",
  "Sasquatch neural network activating...",
  "Consulting the ancient internet scrolls...",
  "Tuning the bark-fiber modem...",
  "Calibrating bigfoot bandwidth...",
];

export default function Home() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [query, setQuery] = useState("");
  const [typed, setTyped] = useState("");
  const [allResults, setAllResults] = useState<SearchResult[]>([]);
  const [page, setPage] = useState(0);
  const [shownCount, setShownCount] = useState(0);
  const [status, setStatus] = useState("");
  const [loadProgress, setLoadProgress] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [captions, setCaptions] = useState<string[]>([]);
  const [captionIndex, setCaptionIndex] = useState(-1);
  const [showCrt, setShowCrt] = useState(false);
  const [bufferQuip, setBufferQuip] = useState("");
  const [convoStarted, setConvoStarted] = useState(false);

  const screenRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const sayRef = useRef<HTMLAudioElement>(null);
  const ambientRef = useRef<HTMLAudioElement>(null);
  const typingRef = useRef<HTMLAudioElement>(null);
  const cancelRef = useRef(false);
  const audioUrlRef = useRef<string | null>(null);
  const sayUrlRef = useRef<string | null>(null);

  const totalPages = Math.ceil(allResults.length / PER_PAGE);
  const pageResults = allResults.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  useEffect(() => { const v = screenRef.current; if (v) { v.src = VIDEO_SCREEN; v.load(); v.play().catch(() => {}); } }, []);

  // Show search bar when D-ID activates — try multiple detection methods
  useEffect(() => {
    if (convoStarted) return;

    // Method 1: play event capture
    const onPlay = (e: Event) => {
      const el = e.target as HTMLMediaElement;
      if (el === screenRef.current || el === audioRef.current || el === sayRef.current ||
          el === ambientRef.current || el === typingRef.current) return;
      console.log("[DID] Media play detected");
      setConvoStarted(true);
    };
    document.addEventListener("play", onPlay, true);

    // Method 2: poll for new video/audio elements or WebRTC streams
    const poll = setInterval(() => {
      const videos = document.querySelectorAll("video");
      for (let i = 0; i < videos.length; i++) {
        const v = videos[i];
        if (v === screenRef.current) continue;
        // WebRTC stream or playing video we don't own
        if (v.srcObject || (!v.paused && v.readyState > 2)) {
          console.log("[DID] Active video stream found");
          setConvoStarted(true);
          clearInterval(poll);
          return;
        }
      }
      // Also check for new audio elements
      const audios = document.querySelectorAll("audio");
      for (let i = 0; i < audios.length; i++) {
        const a = audios[i];
        if (a === audioRef.current || a === sayRef.current || a === ambientRef.current || a === typingRef.current) continue;
        if (!a.paused) {
          console.log("[DID] Active audio found");
          setConvoStarted(true);
          clearInterval(poll);
          return;
        }
      }
    }, 1000);

    // Method 3: fallback — after first click, wait 5 seconds max
    const onClick = () => {
      setTimeout(() => {
        setConvoStarted(true);
      }, 5000);
      window.removeEventListener("click", clickHandler);
    };
    const clickHandler = onClick;
    window.addEventListener("click", clickHandler);

    return () => {
      document.removeEventListener("play", onPlay, true);
      clearInterval(poll);
      window.removeEventListener("click", clickHandler);
    };
  }, [convoStarted]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
    if (sayRef.current) sayRef.current.volume = volume;
    if (ambientRef.current) ambientRef.current.volume = volume * 0.4;
    if (typingRef.current) typingRef.current.volume = volume * 0.3;
  }, [volume]);

  const reset = useCallback(() => {
    cancelRef.current = true;
    setPhase("idle"); setTyped(""); setAllResults([]); setPage(0); setShownCount(0);
    setStatus(""); setQuery(""); setLoadProgress(0); setCaptions([]); setCaptionIndex(-1);
    setShowCrt(false); setBufferQuip("");
    if (audioUrlRef.current) { URL.revokeObjectURL(audioUrlRef.current); audioUrlRef.current = null; }
    if (sayUrlRef.current) { URL.revokeObjectURL(sayUrlRef.current); sayUrlRef.current = null; }
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
    if (sayRef.current) { sayRef.current.pause(); sayRef.current.src = ""; }
  }, []);

  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === "Escape") reset(); }; window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [reset]);
  useEffect(() => { [audioRef, sayRef, ambientRef, typingRef].forEach(r => { if (r.current) r.current.muted = muted; }); }, [muted]);
  useEffect(() => { if (phase !== "typing" && typingRef.current) typingRef.current.pause(); }, [phase]);
  useEffect(() => { if (phase === "idle" && ambientRef.current) { ambientRef.current.pause(); ambientRef.current.currentTime = 0; } }, [phase]);

  // Caption cycling — ~110ms per char at 0.85 playback rate
  useEffect(() => {
    if (captions.length <= 1 || captionIndex < 0 || captionIndex >= captions.length - 1) return;
    const charCount = captions[captionIndex]?.length || 15;
    const delay = Math.max(charCount * 75, 1500);
    const t = setTimeout(() => setCaptionIndex((i) => i + 1), delay);
    return () => clearTimeout(t);
  }, [captions, captionIndex]);

  useEffect(() => {
    if (phase === "revealing" && shownCount < Math.min(PER_PAGE, allResults.length)) {
      const t = setTimeout(() => setShownCount((n) => n + 1), shownCount === 0 ? 800 : REVEAL_INTERVAL);
      return () => clearTimeout(t);
    }
  }, [phase, shownCount, allResults.length]);

  useEffect(() => {
    if (phase !== "loading") { setLoadProgress(0); return; }
    let prog = 0;
    const t = setInterval(() => { prog += Math.random() * 15 + 5; if (prog > 90) prog = 90; setLoadProgress(Math.round(prog)); }, 400);
    return () => clearInterval(t);
  }, [phase]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const theatricalType = useCallback((text: string): Promise<void> => new Promise((resolve) => {
    const typos = [{ at: Math.floor(text.length * 0.3), wrong: "xz", pause: 400 }, { at: Math.floor(text.length * 0.6), wrong: "k", pause: 300 }];
    let i = 0, typoIdx = 0, inTypo = false, wrongChars = 0;
    const tick = () => {
      if (cancelRef.current) { resolve(); return; }
      if (!inTypo && typoIdx < typos.length && i === typos[typoIdx].at) {
        inTypo = true; const wrong = typos[typoIdx].wrong; setTyped(text.slice(0, i) + wrong); wrongChars = wrong.length;
        setTimeout(() => { if (cancelRef.current) { resolve(); return; } const bs = () => { if (cancelRef.current) { resolve(); return; } wrongChars--; if (wrongChars > 0) { setTyped(text.slice(0, i) + typos[typoIdx].wrong.slice(0, wrongChars)); setTimeout(bs, 80); } else { setTyped(text.slice(0, i)); inTypo = false; typoIdx++; setTimeout(tick, 200); } }; bs(); }, typos[typoIdx].pause);
        return;
      }
      i++; setTyped(text.slice(0, i));
      if (i < text.length) setTimeout(tick, 70 + Math.random() * 70); else resolve();
    };
    setTyped(""); tick();
  }), []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q || phase !== "idle") return;
    cancelRef.current = false;
    setAllResults([]); setPage(0); setShownCount(0); setCaptions([]); setCaptionIndex(-1);

    // Start ambient (user gesture)
    const amb = ambientRef.current;
    if (amb) { amb.volume = volume * 0.4; amb.currentTime = 0; amb.play().catch(() => {}); }

    // Fire everything in background immediately
    const searchPromise = fetch("/api/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: q }) }).then(r => r.json()).catch(() => ({ error: true }));
    const reactPromise = fetch("/api/react", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: q }) }).catch(() => null);

    // ── 1. CRT LOADING SCREEN — 2 seconds ──
    if (screenRef.current && screenRef.current.paused) { screenRef.current.play().catch(() => {}); }
    setShowCrt(true);
    setPhase("buffering");
    setBufferQuip(SQUATCH_QUIPS[Math.floor(Math.random() * SQUATCH_QUIPS.length)]);
    await new Promise((r) => setTimeout(r, 2000));
    if (cancelRef.current) return;

    // ── 2. TYPING CLIP — clean, no text, no voice ──
    setPhase("avatar-react"); setCaptions([]); setCaptionIndex(-1); setStatus(""); setBufferQuip("");
    const cutVid = document.createElement("video");
    cutVid.src = "/videos/cutback.mp4";
    cutVid.playsInline = true;
    cutVid.preload = "auto";
    cutVid.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;object-fit:cover;z-index:12;";
    document.body.appendChild(cutVid);
    await new Promise<void>((res) => { cutVid.oncanplay = () => res(); cutVid.load(); setTimeout(res, 1000); });
    cutVid.play().catch(() => {});
    await new Promise<void>((res) => {
      cutVid.onended = () => { cutVid.remove(); res(); };
      setTimeout(() => { cutVid.remove(); res(); }, 10000);
    });
    if (cancelRef.current) return;

    // ── 3. CRT SEARCH SCREEN — voice reads query + comments ──
    setShowCrt(true);
    setPhase("searching"); setStatus("SEARCHING...");

    // Play react voice (reads query, gives opinion)
    try {
      const reactRes = await reactPromise;
      if (reactRes && reactRes.ok && !cancelRef.current) {
        const reactText = decodeURIComponent(reactRes.headers.get("X-Reaction-Text") || "");
        const blob = await reactRes.blob();
        const url = URL.createObjectURL(blob);
        if (reactText) { setCaptions([reactText]); setCaptionIndex(0); }
        const ra = sayRef.current;
        console.log("[AUDIO] React: sayRef exists:", !!ra, "url:", url?.substring(0, 30));
        if (ra) {
          ra.muted = false; ra.volume = Math.min(volume * 1.2, 1); ra.playbackRate = 0.85; ra.src = url;
          console.log("[AUDIO] React muted:", ra.muted, "volume:", ra.volume, "paused:", ra.paused);
          ra.play().then(() => console.log("[AUDIO] React playing, muted:", ra.muted, "volume:", ra.volume)).catch((e) => console.error("[AUDIO] React play failed:", e));
          await new Promise<void>((res) => { ra.onended = () => res(); setTimeout(res, 10000); });
        }
        URL.revokeObjectURL(url);
      }
    } catch {}
    setCaptions([]); setCaptionIndex(-1);
    if (cancelRef.current) return;

    // Wait for search results
    const data = await searchPromise;
    if (cancelRef.current) return;

    try {
      if (data.blocked) { setStatus("ERROR: BAD SEARCH TERMS."); setTimeout(reset, 3000); return; }
      if (data.error && !data.results) throw new Error();
      const sr: SearchResult[] = data.results || [];
      if (sr.length === 0) { setStatus("NO RESULTS FOUND."); setTimeout(reset, 3500); return; }
      setAllResults(sr); setShownCount(0); setPage(0);

      // ── 5. LOADING % — fetch ElevenLabs voice ──
      setStatus("PROCESSING..."); setPhase("loading");
      const speakPromise = fetch("/api/speak", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: q, results: sr }) });
      const speakRes = await speakPromise;
      if (cancelRef.current) return;

      if (speakRes.ok) {
        const reactionText = decodeURIComponent(speakRes.headers.get("X-Reaction-Text") || "");
        const blob = await speakRes.blob();
        const audioUrl = URL.createObjectURL(blob);
        audioUrlRef.current = audioUrl;
        const sentences = reactionText.split(/(?<=[.!?])\s+/).filter((s: string) => s.length > 0);

        // ── 6. CRT — ElevenLabs voice reads headlines ──
        setCaptions(sentences); setCaptionIndex(0); setLoadProgress(100); setStatus(""); setPhase("revealing"); setShownCount(0);
        const a = audioRef.current;
        if (a) {
          a.muted = false; a.volume = Math.min(volume * 1.2, 1); a.playbackRate = 0.85; a.src = audioUrl;
          console.log("[AUDIO] Speak muted:", a.muted, "volume:", a.volume);
          a.play().then(() => console.log("[AUDIO] Speak playing")).catch((e) => console.error("[AUDIO] Speak play failed:", e));
          await new Promise<void>((res) => { a.onended = () => res(); setTimeout(res, 30000); });
        }
        if (cancelRef.current) return;
        setCaptions([]); setCaptionIndex(-1);
        setShownCount(PER_PAGE); setPhase("browse");
      } else {
        setShownCount(PER_PAGE); setPhase("browse"); setStatus("");
      }
    } catch {
      setStatus("CONNECTION ERROR."); setTimeout(reset, 3000);
    }
  };

  const goPage = (p: number) => { setPage(p); setShownCount(PER_PAGE); };
  const onScreen = phase === "typing" || phase === "searching" || phase === "loading" || phase === "revealing" || phase === "browse";
  const active = phase !== "idle";
  const showResults = (phase === "revealing" || phase === "browse") && allResults.length > 0;
  const showCaptions = captions.length > 0 && captionIndex >= 0 && captionIndex < captions.length;

  return (
    <>
      {/* CRT Screen video */}
      <video ref={screenRef} className="video-bg" style={{ zIndex: showCrt ? 5 : -1 }} preload="auto" muted playsInline loop />
      <div className="vignette" /><div className="scanlines" />

      {/* Audio */}
      <audio ref={audioRef} /><audio ref={sayRef} />
      <audio ref={ambientRef} src="/audio/ambient.mp3" loop preload="auto" />
      <audio ref={typingRef} src="/audio/typing.mp3" loop preload="auto" />

      {/* ── BUFFERING SCREEN (on CRT) ── */}
      {phase === "buffering" && (
        <div className="crt-overlay"><div className="crt-screen" style={{ justifyContent: "center", alignItems: "center", textAlign: "center" }}>
          <div className="buffer-logo-crt">SearchSquatch</div>
          <div className="buffer-spinner-crt" />
          <div className="buffer-quip-crt">{bufferQuip}</div>
        </div></div>
      )}

      {/* ── CRT SCREEN OVERLAY ── */}
      {onScreen && (
        <div className="crt-overlay"><div className="crt-screen">
          <div className="crt-logo">SearchSquatch</div>
          <div className="term-query"><span className="term-prompt">&gt;</span> {typed}{phase === "typing" && <span className="term-cursor">_</span>}</div>
          {phase === "loading" && (<div className="term-loading"><div className="load-bar-track"><div className="load-bar-fill" style={{ width: `${loadProgress}%` }} /></div><span className="load-pct">{loadProgress}%</span></div>)}
          {status && <div className="term-status">{status}</div>}
          {showResults && (<div className="term-results">
            {phase === "browse" && <div className="term-hint">click on a link to visit the site</div>}
            <div className="term-divider">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</div>
            {pageResults.slice(0, phase === "revealing" ? shownCount : PER_PAGE).map((r, i) => (
              <div key={page * PER_PAGE + i} className="term-result"><a href={r.url} target="_blank" rel="noopener noreferrer" className="term-result-title">{r.title || "Untitled"}</a><div className="term-result-url">{r.url}</div></div>
            ))}
            {phase === "browse" && totalPages > 1 && (<div className="term-pagination"><button className="page-btn" onClick={() => goPage(page - 1)} disabled={page === 0}>&lt; PREV</button><span className="page-info">{page + 1} / {totalPages}</span><button className="page-btn" onClick={() => goPage(page + 1)} disabled={page >= totalPages - 1}>NEXT &gt;</button></div>)}
          </div>)}
          {phase === "browse" && (<div className="term-browse"><div className="term-browse-btns"><button className="term-new-search" onClick={reset}>[ NEW SEARCH ]</button></div></div>)}
        </div></div>
      )}

      {/* ── CAPTIONS ── */}
      {showCaptions && (<div className="caption-bar"><p className="caption-text" key={captionIndex}>{captions[captionIndex]}</p></div>)}

      {/* ── SOUND CONTROLS ── */}
      {active && (<div className="sound-controls">
        <button className="mute-btn" onClick={() => setMuted((m) => !m)}>{muted ? (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>) : (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>)}</button>
        <input type="range" className="volume-slider" min="0" max="1" step="0.05" value={muted ? 0 : volume} onChange={(e) => { const v = parseFloat(e.target.value); setVolume(v); if (v > 0 && muted) setMuted(false); if (v === 0) setMuted(true); }} />
      </div>)}

      <div className={`audio-bar ${phase === "typing" || phase === "revealing" ? "active" : ""}`} />

      {/* ── SEARCH BAR ── */}
      <div className={`search-container ${active ? "away" : ""}`}>
        <form className="search-form" onSubmit={handleSearch}>
          <input className="search-input" type="text" placeholder="Searchsquatch anything..." value={query} onChange={(e) => setQuery(e.target.value)} disabled={active} />
          <button className="search-btn" type="submit" disabled={active || !query.trim()}>Squatch</button>
        </form>
      </div>

      {active && phase !== "typing" && phase !== "buffering" && <button className="close-btn" onClick={reset} title="Back (Esc)">ESC</button>}
      <a href="https://conductorailabs.com" target="_blank" rel="noopener noreferrer" className="conductor-link">Conductor Labs</a>
    </>
  );
}
