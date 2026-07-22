"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [view, setView] = useState<'sign-in' | 'sign-up' | 'verify'>('sign-in');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [otp, setOtp] = useState("");  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const router = useRouter();

  // Initialize Supabase client for the browser
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username } // Passed to the database trigger
        }
      });
      if (error) throw error;
      setView('verify'); // Switch to OTP screen
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center p-4 text-white font-sans selection:bg-blue-500/30">
      <div className="w-full max-w-md bg-[#09090b] border border-neutral-800 shadow-[0_0_40px_rgba(59,130,246,0.05)] p-8 relative overflow-hidden">
        
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-purple-600"></div>

        <div className="mb-8">
          <h1 className="text-2xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-400">
            Vault_Access
          </h1>
          <p className="text-xs text-neutral-500 font-mono mt-2 uppercase">
            {view === 'sign-up' && "INITIALIZE NEW OPERATOR"}
            {view === 'sign-in' && "AUTHENTICATE SESSION"}
            {view === 'verify' && "VERIFY SECURE TRANSMISSION"}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-950/30 border border-red-900 text-red-400 text-xs font-mono">
            ERROR: {error}
          </div>
        )}

        {/* --- SIGN UP FLOW --- */}
        {view === 'sign-up' && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase text-neutral-400 mb-1">Username</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full bg-[#000000] border border-neutral-800 p-2.5 text-sm focus:outline-none focus:border-blue-500 text-white" placeholder="developer_01" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-neutral-400 mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-[#000000] border border-neutral-800 p-2.5 text-sm focus:outline-none focus:border-blue-500 text-white" placeholder="operator@system.io" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-neutral-400 mb-1">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-[#000000] border border-neutral-800 p-2.5 pr-10 text-sm focus:outline-none focus:border-blue-500 text-white" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors text-xs font-mono uppercase tracking-wider">
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs py-3 border border-blue-400 transition-all shadow-[0_0_15px_rgba(37,99,235,0.2)] disabled:opacity-50">
              {loading ? "PROCESSING..." : "REQUEST ACCESS"}
            </button>
            <div className="text-center mt-4">
              <button type="button" onClick={() => { setView('sign-in'); setError(null); }} className="text-xs text-neutral-500 hover:text-white transition-colors">Already registered? Authenticate here.</button>
            </div>
          </form>
        )}

        {/* --- SIGN IN FLOW --- */}
        {view === 'sign-in' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase text-neutral-400 mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-[#000000] border border-neutral-800 p-2.5 text-sm focus:outline-none focus:border-blue-500 text-white" placeholder="operator@system.io" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-neutral-400 mb-1">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-[#000000] border border-neutral-800 p-2.5 pr-10 text-sm focus:outline-none focus:border-blue-500 text-white" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors text-xs font-mono uppercase tracking-wider">
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs py-3 border border-blue-400 transition-all shadow-[0_0_15px_rgba(37,99,235,0.2)] disabled:opacity-50">
              {loading ? "PROCESSING..." : "ENTER VAULT"}
            </button>
            <div className="text-center mt-4">
              <button type="button" onClick={() => { setView('sign-up'); setError(null); }} className="text-xs text-neutral-500 hover:text-white transition-colors">Need an access node? Initialize here.</button>
            </div>
          </form>
        )}

        {/* --- MAGIC LINK WAITING SCREEN --- */}
        {view === 'verify' && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-900/10 border border-blue-900/50">
              <p className="text-xs text-blue-400 font-mono text-center leading-relaxed">
                ACCESS REQUEST TRANSMITTED<br /><br />
                A sign-in link has been sent to<br />
                <span className="text-white font-bold">{email}</span><br /><br />
                Click the link in your email to complete signup. You can close this tab.
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setView('sign-in'); setError(null); }}
              className="w-full mt-2 bg-transparent text-neutral-500 hover:text-white font-black uppercase tracking-widest text-xs py-3 border border-neutral-800 hover:border-neutral-600 transition-all"
            >
              Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}