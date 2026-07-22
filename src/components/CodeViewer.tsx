"use client";

import { useState } from "react";

export default function CodeViewer({ html, css }: { html: string; css: string }) {
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [copiedCss, setCopiedCss] = useState(false);

  const handleCopy = (text: string, type: 'html' | 'css') => {
    navigator.clipboard.writeText(text);
    if (type === 'html') {
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2000);
    } else {
      setCopiedCss(true);
      setTimeout(() => setCopiedCss(false), 2000);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* HTML BOX */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">HTML</h3>
          <button 
            onClick={() => handleCopy(html, 'html')} 
            className="text-xs font-bold text-white bg-[#171717] border border-neutral-800 px-3 py-1.5 rounded-md hover:bg-neutral-800 transition-colors"
          >
            {copiedHtml ? "✓ Copied" : "Copy HTML"}
          </button>
        </div>
        <pre className="flex-1 bg-[#171717] p-4 rounded-xl overflow-x-auto text-sm font-mono text-neutral-300 border border-neutral-800 shadow-inner">
          <code>{html}</code>
        </pre>
      </div>

      {/* CSS BOX */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">CSS</h3>
          <button 
            onClick={() => handleCopy(css, 'css')} 
            className="text-xs font-bold text-white bg-[#171717] border border-neutral-800 px-3 py-1.5 rounded-md hover:bg-neutral-800 transition-colors"
          >
            {copiedCss ? "✓ Copied" : "Copy CSS"}
          </button>
        </div>
        <pre className="flex-1 bg-[#171717] p-4 rounded-xl overflow-x-auto text-sm font-mono text-neutral-300 border border-neutral-800 shadow-inner">
          <code>{css}</code>
        </pre>
      </div>
    </div>
  );
}