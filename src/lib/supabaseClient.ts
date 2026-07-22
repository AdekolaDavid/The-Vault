import { createClient } from "@supabase/supabase-js";

// These are the PUBLIC anon key + URL — safe to expose client-side.
// Row Level Security policies on `components` table are what actually
// protect the data, not secrecy of this key.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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