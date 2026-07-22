import { supabase } from '@/lib/supabaseClient'; // Make sure this matches your supabase file!
import { notFound } from 'next/navigation';
import CodeViewer from '@/components/CodeViewer'; 
import Link from 'next/link';

// Next.js now requires params to be a Promise
export default async function ViewComponent({ params }: { params: Promise<{ id: string }> }) {
  // Await the params to get the ID safely
  const resolvedParams = await params;
  
  const { data: component } = await supabase
    .from('components')
    .select('*')
    .eq('id', resolvedParams.id)
    .single();

  if (!component) notFound();

  return (
    <main className="min-h-screen bg-[#09090b] text-white font-sans flex flex-col">
      {/* HEADER */}
      <header className="border-b border-neutral-800 p-6 flex items-center justify-between bg-[#09090b]/90 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-neutral-500 hover:text-white transition-colors text-sm font-medium">
            ← Back to Elements
          </Link>
          <span className="w-px h-6 bg-neutral-800"></span>
          <h1 className="text-xl font-bold tracking-tight capitalize">{component.title}</h1>
          <span className="text-[10px] font-bold px-2 py-1 bg-[#171717] text-neutral-400 uppercase rounded tracking-wider border border-neutral-800">
            {component.category}
          </span>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="flex-1 p-8 max-w-6xl mx-auto w-full">
        {/* The Live Render Engine for the specific component */}
        <div className="w-full h-64 md:h-96 rounded-2xl border border-neutral-800 bg-[#171717] overflow-hidden mb-8 relative shadow-2xl">
          <div className="absolute inset-0 bg-[#09090b] bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px]">
            <iframe
              srcDoc={`
                <!DOCTYPE html>
                <html>
                  <head>
                    <style>
                      body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: transparent; overflow: hidden; }
                      ${component.css_tokens || ''}
                    </style>
                  </head>
                  <body>
                    ${component.code_snippet || '<p style="color: #666;">No preview</p>'}
                  </body>
                </html>
              `}
              title={component.title}
              className="absolute inset-0 w-full h-full border-none"
              sandbox="allow-scripts"
            />
          </div>
        </div>

        {/* The Code Copy Section */}
        <CodeViewer html={component.code_snippet} css={component.css_tokens} />
      </div>
    </main>
  );
}