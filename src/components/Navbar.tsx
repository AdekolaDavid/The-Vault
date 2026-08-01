"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

const ACCENT = "#2e6ef5";
const BG = "#050608";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) checkAdminRole(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminRole(session.user.id);
      } else {
        setIsAdmin(false);
      }
    });

    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  async function checkAdminRole(userId: string) {
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();
    setIsAdmin(data?.role === "admin");
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-6 pt-4">
      <nav
        className="flex items-center justify-between w-full transition-all duration-300"
        style={{
          maxWidth: "780px",
          height: "52px",
          padding: "0 20px",
          borderRadius: "100px",
          background: scrolled
            ? "rgba(5,6,8,0.92)"
            : "rgba(12,14,18,0.85)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow: scrolled
            ? "0 8px 32px rgba(0,0,0,0.4)"
            : "0 4px 24px rgba(0,0,0,0.2)",
        }}
      >
        {/* Brand */}
        <Link
          href="/"
          className="font-black uppercase tracking-widest transition-colors duration-200"
          style={{
            fontFamily: "'Ethnocentric', monospace",
            fontSize: "13px",
            color: "#ffffff",
            letterSpacing: "0.15em",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = ACCENT)}
          onMouseLeave={e => (e.currentTarget.style.color = "#ffffff")}
        >
          The Vault
        </Link>

        {/* Center links — admin only */}
        {isAdmin && (
          <Link
            href="/admin"
            className="text-[11px] font-bold uppercase tracking-widest transition-colors duration-200"
            style={{ color: "rgba(255,255,255,0.4)", fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.1em" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#ffffff")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
          >
            Admin
          </Link>
        )}

        {/* Right side */}
        {user ? (
          <div className="relative group">
            <button
              className="flex items-center justify-center transition-all duration-200"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "100px",
                background: `rgba(46,110,245,0.15)`,
                border: `1px solid rgba(46,110,245,0.3)`,
                color: ACCENT,
                fontSize: "11px",
                fontWeight: 900,
                fontFamily: "JetBrains Mono, monospace",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = `rgba(46,110,245,0.25)`;
                e.currentTarget.style.borderColor = `rgba(46,110,245,0.6)`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = `rgba(46,110,245,0.15)`;
                e.currentTarget.style.borderColor = `rgba(46,110,245,0.3)`;
              }}
            >
              {initials}
            </button>

            {/* Dropdown */}
            <div
              className="absolute right-0 top-full mt-3 w-44 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150"
              style={{
                background: "#0c0e12",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              }}
            >
              <div
                className="px-4 py-3"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >
                <p
                  className="text-[10px] truncate"
                  style={{ color: "rgba(255,255,255,0.35)", fontFamily: "JetBrains Mono, monospace" }}
                >
                  {user.email}
                </p>
              </div>
              <Link
                href="/saved"
                className="block px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors"
                style={{ color: "rgba(255,255,255,0.6)", fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.08em" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#ffffff")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
              >
                Saved
              </Link>
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors"
                style={{ color: "rgba(239,68,68,0.7)", fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.08em" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(239,68,68,0.7)")}
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <Link
            href="/auth"
            className="text-[11px] font-bold uppercase tracking-widest transition-all duration-200"
            style={{
              padding: "8px 18px",
              borderRadius: "100px",
              border: `1px solid rgba(46,110,245,0.4)`,
              color: ACCENT,
              fontFamily: "JetBrains Mono, monospace",
              letterSpacing: "0.1em",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(46,110,245,0.12)";
              e.currentTarget.style.borderColor = `rgba(46,110,245,0.7)`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = `rgba(46,110,245,0.4)`;
            }}
          >
            Sign In
          </Link>
        )}
      </nav>
    </header>
  );
}