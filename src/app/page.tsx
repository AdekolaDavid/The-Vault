import { supabase } from '@/lib/supabaseClient';
import HubGallery from '@/components/HubGallery';
import VaultHero from '@/components/VaultHero';

export const revalidate = 0;

export default async function Home() {
  const { data: components, error } = await supabase
    .from('components')
    .select('id, title, style_system, category, dependencies, code_snippet, css_tokens, interaction_type');

  if (error) {
    return (
      <main style={{ background: '#050608', minHeight: '100vh', color: '#ef4444', padding: '2rem', fontFamily: 'monospace' }}>
        Error loading components: {error.message}
      </main>
    );
  }

  return (
    <main style={{ background: '#050608' }}>
      <VaultHero />
      <div id="gallery">
        <HubGallery components={components || []} />
      </div>
    </main>
  );
}