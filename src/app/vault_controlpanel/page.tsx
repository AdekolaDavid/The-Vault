"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { verifyAdminPassword } from "./actions";

const CATEGORIES = ["Buttons", "Checkboxes", "Toggle switches", "Cards", "Loaders", "Inputs", "Radio buttons", "Forms"];
const INTERACTION_TYPES = ["passive", "clickable", "hoverable", "inputable"];
const STYLE_SYSTEMS = ["HTML", "CSS", "HTML + CSS"];

const OBSIDIAN = "#050608";
const CARD = "#0c0e12";
const ACCENT = "#2e6ef5";
const MUTED = "#424a57";
const TEXT = "#ffffff";
const MONO = "JetBrains Mono, monospace";

const MAX_ATTEMPTS = 3;
const SESSION_KEY = "vault_admin_unlocked";

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

    const valid = await verifyAdminPassword(password);

    if (valid) {
      sessionStorage.setItem(SESSION_KEY, "1");
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
              color: "#ef4444",
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

// ─── ADMIN PANEL ───────────────────────────────────────────────────
function AdminPanel() {
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
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: OBSIDIAN, color: TEXT, fontFamily: MONO }}
    >
      {/* LEFT PANEL */}
      <div
        className="flex flex-col w-1/2 h-full"
        style={{ borderRight: "1px solid rgba(255,255,255,0.05)" }}
      >
        {/* Header */}
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
              Add Component
            </h1>
          </div>
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

        {/* Scrollable form */}
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
                color: message.type === "success" ? ACCENT : "#ef4444",
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

// ─── PAGE ──────────────────────────────────────────────────────────
export default function VaultAdminPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if already unlocked this session
    const isUnlocked = sessionStorage.getItem(SESSION_KEY) === "1";
    setUnlocked(isUnlocked);
    setChecking(false);
  }, []);

  if (checking) return null;

  if (!unlocked) {
    return <PasswordGate onUnlock={() => setUnlocked(true)} />;
  }

  return <AdminPanel />;
}
