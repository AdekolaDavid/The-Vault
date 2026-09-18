"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

const CATEGORIES = ["Buttons", "Checkboxes", "Toggle switches", "Cards", "Loaders", "Inputs", "Radio buttons", "Forms"];
const INTERACTION_TYPES = ["passive", "clickable", "hoverable", "inputable"];
const STYLE_SYSTEMS = ["HTML", "CSS", "HTML + CSS"];

const OBSIDIAN = "#050608";
const CARD = "#0c0e12";
const ACCENT = "#2e6ef5";
const MUTED = "#424a57";
const TEXT = "#ffffff";
const DANGER = "#ef4444";
const MONO = "JetBrains Mono, monospace";

const MAX_ATTEMPTS = 3;
const CONFIRM_WINDOW_MS = 3000;

const inputStyle = {
  width: "100%",
  background: CARD,
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: "8px",
  padding: "10px 14px",
  color: TEXT,
  fontFamily: MONO,
  fontSize: "12px",
  outline: "none",
  transition: "border-color 0.2s",
};

const labelStyle = {
  display: "block",
  fontSize: "10px",
  fontFamily: MONO,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
  color: MUTED,
  marginBottom: "8px",
};

const pillStyle = (variant: "neutral" | "accent" | "muted") => ({
  display: "inline-flex",
  alignItems: "center",
  padding: "3px 10px",
  borderRadius: "999px",
  fontSize: "9px",
  fontFamily: MONO,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  border: `1px solid ${variant === "accent" ? "rgba(46,110,245,0.3)" : "rgba(255,255,255,0.08)"}`,
  background: variant === "accent" ? "rgba(46,110,245,0.08)" : "rgba(255,255,255,0.03)",
  color: variant === "accent" ? ACCENT : variant === "muted" ? MUTED : "rgba(255,255,255,0.7)",
  whiteSpace: "nowrap" as const,
});

// ─── PASSWORD GATE ─────────────────────────────────────────────────
function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (locked) return;
    setLoading(true);
    setError(null);

    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    if (!adminEmail) {
      setError("Admin email is not configured (NEXT_PUBLIC_ADMIN_EMAIL missing in .env.local).");
      setLoading(false);
      return;
    }

    // Real Supabase Auth sign-in — replaces the old env-var string compare.
    // The single password field is unchanged; it's now checked against your
    // actual Supabase Auth user instead of a plain ADMIN_PASSWORD value.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password,
    });

    if (!signInError) {
      onUnlock();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= MAX_ATTEMPTS) {
        setLocked(true);
        setError("Too many failed attempts. Session locked.");
      } else {
        setError(`Incorrect password. ${MAX_ATTEMPTS - newAttempts} attempt${MAX_ATTEMPTS - newAttempts === 1 ? "" : "s"} remaining.`);
      }
      setPassword("");
    }
    setLoading(false);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: OBSIDIAN }}
    >
      <div
        className="w-full max-w-sm p-8"
        style={{
          background: CARD,
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "16px",
        }}
      >
        {/* Header */}
        <div className="mb-8">
          <h1
            style={{
              fontFamily: "'Ethnocentric', monospace",
              fontSize: "18px",
              letterSpacing: "0.1em",
              color: TEXT,
              textTransform: "uppercase",
              marginBottom: "8px",
            }}
          >
            The Vault
          </h1>
          <p style={{ fontFamily: MONO, fontSize: "10px", color: MUTED, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Admin Access
          </p>
        </div>

        {error && (
          <div
            className="mb-6 px-4 py-3 text-[11px]"
            style={{
              borderRadius: "8px",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: DANGER,
              fontFamily: MONO,
              letterSpacing: "0.06em",
            }}
          >
            {error}
          </div>
        )}

        {!locked ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label style={labelStyle}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoFocus
                  placeholder="••••••••"
                  style={{ ...inputStyle, paddingRight: "56px" }}
                  onFocus={e => (e.currentTarget.style.borderColor = "rgba(46,110,245,0.5)")}
                  onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: MUTED,
                    fontFamily: MONO,
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full transition-all duration-200"
              style={{
                padding: "12px",
                borderRadius: "10px",
                border: "1px solid rgba(46,110,245,0.5)",
                background: "rgba(46,110,245,0.1)",
                color: ACCENT,
                fontFamily: MONO,
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                cursor: loading || !password ? "not-allowed" : "pointer",
                opacity: loading || !password ? 0.5 : 1,
              }}
            >
              {loading ? "Verifying..." : "Enter"}
            </button>
          </form>
        ) : (
          <p style={{ fontFamily: MONO, fontSize: "11px", color: MUTED, textAlign: "center" }}>
            Reload the page to try again.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── ADD COMPONENT VIEW ────────────────────────────────────────────
function AddComponentView() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [styleSystem, setStyleSystem] = useState(STYLE_SYSTEMS[2]);
  const [interactionType, setInteractionType] = useState(INTERACTION_TYPES[0]);
  const [htmlCode, setHtmlCode] = useState("");
  const [cssCode, setCssCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase.from("components").insert({
        id: crypto.randomUUID(),
        title: title.trim(),
        style_system: styleSystem,
        category,
        code_snippet: htmlCode,
        css_tokens: cssCode,
        dependencies: [],
        interaction_type: interactionType,
      });

      if (error) throw error;

      setMessage({ text: "Component saved to vault.", type: "success" });
      setTitle("");
      setHtmlCode("");
      setCssCode("");
      setStyleSystem(STYLE_SYSTEMS[2]);
      setInteractionType(INTERACTION_TYPES[0]);
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const srcDoc = `<!DOCTYPE html>
<html>
  <head>
    <style>
      body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: transparent; overflow: hidden; }
      ${cssCode}
    </style>
  </head>
  <body>${htmlCode || '<p style="font-family:monospace;color:#2a3a4a;font-size:12px;letter-spacing:0.08em;">Live preview will appear here...</p>'}</body>
</html>`;

  return (
    <div className="flex h-full overflow-hidden">
      {/* LEFT PANEL */}
      <div
        className="flex flex-col w-1/2 h-full"
        style={{ borderRight: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <form id="vault-form" onSubmit={handleSave} className="flex flex-col gap-5">

            <div>
              <label style={labelStyle}>Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Neon Pulse Button"
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = "rgba(46,110,245,0.5)")}
                onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={labelStyle}>Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  style={{ ...inputStyle, cursor: "pointer" }}
                  onFocus={e => (e.currentTarget.style.borderColor = "rgba(46,110,245,0.5)")}
                  onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat} style={{ background: CARD }}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Style System</label>
                <select
                  value={styleSystem}
                  onChange={e => setStyleSystem(e.target.value)}
                  style={{ ...inputStyle, cursor: "pointer" }}
                  onFocus={e => (e.currentTarget.style.borderColor = "rgba(46,110,245,0.5)")}
                  onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
                >
                  {STYLE_SYSTEMS.map(s => (
                    <option key={s} value={s} style={{ background: CARD }}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Interaction Type</label>
              <select
                value={interactionType}
                onChange={e => setInteractionType(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}
                onFocus={e => (e.currentTarget.style.borderColor = "rgba(46,110,245,0.5)")}
                onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
              >
                {INTERACTION_TYPES.map(t => (
                  <option key={t} value={t} style={{ background: CARD }}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ ...labelStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                HTML
                <span style={{ color: "rgba(255,255,255,0.2)", fontWeight: 400, textTransform: "lowercase", letterSpacing: 0 }}>pure html only</span>
              </label>
              <textarea
                required
                value={htmlCode}
                onChange={e => setHtmlCode(e.target.value)}
                rows={8}
                placeholder="<button class='btn'>Click me</button>"
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.7 }}
                onFocus={e => (e.currentTarget.style.borderColor = "rgba(46,110,245,0.5)")}
                onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
              />
            </div>

            <div>
              <label style={{ ...labelStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                CSS
                <span style={{ color: "rgba(255,255,255,0.2)", fontWeight: 400, textTransform: "lowercase", letterSpacing: 0 }}>no external frameworks</span>
              </label>
              <textarea
                value={cssCode}
                onChange={e => setCssCode(e.target.value)}
                rows={10}
                placeholder=".btn { background: #2e6ef5; color: #fff; padding: 10px 24px; border: none; border-radius: 6px; cursor: pointer; }"
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.7 }}
                onFocus={e => (e.currentTarget.style.borderColor = "rgba(46,110,245,0.5)")}
                onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
              />
            </div>
          </form>
        </div>

        {/* Sticky footer */}
        <div
          className="shrink-0 px-8 py-5"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          {message && (
            <div
              className="mb-4 px-4 py-3 text-[11px]"
              style={{
                borderRadius: "8px",
                fontFamily: MONO,
                letterSpacing: "0.06em",
                background: message.type === "success" ? "rgba(46,110,245,0.08)" : "rgba(239,68,68,0.08)",
                border: `1px solid ${message.type === "success" ? "rgba(46,110,245,0.2)" : "rgba(239,68,68,0.2)"}`,
                color: message.type === "success" ? ACCENT : DANGER,
              }}
            >
              {message.text}
            </div>
          )}
          <button
            type="submit"
            form="vault-form"
            disabled={saving}
            className="w-full transition-all duration-200"
            style={{
              padding: "14px",
              borderRadius: "10px",
              border: `1px solid ${saving ? "rgba(46,110,245,0.2)" : "rgba(46,110,245,0.5)"}`,
              background: saving ? "rgba(46,110,245,0.05)" : "rgba(46,110,245,0.1)",
              color: saving ? MUTED : ACCENT,
              fontFamily: MONO,
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              cursor: saving ? "not-allowed" : "pointer",
            }}
            onMouseEnter={e => {
              if (!saving) {
                e.currentTarget.style.background = "rgba(46,110,245,0.18)";
                e.currentTarget.style.borderColor = "rgba(46,110,245,0.7)";
              }
            }}
            onMouseLeave={e => {
              if (!saving) {
                e.currentTarget.style.background = "rgba(46,110,245,0.1)";
                e.currentTarget.style.borderColor = "rgba(46,110,245,0.5)";
              }
            }}
          >
            {saving ? "Saving..." : "Save to Vault"}
          </button>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex flex-col w-1/2 h-full" style={{ background: OBSIDIAN }}>
        <div
          className="flex items-center justify-between px-6 py-5 shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
        >
          <span
            className="flex items-center gap-2"
            style={{ fontSize: "10px", fontFamily: MONO, letterSpacing: "0.12em", textTransform: "uppercase", color: MUTED }}
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#22c55e" }} />
            Live Preview
          </span>
          <span style={{ fontSize: "10px", fontFamily: MONO, color: "rgba(255,255,255,0.15)", letterSpacing: "0.08em" }}>
            {styleSystem}
          </span>
        </div>

        <div
          className="flex-1 relative overflow-hidden"
          style={{
            background: "#050608",
            backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        >
          <iframe
            srcDoc={srcDoc}
            title="Live Preview"
            className="absolute inset-0 w-full h-full border-none"
            sandbox="allow-scripts"
          />
        </div>
      </div>
    </div>
  );
}

// Renders a component's real markup/CSS in an isolated iframe so that two
// components both defining, say, `.btn`, can never bleed into each other —
// the same collision risk that ruled out inline dangerouslySetInnerHTML
// thumbnails in Session 10. No `allow-scripts`: these are static visual
// references for telling components apart at a glance, not interactive.
function ComponentThumbnail({ html, css }: { html: string; css: string }) {
  const srcDoc = `<!DOCTYPE html>
<html>
  <head>
    <style>
      * { box-sizing: border-box; }
      html, body { margin: 0; height: 100%; display: flex; align-items: center; justify-content: center; background: transparent; overflow: hidden; }
      ${css}
    </style>
  </head>
  <body>${html || ""}</body>
</html>`;

  return (
    <div
      className="relative shrink-0 overflow-hidden"
      style={{
        width: "96px",
        height: "64px",
        borderRadius: "8px",
        border: "1px solid rgba(255,255,255,0.06)",
        background: "#050608",
        backgroundImage: "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)",
        backgroundSize: "10px 10px",
      }}
    >
      <iframe
        srcDoc={srcDoc}
        title="Component preview"
        sandbox=""
        style={{
          width: "384px",
          height: "256px",
          border: "none",
          transform: "scale(0.25)",
          transformOrigin: "top left",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

// ─── MANAGE VIEW ───────────────────────────────────────────────────
type VaultComponentRow = {
  id: string;
  title: string;
  category: string;
  style_system: string;
  interaction_type: string;
  code_snippet: string;
  css_tokens: string;
};

function ManageView() {
  const [components, setComponents] = useState<VaultComponentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const confirmTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchComponents = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("components")
      .select("id, title, category, style_system, interaction_type, code_snippet, css_tokens")
      .order("title", { ascending: true });

    if (error) setError(error.message);
    else setComponents(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchComponents();
    return () => {
      if (confirmTimeout.current) clearTimeout(confirmTimeout.current);
    };
  }, [fetchComponents]);

  function armOrDelete(id: string) {
    if (confirmingId === id) {
      if (confirmTimeout.current) clearTimeout(confirmTimeout.current);
      setConfirmingId(null);
      void performDelete(id);
      return;
    }
    if (confirmTimeout.current) clearTimeout(confirmTimeout.current);
    setConfirmingId(id);
    confirmTimeout.current = setTimeout(() => setConfirmingId(null), CONFIRM_WINDOW_MS);
  }

  async function performDelete(id: string) {
    setDeletingId(id);
    setError(null);
    const previous = components;
    setComponents(list => list.filter(c => c.id !== id)); // optimistic

    // .select() forces Supabase to return the rows it actually deleted.
    // A blocked RLS policy reports success with zero rows and NO error,
    // so checking `error` alone isn't enough — we have to check the count too.
    const { data, error } = await supabase.from("components").delete().eq("id", id).select();

    if (error) {
      setComponents(previous);
      setError(`Failed to delete: ${error.message}`);
    } else if (!data || data.length === 0) {
      setComponents(previous);
      setError("Delete was blocked (0 rows affected) — likely a missing RLS policy on the components table.");
    }
    setDeletingId(null);
  }

  return (
    <div className="h-full overflow-y-auto px-8 py-6">
      {loading && (
        <p style={{ fontFamily: MONO, fontSize: "11px", color: MUTED, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Loading components...
        </p>
      )}

      {!loading && error && (
        <div
          role="alert"
          className="mb-4 px-4 py-3 text-[11px] flex items-center justify-between"
          style={{
            borderRadius: "8px",
            fontFamily: MONO,
            letterSpacing: "0.06em",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: DANGER,
          }}
        >
          <span>{error}</span>
          <button
            onClick={fetchComponents}
            style={{ color: DANGER, textDecoration: "underline", background: "none", border: "none", cursor: "pointer", fontFamily: MONO, fontSize: "11px" }}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && components.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <p style={{ fontFamily: MONO, fontSize: "12px", color: MUTED, letterSpacing: "0.06em" }}>
            No components in the vault yet.
          </p>
        </div>
      )}

      {!loading && components.length > 0 && (
        <div className="flex flex-col gap-3 max-w-3xl" aria-live="polite">
          {components.map(comp => {
            const isConfirming = confirmingId === comp.id;
            const isDeleting = deletingId === comp.id;
            return (
              <div
                key={comp.id}
                className="flex items-center justify-between gap-4 px-5 py-4"
                style={{
                  background: CARD,
                  border: `1px solid ${isConfirming ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.06)"}`,
                  borderRadius: "10px",
                  transition: "border-color 0.2s, opacity 0.2s",
                  opacity: isDeleting ? 0.5 : 1,
                }}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <ComponentThumbnail html={comp.code_snippet} css={comp.css_tokens} />
                  <div className="flex flex-col gap-2 min-w-0">
                    <span
                      style={{
                        fontSize: "13px",
                        fontFamily: MONO,
                        fontWeight: 600,
                        color: TEXT,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {comp.title}
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span style={pillStyle("neutral")}>{comp.category}</span>
                      <span style={pillStyle("accent")}>{comp.style_system}</span>
                      <span style={pillStyle("muted")}>{comp.interaction_type}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => armOrDelete(comp.id)}
                  disabled={isDeleting}
                  aria-label={isConfirming ? `Confirm delete of ${comp.title}` : `Delete ${comp.title}`}
                  className="shrink-0 transition-all duration-150"
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: `1px solid ${isConfirming ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.08)"}`,
                    background: isConfirming ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.02)",
                    color: isConfirming ? DANGER : MUTED,
                    fontFamily: MONO,
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    cursor: isDeleting ? "not-allowed" : "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {isDeleting ? "Deleting..." : isConfirming ? "Confirm?" : "Delete"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── ADMIN SHELL (shared header + tabs) ─────────────────────────────
function AdminShell() {
  const [tab, setTab] = useState<"add" | "manage">("add");

  async function handleSignOut() {
    await supabase.auth.signOut();
    // VaultAdminPage's onAuthStateChange listener picks this up and flips
    // back to PasswordGate automatically — no local state needed here.
  }

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: OBSIDIAN, color: TEXT, fontFamily: MONO }}
    >
      <div
        className="flex items-center justify-between px-8 py-5 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="flex items-center gap-4">
          <a
            href="/"
            style={{ color: MUTED, fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", textDecoration: "none" }}
            onMouseEnter={e => (e.currentTarget.style.color = TEXT)}
            onMouseLeave={e => (e.currentTarget.style.color = MUTED)}
          >
            ← Gallery
          </a>
          <span style={{ color: "rgba(255,255,255,0.08)" }}>|</span>
          <h1
            style={{
              fontFamily: "'Ethnocentric', monospace",
              fontSize: "14px",
              letterSpacing: "0.1em",
              color: TEXT,
              textTransform: "uppercase",
            }}
          >
            The Vault
          </h1>
        </div>

        <div
          className="flex items-center gap-1 p-1"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "10px" }}
        >
          {(["add", "manage"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              aria-pressed={tab === t}
              style={{
                padding: "8px 16px",
                borderRadius: "7px",
                border: "none",
                background: tab === t ? "rgba(46,110,245,0.12)" : "transparent",
                color: tab === t ? ACCENT : MUTED,
                fontFamily: MONO,
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "background 0.15s, color 0.15s",
              }}
            >
              {t === "add" ? "Add Component" : "Manage"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleSignOut}
            style={{
              padding: "6px 12px",
              borderRadius: "7px",
              border: "1px solid rgba(255,255,255,0.08)",
              background: "transparent",
              color: MUTED,
              fontFamily: MONO,
              fontSize: "9px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "color 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = TEXT)}
            onMouseLeave={e => (e.currentTarget.style.color = MUTED)}
          >
            Sign Out
          </button>
          <div
            className="flex items-center gap-2"
            style={{ fontSize: "10px", color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase" }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: ACCENT }}
            />
            Admin
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {tab === "add" ? <AddComponentView /> : <ManageView />}
      </div>
    </div>
  );
}

// ─── PAGE ──────────────────────────────────────────────────────────
export default function VaultAdminPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUnlocked(!!data.session);
      setChecking(false);
    });

    // Keeps `unlocked` in sync with real auth state — Sign Out (or an
    // expired token) flips this back to false with no extra wiring.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUnlocked(!!session);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (checking) return null;

  if (!unlocked) {
    return <PasswordGate onUnlock={() => setUnlocked(true)} />;
  }

  return <AdminShell />;
}