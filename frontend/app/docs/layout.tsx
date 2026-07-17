import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { RootProvider } from 'fumadocs-ui/provider/next';
import type { ReactNode } from 'react';
import { source } from '@/lib/source';
import 'fumadocs-ui/style.css';
import 'katex/dist/katex.css';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <RootProvider theme={{ enabled: false }}>
      <DocsLayout tree={source.pageTree} nav={{ title: 'EduGap Docs' }}>
        {children}
      </DocsLayout>
    </RootProvider>
  );
}
