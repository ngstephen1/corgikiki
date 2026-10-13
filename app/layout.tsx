import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CorgiKiki — Your AI Architecture Sketching Buddy',
  description: 'Learn architectural sketching one friendly line at a time.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
