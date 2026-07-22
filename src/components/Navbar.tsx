"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
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

    return () => subscription.unsubscribe();
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
    <header className="sticky top-0 z-50 w-full border-b border-blue-900/40 bg-[#09090b]/90 backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-screen-2xl items-center justify-between px-6">

        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 group-hover:text-blue-300 transition-colors">
            Vault_System
          </span>
          <span className="hidden sm:inline-block text-[10px] text-neutral-600 font-mono">/ components</span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="text-[10px] font-black uppercase tracking-widest text-purple-400 hover:text-purple-300 border border-purple-500/40 hover:border-purple-400 px-3 py-1.5 transition-all"
                >
                  Admin
                </Link>
              )}

              <div className="relative group">
                <button className="flex items-center justify-center w-7 h-7 bg-blue-600/20 border border-blue-500/50 text-blue-300 text-[10px] font-black uppercase hover:bg-blue-600/40 transition-all">
                  {initials}
                </button>

                <div className="absolute right-0 top-full mt-1 w-40 bg-[#09090b] border border-neutral-800 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150">
                  <div className="px-3 py-2 border-b border-neutral-800">
                    <p className="text-[10px] text-neutral-400 font-mono truncate">{user.email}</p>
                  </div>
                  <Link
                    href="/saved"
                    className="block px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Saved Components
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          ) : (
            <Link
              href="/auth"
              className="relative text-[10px] font-black uppercase tracking-widest px-4 py-1.5 transition-all duration-300 overflow-hidden"
              style={{
                color: '#B6FF3B',
                border: '1px solid rgba(182,255,59,0.3)',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget;
                el.style.background = 'repeating-linear-gradient(45deg, #080808, #080808 6px, #0C1A2B 6px, #0C1A2B 12px)';
                el.style.borderColor = '#B6FF3B';
                el.querySelectorAll<HTMLSpanElement>('.nav-corner').forEach(c => { c.style.opacity = '1'; });
              }}
              onMouseLeave={e => {
                const el = e.currentTarget;
                el.style.background = 'transparent';
                el.style.borderColor = 'rgba(182,255,59,0.3)';
                el.querySelectorAll<HTMLSpanElement>('.nav-corner').forEach(c => { c.style.opacity = '0'; });
              }}
            >
              <span className="nav-corner absolute top-0.5 left-0.5 w-2 h-2 border-t border-l border-[#B6FF3B] transition-opacity duration-200" style={{ opacity: 0 }} />
              <span className="nav-corner absolute top-0.5 right-0.5 w-2 h-2 border-t border-r border-[#B6FF3B] transition-opacity duration-200" style={{ opacity: 0 }} />
              <span className="nav-corner absolute bottom-0.5 left-0.5 w-2 h-2 border-b border-l border-[#B6FF3B] transition-opacity duration-200" style={{ opacity: 0 }} />
              <span className="nav-corner absolute bottom-0.5 right-0.5 w-2 h-2 border-b border-r border-[#B6FF3B] transition-opacity duration-200" style={{ opacity: 0 }} />
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}