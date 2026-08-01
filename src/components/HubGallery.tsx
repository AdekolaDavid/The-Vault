"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

interface DbComponent {
  id: string;
  title: string;
  category: string;
  code_snippet: string;
  css_tokens: string;
  interaction_type?: string;
}

const OBSIDIAN = "#050608";
const CIRCUIT_NAVY = "#0c0e12";
const ACCENT = "#2e6ef5";
const TEXT = "#ffffff";
const MUTED = "#424a57";
const LABEL = "#2e6ef5";

// ─── VAULT CARD ───────────────────────────────────────────────────
function VaultCard({ item, index }: { item: DbComponent; index: number }) {
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

        if (skeletonRef.current) {
          animate(skeletonRef.current, {
            opacity: [1, 0],
            duration: 260,
            easing: "easeOutQuart",
          });
        }
        // Small delay so DOM renders before animating
        setTimeout(() => {
          if (destroyed || !stageRef.current) return;
          animate(stageRef.current, {
            opacity: [0, 1],
            duration: 400,
            easing: "easeOutQuart",
          });
        }, 30);
      }, 80 + (index % 12) * 70);
    }

    reveal();
    return () => { destroyed = true; };
  }, [index]);

  return (
    <div
      className="group flex flex-col transition-all duration-300"
      style={{ background: CIRCUIT_NAVY }}
      onMouseEnter={e => { e.currentTarget.style.background = "#0e1117"; }}
      onMouseLeave={e => { e.currentTarget.style.background = CIRCUIT_NAVY; }}
    >
      {/* Preview stage — component rendered directly in DOM like Kinetics */}
      <div
        className="relative overflow-hidden flex items-center justify-center"
        style={{ minHeight: "190px", height: "190px" }}
      >
        {/* Skeleton phase */}
        {!isLive && (
          <div
            ref={skeletonRef}
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: CIRCUIT_NAVY }}
          >
            <div
              className="w-1/2 h-1/2 animate-pulse"
              style={{ background: "rgba(46,110,245,0.03)", borderRadius: 2 }}
            />
          </div>
        )}

        {/* Live phase — direct DOM render */}
        {isLive && (
          <div
            ref={stageRef}
            className="absolute inset-0 flex items-center justify-center overflow-hidden"
            style={{ opacity: 0 }}
          >
            {item.css_tokens && (
              <style dangerouslySetInnerHTML={{ __html: item.css_tokens }} />
            )}
            <div dangerouslySetInnerHTML={{ __html: item.code_snippet || "" }} />
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
      >
        <div>
          <h4
            className="text-[11px] font-black uppercase tracking-tight"
            style={{ color: TEXT }}
          >
            {item.title}
          </h4>
          <span
            className="text-[9px] font-mono"
            style={{ color: "#424a57" }}
          >
            {item.category}
          </span>
        </div>

        <Link
          href={`/view/${item.id}`}
          className="text-[10px] font-black uppercase tracking-widest transition-colors duration-200"
          style={{ color: "rgba(46,110,245,0.4)" }}
          onMouseEnter={e => (e.currentTarget.style.color = ACCENT)}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(46,110,245,0.4)")}
        >
          Get Code ↗
        </Link>
      </div>
    </div>
  );
}

// ─── CATEGORY FILTER ──────────────────────────────────────────────
function CategoryFilter({
  categories,
  active,
  onSelect,
}: {
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
          borderColor: open ? ACCENT : "rgba(46,110,245,0.15)",
          color: open ? ACCENT : "rgba(46,110,245,0.4)",
          background: "transparent",
        }}
      >
        {active === "All" ? "Filter" : active}
        <span style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-48 border z-20 max-h-72 overflow-y-auto"
          style={{ background: "#0a0a0a", borderColor: "rgba(46,110,245,0.1)" }}
        >
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => { onSelect(cat); setOpen(false); }}
              className="w-full text-left text-[10px] font-bold uppercase tracking-wider px-3 py-2.5 transition-colors"
              style={{
                color: active === cat ? ACCENT : "rgba(46,110,245,0.35)",
                background: active === cat ? "rgba(46,110,245,0.04)" : "transparent",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(46,110,245,0.06)")}
              onMouseLeave={e => (e.currentTarget.style.background = active === cat ? "rgba(46,110,245,0.04)" : "transparent")}
            >
              {cat}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── HUB GALLERY ──────────────────────────────────────────────────
export default function HubGallery({ components }: { components: DbComponent[] }) {
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = [
    "All",
    ...Array.from(new Set(components.map(c => c.category).filter(Boolean))).sort(),
  ];

  const filtered =
    activeCategory === "All"
      ? components
      : components.filter(c => c.category === activeCategory);

  return (
    <div className="min-h-screen" style={{ background: OBSIDIAN }}>

      {/* Header */}
      <div className="px-8 pt-16 pb-10 flex items-end justify-between flex-wrap gap-4">
        <div>
          <span
            className="text-[10px] font-black uppercase tracking-widest border px-2 py-0.5"
            style={{ color: ACCENT, borderColor: "rgba(46,110,245,0.2)" }}
          >
            You're in the vault
          </span>
          <h2
            className="text-4xl font-black uppercase mt-4 leading-none"
            style={{ color: TEXT }}
          >
            Browse Components
          </h2>
          <p
            className="text-xs font-mono mt-2"
            style={{ color: "#424a57" }}
          >
            {filtered.length} component{filtered.length !== 1 ? "s" : ""} — grab the code, ship faster.
          </p>
        </div>

        <CategoryFilter
          categories={categories}
          active={activeCategory}
          onSelect={setActiveCategory}
        />
      </div>

      {/* Grid */}
      <div className="px-8 pb-16">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p className="font-mono text-sm" style={{ color: "#424a57" }}>
              No components in this category yet.
            </p>
            <p className="font-mono text-xs mt-2" style={{ color: "rgba(46,110,245,0.15)" }}>
              Check back soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[18px]">
            {filtered.map((item, i) => (
              <VaultCard key={item.id} item={item} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}