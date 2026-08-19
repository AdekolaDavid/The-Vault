"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-6 pt-4">
      <nav
        className="flex items-center justify-between w-full transition-all duration-300"
        style={{
          maxWidth: "780px",
          height: "52px",
          padding: "0 20px",
          borderRadius: "100px",
          background: "rgba(12,14,18,0.85)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
        }}
      >
        <Link
          href="/"
          className="font-black uppercase tracking-widest transition-colors duration-200"
          style={{
            fontFamily: "'Ethnocentric', monospace",
            fontSize: "13px",
            color: "#ffffff",
            letterSpacing: "0.15em",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "#2e6ef5")}
          onMouseLeave={e => (e.currentTarget.style.color = "#ffffff")}
        >
          The Vault
        </Link>
      </nav>
    </header>
  );
}