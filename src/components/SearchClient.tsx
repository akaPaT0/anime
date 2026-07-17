'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import { AnilistCardData, ANILIST_GENRES, searchAnimeClient } from '@/lib/anilist';
import AnimeCard from '@/components/AnimeCard';

interface SearchClientProps {
  initialResults: AnilistCardData[];
  initialQuery: string;
  initialGenre: string;
}

export default function SearchClient({
  initialResults,
  initialQuery,
  initialGenre,
}: SearchClientProps) {
  const [query, setQuery] = useState(initialQuery);
  const [selectedGenre, setSelectedGenre] = useState(initialGenre);
  const [results, setResults] = useState<AnilistCardData[]>(initialResults);
  const [sortBy, setSortBy] = useState<'popularity' | 'score' | 'title'>('popularity');
  const [isPending, startTransition] = useTransition();
  const [isSearching, setIsSearching] = useState(false);

  // Debounced client-side instant search
  useEffect(() => {
    // If query is empty, fall back to initial server-side results
    if (!query.trim()) {
      setResults(initialResults);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        // Fetch up to 30 items for instant search results
        const clientResults = await searchAnimeClient(query, 30);
        startTransition(() => {
          setResults(clientResults);
        });
      } catch (err) {
        console.error('Instant search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [query, initialResults]);

  // Client-side filtering & sorting
  const processedResults = useMemo(() => {
    let filtered = [...results];

    // Filter by genre client-side
    if (selectedGenre) {
      filtered = filtered.filter((anime) =>
        anime.genres.some((g) => g.toLowerCase() === selectedGenre.toLowerCase())
      );
    }

    // Sort client-side
    filtered.sort((a, b) => {
      if (sortBy === 'score') {
        return (b.score ?? 0) - (a.score ?? 0);
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      // Popularity (default) - popular anime are fetched first, so preserve ordering
      return 0;
    });

    return filtered;
  }, [results, selectedGenre, sortBy]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Search Input Control */}
      <div style={{ position: 'relative', maxWidth: '600px', display: 'flex', alignItems: 'center' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search anime titles instantly..."
          className="search-input"
          style={{ paddingLeft: '40px', paddingRight: '40px' }}
        />
        {/* Search Icon */}
        <span style={{ position: 'absolute', left: '14px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
        </span>
        {/* Clear Button */}
        {query && (
          <button
            onClick={() => setQuery('')}
            style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
            aria-label="Clear search"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Genre Filter Horizontal Scroll */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '6px',
          scrollbarWidth: 'none',
        }}
        className="genre-scroll"
      >
        <style dangerouslySetInnerHTML={{ __html: `
          .genre-scroll::-webkit-scrollbar { display: none; }
        `}} />
        <button
          onClick={() => setSelectedGenre('')}
          className={`genre-pill ${!selectedGenre ? 'active' : ''}`}
        >
          All Genres
        </button>
        {ANILIST_GENRES.map((genre) => (
          <button
            key={genre}
            onClick={() => setSelectedGenre(selectedGenre === genre ? '' : genre)}
            className={`genre-pill ${selectedGenre === genre ? 'active' : ''}`}
          >
            {genre}
          </button>
        ))}
      </div>

      {/* Sort Options & Result Count */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {isSearching || isPending ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="spinner" style={{ width: '12px', height: '12px', borderWidth: '2px' }} />
              Searching database...
            </span>
          ) : (
            `Showing ${processedResults.length} result${processedResults.length !== 1 ? 's' : ''}`
          )}
        </p>

        {/* Sort triggers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>SORT BY:</span>
          {(['popularity', 'score', 'title'] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setSortBy(opt)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '0.8rem',
                fontWeight: sortBy === opt ? 700 : 500,
                color: sortBy === opt ? 'var(--accent)' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'color 0.15s',
              }}
            >
              {opt.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Results */}
      {processedResults.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '4rem 1rem', textAlign: 'center' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>No results found</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {query ? `We couldn't find anything matching "${query}"` : 'No anime available for this filter.'}
          </p>
        </div>
      ) : (
        <div className="anime-grid fade-in-up">
          {processedResults.map((anime) => (
            <AnimeCard key={anime.id} anime={anime} />
          ))}
        </div>
      )}
    </div>
  );
}
