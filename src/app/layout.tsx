import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'AniStream — Watch Anime Online Free',
  description: 'Stream thousands of anime series and movies in HD. Sub and dub available. No ads, no sign-up required.',
  keywords: 'anime, watch anime, anime streaming, free anime, sub, dub, HD',
  openGraph: {
    title: 'AniStream — Watch Anime Online Free',
    description: 'Stream thousands of anime series and movies in HD.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main style={{ minHeight: '100vh' }}>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
