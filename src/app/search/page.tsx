import type { Metadata } from 'next';
import { searchAnimeServer } from '@/lib/anilist';
import SearchClient from '@/components/SearchClient';

export const metadata: Metadata = {
  title: 'Browse Anime — AniStream',
  description: 'Search and discover thousands of anime instantly.',
};

interface SearchPageProps {
  searchParams: Promise<{ q?: string; genre?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, genre } = await searchParams;
  const genres = genre ? [genre] : undefined;

  // Prefetch first page from AniList server-side so it loads instantly with SSR
  const { results } = await searchAnimeServer(q || '', 1, genres, 30).catch(() => ({
    results: [],
    hasNext: false,
    total: 0,
  }));

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <h1
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
          fontWeight: 800,
          color: 'var(--text-primary)',
          marginBottom: '1.5rem',
        }}
      >
        Browse <span style={{ color: 'var(--accent)' }}>Anime</span>
      </h1>
      <SearchClient
        initialResults={results}
        initialQuery={q || ''}
        initialGenre={genre || ''}
      />
    </div>
  );
}
