"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

const CATEGORIES = ["Buttons", "Checkboxes", "Toggle switches", "Cards", "Loaders", "Inputs", "Radio buttons", "Forms"];
const INTERACTION_TYPES = ["passive", "clickable", "hoverable", "inputable"];

export default function AdminPage() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [htmlCode, setHtmlCode] = useState("");
  const [cssCode, setCssCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [interactionType, setInteractionType] = useState(INTERACTION_TYPES[0]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const { error } = await supabase.from("components").insert({
        id: crypto.randomUUID(),
        title: title.trim(),
        style_system: "html-css", // Tagged as pure HTML/CSS
        category,
        code_snippet: htmlCode, // Saves to the HTML column
        css_tokens: cssCode,    // Saves to the CSS column
        dependencies: [],       // No external dependencies needed anymore!
        interaction_type: interactionType,
      });

      if (error) throw error;

      setMessage("Component locked into Vault successfully!");
      setTitle("");
      setHtmlCode("");
      setCssCode("");
      setInteractionType(INTERACTION_TYPES[0]);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // This perfectly mimics the native iframe we built on the homepage
  const srcDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: transparent;
            overflow: hidden;
          }
          ${cssCode}
        </style>
      </head>
      <body>
        ${htmlCode || '<p style="font-family: monospace; color: #666;">Live preview will appear here...</p>'}
      </body>
    </html>
  `;

  return (
    <div className="flex min-h-screen bg-[#09090b] text-white font-sans flex-col md:flex-row">
      
      {/* LEFT PANEL: The Input Form */}
      <div className="w-full md:w-1/2 p-8 overflow-y-auto border-r border-neutral-800 bg-[#09090b]">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="text-neutral-500 hover:text-white transition-colors text-sm font-medium">
            ← Back to Hub
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Add UI Element</h1>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-6">
          <div>
            <label className="block text-sm font-bold text-neutral-400 mb-2 uppercase tracking-wide">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#171717] border border-neutral-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-neutral-500 transition-colors shadow-inner"
              placeholder="e.g. Cyberpunk Glitch Button"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-neutral-400 mb-2 uppercase tracking-wide">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#171717] border border-neutral-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-neutral-500 transition-colors shadow-inner"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
           
           <div>
            <label className="block text-sm font-bold text-neutral-400 mb-2 uppercase tracking-wide">Interaction Type</label>
            <select
              value={interactionType}
              onChange={(e) => setInteractionType(e.target.value)}
              className="w-full bg-[#171717] border border-neutral-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-neutral-500 transition-colors shadow-inner"
            >
             {INTERACTION_TYPES.map((type) => (
               <option key={type} value={type}>{type}</option>
             ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-neutral-400 mb-2 uppercase tracking-wide flex justify-between">
              HTML
              <span className="text-neutral-600 font-normal lowercase">pure html only</span>
            </label>
            <textarea
              required
              value={htmlCode}
              onChange={(e) => setHtmlCode(e.target.value)}
              className="w-full h-48 bg-[#171717] border border-neutral-800 rounded-lg p-4 text-sm text-white font-mono focus:outline-none focus:border-neutral-500 transition-colors shadow-inner resize-y"
              placeholder="<button class='my-btn'>\n  Hover me\n</button>"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-neutral-400 mb-2 uppercase tracking-wide flex justify-between">
              CSS
              <span className="text-neutral-600 font-normal lowercase">no external frameworks</span>
            </label>
            <textarea
              value={cssCode}
              onChange={(e) => setCssCode(e.target.value)}
              className="w-full h-64 bg-[#171717] border border-neutral-800 rounded-lg p-4 text-sm text-white font-mono focus:outline-none focus:border-neutral-500 transition-colors shadow-inner resize-y"
              placeholder=".my-btn {\n  background: #fff;\n  color: #000;\n  padding: 10px 20px;\n  border-radius: 8px;\n  transition: all 0.3s ease;\n}\n\n.my-btn:hover {\n  transform: scale(1.05);\n}"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-white text-black font-bold py-3.5 rounded-lg hover:bg-neutral-200 transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 mt-4 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            {saving ? "Locking..." : "Save to Vault"}
          </button>

          {message && (
            <div className={`p-4 rounded-lg text-sm font-medium ${message.includes("Error") ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-green-500/10 text-green-400 border border-green-500/20"}`}>
              {message}
            </div>
          )}
        </form>
      </div>

      {/* RIGHT PANEL: The Live UIverse Preview */}
      <div className="hidden md:flex w-full md:w-1/2 flex-col bg-[#171717] border-l border-neutral-800">
        <div className="p-4 border-b border-neutral-800 bg-[#09090b] flex items-center justify-between">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Live Render Engine
          </span>
        </div>
        
        {/* The beautiful UIverse radial dot grid */}
        <div className="flex-1 relative bg-[#09090b] bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] overflow-hidden">
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