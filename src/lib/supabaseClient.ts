import { createClient } from "@supabase/supabase-js";

// These are the PUBLIC anon key + URL — safe to expose client-side.
// Row Level Security policies on `components` table are what actually
// protect the data. As of Session 11, insert/delete are scoped to the
// authenticated admin account via `auth.uid()` — see HANDOFF.md.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      // sessionStorage, not the default localStorage: signs you out when
      // the tab/browser closes, matching the old sessionStorage-flag
      // behavior. Switch to the default (omit `storage`) if you'd rather
      // stay signed in across restarts.
      storage: typeof window !== "undefined" ? window.sessionStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

export type ComponentRow = {
  id: string;
  title: string;
  style_system: string;
  category: string;
  code_snippet: string;
  dependencies: string[];
  css_tokens: string;
};