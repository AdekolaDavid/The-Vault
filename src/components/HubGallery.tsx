"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface DbComponent {
  id: string;
  title: string;
  category: string;
  code_snippet: string;
  css_tokens: string;
  interaction_type?: string;
  style_system?: string;
}

const OBSIDIAN = "#050608";
const CARD = "#0c0e12";
const ACCENT = "#2e6ef5";
const TEXT = "#ffffff";
const MUTED = "#424a57";
const MONO = "JetBrains Mono, monospace";

const STYLE_OPTIONS = ["HTML", "CSS", "HTML + CSS"];

// ─── CODE MODAL ───────────────────────────────────────────────────
function CodeModal({ item, onClose }: { item: DbComponent; onClose: () => void }) {
  const [tab, setTab] = useState<"html" | "css">("html");
  const [copied, setCopied] = useState(false);

  const code = tab === "html" ? item.code_snippet : item.css_tokens;

  async function handleCopy() {
    await navigator.clipboard.writeText(code || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: "rgba(5,6,8,0.85)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full flex flex-col"
        style={{
          maxWidth: "640px",
          maxHeight: "80vh",
          background: CARD,
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div>
            <h3 className="font-black uppercase tracking-tight text-sm" style={{ color: TEXT }}>
              {item.title}
            </h3>
            <span className="text-[10px] font-mono" style={{ color: MUTED }}>{item.category}</span>
          </div>
          <button
            onClick={onClose}
            style={{ color: MUTED, fontSize: "20px", lineHeight: 1 }}
            onMouseEnter={e => (e.currentTarget.style.color = TEXT)}
            onMouseLeave={e => (e.currentTarget.style.color = MUTED)}
          >×</button>
        </div>

        <div className="flex items-center gap-1 px-6 pt-4 shrink-0">
          {(["html", "css"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                borderRadius: "6px",
                color: tab === t ? TEXT : MUTED,
                background: tab === t ? "rgba(255,255,255,0.06)" : "transparent",
                fontFamily: MONO,
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                padding: "6px 12px",
              }}
            >{t}</button>
          ))}
          <div className="ml-auto">
            <button
              onClick={handleCopy}
              style={{
                borderRadius: "6px",
                border: `1px solid ${copied ? "rgba(46,110,245,0.6)" : "rgba(255,255,255,0.1)"}`,
                color: copied ? ACCENT : MUTED,
                background: copied ? "rgba(46,110,245,0.08)" : "transparent",
                fontFamily: MONO,
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                padding: "6px 16px",
              }}
            >{copied ? "Copied!" : "Copy"}</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <pre style={{
            color: "rgba(255,255,255,0.75)",
            fontFamily: MONO,
            fontSize: "12px",
            lineHeight: 1.7,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}>
            {code || `/* No ${tab.toUpperCase()} for this component */`}
          </pre>
        </div>
      </div>
    </div>
  );
}

// ─── VAULT CARD ───────────────────────────────────────────────────
function VaultCard({
  item,
  index,
  onGetCode,
}: {
  item: DbComponent;
  index: number;
  onGetCode: (item: DbComponent) => void;
}) {
  const skeletonRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let destroyed = false;
    async function reveal() {
      const { animate } = await import("animejs");
      if (destroyed) return;
      setTimeout(() => {
        if (destroyed) return;
        setIsLive(true);
        if (skeletonRef.current) animate(skeletonRef.current, { opacity: [1, 0], duration: 260, easing: "easeOutQuart" });
        setTimeout(() => {
          if (destroyed || !stageRef.current) return;
          animate(stageRef.current, { opacity: [0, 1], duration: 400, easing: "easeOutQuart" });
        }, 30);
      }, 80 + (index % 12) * 70);
    }
    reveal();
    return () => { destroyed = true; };
  }, [index]);

  return (
    <div
      className="group flex flex-col transition-all duration-300"
      style={{ background: CARD }}
      onMouseEnter={e => { e.currentTarget.style.background = "#0e1117"; }}
      onMouseLeave={e => { e.currentTarget.style.background = CARD; }}
    >
      <div className="relative overflow-hidden flex items-center justify-center" style={{ height: "190px" }}>
        {!isLive && (
          <div ref={skeletonRef} className="absolute inset-0 flex items-center justify-center" style={{ background: CARD }}>
            <div className="w-1/2 h-1/2 animate-pulse" style={{ background: "rgba(46,110,245,0.03)", borderRadius: 2 }} />
          </div>
        )}
        {isLive && (
          <div ref={stageRef} className="absolute inset-0 flex items-center justify-center overflow-hidden" style={{ opacity: 0 }}>
            {item.css_tokens && <style dangerouslySetInnerHTML={{ __html: item.css_tokens }} />}
            <div dangerouslySetInnerHTML={{ __html: item.code_snippet || "" }} />
          </div>
        )}
      </div>

      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
      >
        <div className="min-w-0 mr-3">
          <h4 className="text-[11px] font-black uppercase tracking-tight truncate" style={{ color: TEXT }}>
            {item.title}
          </h4>
          <span className="text-[9px] font-mono" style={{ color: MUTED }}>{item.category}</span>
        </div>

        <button
          onClick={() => onGetCode(item)}
          className="text-[10px] font-black uppercase tracking-widest transition-colors duration-200 shrink-0"
          style={{ color: "rgba(46,110,245,0.5)", fontFamily: MONO }}
          onMouseEnter={e => (e.currentTarget.style.color = ACCENT)}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(46,110,245,0.5)")}
        >
          Get Code ↗
        </button>
      </div>
    </div>
  );
}

// ─── CATEGORY FILTER ──────────────────────────────────────────────
function CategoryFilter({ categories, active, onSelect }: {
  categories: string[];
  active: string;
  onSelect: (cat: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2 border transition-all duration-200"
        style={{
          borderColor: open ? ACCENT : "rgba(46,110,245,0.2)",
          color: open ? ACCENT : "rgba(46,110,245,0.5)",
          background: "transparent",
          borderRadius: "8px",
          fontFamily: MONO,
        }}
      >
        {active === "All" ? "Filter" : active}
        <span style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
      </button>
      {open && (
        <div
          className="absolute right-0 mt-2 w-48 border z-20 max-h-72 overflow-y-auto"
          style={{ background: "#0a0a0c", borderColor: "rgba(46,110,245,0.12)", borderRadius: "10px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
        >
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => { onSelect(cat); setOpen(false); }}
              className="w-full text-left text-[10px] font-bold uppercase tracking-wider px-4 py-2.5 transition-colors"
              style={{ color: active === cat ? ACCENT : MUTED, background: active === cat ? "rgba(46,110,245,0.05)" : "transparent", fontFamily: MONO }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(46,110,245,0.07)")}
              onMouseLeave={e => (e.currentTarget.style.background = active === cat ? "rgba(46,110,245,0.05)" : "transparent")}
            >{cat}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── HUB GALLERY ──────────────────────────────────────────────────
export default function HubGallery({ components }: { components: DbComponent[] }) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeStyle, setActiveStyle] = useState("All");
  const [selectedComponent, setSelectedComponent] = useState<DbComponent | null>(null);

  const categories = [
    "All",
    ...Array.from(new Set(components.map(c => c.category).filter(Boolean))).sort(),
  ];

  const filtered = components.filter(c => {
    const catMatch = activeCategory === "All" || c.category === activeCategory;
    const styleMatch = activeStyle === "All" || c.style_system === activeStyle;
    return catMatch && styleMatch;
  });

  return (
    <div className="min-h-screen" style={{ background: OBSIDIAN }}>
      {selectedComponent && (
        <CodeModal item={selectedComponent} onClose={() => setSelectedComponent(null)} />
      )}

      <div className="px-8 pt-16 pb-6 flex items-end justify-between flex-wrap gap-4">
        <div>
          <span style={{ color: ACCENT, fontFamily: MONO, fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase" }}>
            You're in the vault
          </span>
          <h2 className="text-4xl font-black uppercase mt-4 leading-none" style={{ color: TEXT }}>
            Browse Components
          </h2>
          <p className="text-xs font-mono mt-2" style={{ color: MUTED }}>
            {filtered.length} component{filtered.length !== 1 ? "s" : ""} — grab the code, ship faster.
          </p>
        </div>
        <CategoryFilter categories={categories} active={activeCategory} onSelect={setActiveCategory} />
      </div>

      <div className="px-8 pb-6 flex items-center gap-2">
        {["All", ...STYLE_OPTIONS].map(s => (
          <button
            key={s}
            onClick={() => setActiveStyle(s)}
            className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 transition-all duration-200"
            style={{
              borderRadius: "100px",
              fontFamily: MONO,
              border: `1px solid ${activeStyle === s ? ACCENT : "rgba(46,110,245,0.15)"}`,
              color: activeStyle === s ? ACCENT : MUTED,
              background: activeStyle === s ? "rgba(46,110,245,0.08)" : "transparent",
            }}
          >{s}</button>
        ))}
      </div>

      <div className="px-8 pb-16">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p className="font-mono text-sm" style={{ color: "rgba(46,110,245,0.35)" }}>No components here yet.</p>
            <p className="font-mono text-xs mt-2" style={{ color: MUTED }}>Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[18px]">
            {filtered.map((item, i) => (
              <VaultCard
                key={item.id}
                item={item}
                index={i}
                onGetCode={setSelectedComponent}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}