import type { Metadata, Viewport } from 'next';
import { invitation } from '../data/invitation';
import { siteUrl } from '../lib/site-url.mjs';
import './globals.css';

const origin = siteUrl();
const description = `${invitation.date} ${invitation.time} · ${invitation.venue}. ${invitation.greeting.replace(/\n/g, ' ')}`;

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };
export const metadata: Metadata = {
  metadataBase: new URL(origin),
  title: `${invitation.couple} | 모바일 청첩장`,
  description,
  openGraph: {
    title: `${invitation.couple} 결혼식에 초대합니다`,
    description,
    type: 'website',
    url: origin,
    images: [{ url: `${origin}/og.png`, width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image', images: [`${origin}/og.png`] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
