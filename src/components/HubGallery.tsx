"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type InteractionType = "passive" | "clickable" | "hoverable" | "inputable";

interface DbComponent {
  id: string;
  title: string;
  category: string;
  code_snippet: string;
  css_tokens: string;
  interaction_type?: InteractionType;
}

const ORBIT_BLACK = "#0E1117";
const PLATINUM = "#D9DEE5";
const SOLAR_LIME = "#B6FF3B";
const CIRCUIT_NAVY = "#0C1A2B";

// Deterministic bento sizing — earlier (more recent) items get more room.
// `components` is assumed to arrive newest-first from the query.
function getSpan(index: number): string {
  const pattern = index % 7;
  if (pattern === 0) return "col-span-2 row-span-2";
  if (pattern === 3) return "col-span-2 row-span-1";
  return "col-span-1 row-span-1";
}

// ─── VAULT CARD ───────────────────────────────────────────────────
function VaultCard({ item, index }: { item: DbComponent; index: number }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const skeletonRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);
  const [isLive, setIsLive] = useState(false);

  const interactionType: InteractionType = item.interaction_type ?? "passive";
  const isInert = interactionType === "passive";

  useEffect(() => {
    let destroyed = false;

    async function reveal() {
      const { animate } = await import("animejs");
      if (destroyed) return;

      const delay = 80 + (index % 12) * 70;

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
        if (liveRef.current) {
          animate(liveRef.current, {
            opacity: [0, 1],
            scale: [0.97, 1],
            duration: 420,
            easing: "easeOutQuart",
          });
        }
      }, delay);
    }

    reveal();
    return () => {
      destroyed = true;
    };
  }, [index]);

  const srcDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: transparent; overflow: hidden; }
          ${item.css_tokens || ""}
        </style>
      </head>
      <body>
        ${item.code_snippet || '<p style="color: #555; font-family: monospace;">No preview</p>'}
      </body>
    </html>
  `;

  return (
    <div
      ref={rootRef}
      className={`group relative overflow-hidden border transition-all duration-300 ${getSpan(index)}`}
      style={{
        background: ORBIT_BLACK,
        borderColor: "rgba(217,222,229,0.08)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(217,222,229,0.5)";
        e.currentTarget.style.boxShadow = `0 0 24px rgba(217,222,229,0.15)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(217,222,229,0.08)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Skeleton (phase 1) */}
      <div
        ref={skeletonRef}
        className="absolute inset-0 flex items-center justify-center"
        style={{ background: ORBIT_BLACK, display: isLive ? "none" : "flex" }}
      >
        <div
          className="w-2/3 h-2/3 animate-pulse"
          style={{ background: "rgba(217,222,229,0.05)", borderRadius: 4 }}
        />
      </div>

      {/* Live content (phase 2) */}
      <div
        ref={liveRef}
        className="relative h-full w-full flex flex-col"
        style={{ opacity: isLive ? undefined : 0 }}
      >
        <div className="relative flex-1 min-h-[120px] border-b" style={{ borderColor: "rgba(217,222,229,0.08)" }}>
          {isLive && (
            <iframe
              srcDoc={srcDoc}
              className="absolute inset-0 w-full h-full border-none"
              style={{ pointerEvents: isInert ? "none" : "auto" }}
            />
          )}
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(to top, ${ORBIT_BLACK}, transparent 60%)`, opacity: 0.5 }}
          />

          {/* Get Code — slides up from the bottom on hover */}
          <div className="absolute inset-x-0 bottom-0 flex justify-center pb-3 overflow-hidden">
            <Link
              href={`/view/${item.id}`}
              className="px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-transform duration-300 translate-y-[150%] group-hover:translate-y-0"
              style={{ background: PLATINUM, color: ORBIT_BLACK }}
            >
              Get Code ↗
            </Link>
          </div>
        </div>

        <div className="p-3 flex items-center justify-between">
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-tight" style={{ color: PLATINUM }}>
              {item.title}
            </h4>
            <span className="text-[9px] font-mono" style={{ color: "rgba(217,222,229,0.4)" }}>
              {item.category}
            </span>
          </div>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: SOLAR_LIME }} />
        </div>
      </div>
    </div>
  );
}

// ─── ON-DEMAND CATEGORY FILTER ────────────────────────────────────
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
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2 border transition-colors"
        style={{
          borderColor: open ? PLATINUM : "rgba(217,222,229,0.2)",
          color: open ? PLATINUM : "rgba(217,222,229,0.7)",
        }}
      >
        {active === "All" ? "Filter" : active}
        <span style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-48 border z-20 max-h-72 overflow-y-auto"
          style={{ background: ORBIT_BLACK, borderColor: "rgba(217,222,229,0.15)" }}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                onSelect(cat);
                setOpen(false);
              }}
              className="w-full text-left text-[10px] font-bold uppercase tracking-wider px-3 py-2 transition-colors"
              style={{
                color: active === cat ? PLATINUM : "rgba(217,222,229,0.55)",
                background: active === cat ? "rgba(217,222,229,0.06)" : "transparent",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(217,222,229,0.08)")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = active === cat ? "rgba(217,222,229,0.06)" : "transparent")
              }
            >
              {cat}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── HUB GALLERY ───────────────────────────────────────────────────
export default function HubGallery({ components }: { components: DbComponent[] }) {
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = ["All", ...Array.from(new Set(components.map((c) => c.category).filter(Boolean))).sort()];

  const filtered = activeCategory === "All" ? components : components.filter((c) => c.category === activeCategory);

  return (
    <div className="min-h-screen" style={{ background: CIRCUIT_NAVY }}>
      {/* Header */}
      <div className="px-6 pt-10 pb-6 flex items-end justify-between flex-wrap gap-4">
        <div>
          <span
            className="text-[10px] font-black uppercase tracking-widest border px-2 py-0.5"
            style={{ color: SOLAR_LIME, borderColor: "rgba(182,255,59,0.4)" }}
          >
            You're in the vault
          </span>
          <h1 className="text-3xl font-black uppercase mt-3" style={{ color: PLATINUM }}>
            Browse components
          </h1>
          <p className="text-xs font-mono mt-1" style={{ color: "rgba(217,222,229,0.45)" }}>
            {filtered.length} component{filtered.length !== 1 ? "s" : ""} — grab the code, ship faster.
          </p>
        </div>

        <CategoryFilter categories={categories} active={activeCategory} onSelect={setActiveCategory} />
      </div>

      {/* Grid */}
      <div className="px-6 pb-12">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="font-mono text-sm" style={{ color: "rgba(217,222,229,0.4)" }}>
              No components in this category yet.
            </p>
            <p className="font-mono text-xs mt-1" style={{ color: "rgba(217,222,229,0.25)" }}>
              Check back soon.
            </p>
          </div>
        ) : (
          <div
            className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3"
            style={{ gridAutoFlow: "dense", gridAutoRows: "160px" }}
          >
            {filtered.map((item, i) => (
              <VaultCard key={item.id} item={item} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}