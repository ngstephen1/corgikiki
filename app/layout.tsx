import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
  applicationName: 'CorgiKiki',
  title: 'CorgiKiki — Your AI Architecture Sketching Buddy',
  description: 'Learn architectural sketching with guided exercises, AI drawing feedback, and a friendly corgi coach.',
  openGraph: {
    title: 'CorgiKiki — Your AI Architecture Sketching Buddy',
    description: 'Sketch with confidence. Learn with feedback. Explore where your skills could take you.',
    siteName: 'CorgiKiki',
    type: 'website'
  },
  twitter: { card: 'summary_large_image' }
};

export const viewport: Viewport = { themeColor: '#fbf7f1' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
