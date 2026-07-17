'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { searchAnimeClient, AnilistCardData, formatScore, formatFormat } from '@/lib/anilist';

export default function InstantSearch() {
  const [value, setValue] = useState('');
  const [results, setResults] = useState<AnilistCardData[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Instant search debounce handler
  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const data = await searchAnimeClient(trimmed, 8);
        setResults(data);
      } catch (err) {
        console.error('Instant search query error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [value]);

  // Click outside detection to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      router.push(`/search?q=${encodeURIComponent(value.trim())}`);
      setIsOpen(false);
    }
  }, [value, router]);

  const handleResultClick = useCallback(() => {
    setValue('');
    setIsOpen(false);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
      <form onSubmit={handleSubmit} style={{ width: '100%' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search anime..."
            className="search-input"
            style={{ paddingLeft: '36px', paddingRight: '36px', height: '38px', borderRadius: '20px', fontSize: '0.85rem' }}
          />
          {/* Search Icon */}
          <span style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </span>
          {/* Clear button */}
          {value && (
            <button
              type="button"
              onClick={() => {
                setValue('');
                setResults([]);
              }}
              style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </form>

      {/* Floating Results Dropdown */}
      {isOpen && value.trim().length >= 2 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            marginTop: '8px',
            right: 0,
            width: '360px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            zIndex: 100,
            overflow: 'hidden',
            maxHeight: '440px',
            overflowY: 'auto',
          }}
        >
          {loading ? (
            // Shimmer skeletons while loading
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div className="skeleton" style={{ width: '40px', height: '56px', borderRadius: '4px', flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
                    <div className="skeleton" style={{ height: '14px', width: '75%', borderRadius: '3px' }} />
                    <div className="skeleton" style={{ height: '10px', width: '40%', borderRadius: '3px' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div style={{ padding: '20px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No results for &quot;{value}&quot;
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {results.map((anime) => {
                const scoreStr = formatScore(anime.score);
                const formatStr = formatFormat(anime.format);
                const badgeClass = anime.format === 'MOVIE' ? 'badge badge-movie' : 'badge badge-tv';

                return (
                  <Link
                    key={anime.id}
                    href={`/anime/${anime.id}`}
                    onClick={handleResultClick}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '10px 12px',
                      borderBottom: '1px solid var(--border-subtle)',
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'background 0.15s',
                    }}
                    className="instant-result-item"
                  >
                    <style dangerouslySetInnerHTML={{ __html: `
                      .instant-result-item:hover { background: var(--bg-card-hover) !important; }
                    `}} />
                    {/* Poster */}
                    <div style={{ width: '40px', height: '56px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0 }}>
                      <img src={anime.image} alt={anime.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>

                    {/* Metadata */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px', overflow: 'hidden' }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {anime.title}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className={badgeClass} style={{ fontSize: '0.625rem', padding: '1px 5px' }}>
                          {formatStr}
                        </span>
                        {scoreStr && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--score-gold)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                            ★ {scoreStr}
                          </span>
                        )}
                        {anime.episodes !== null && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {anime.episodes} ep{anime.episodes !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}

              {/* View all results link */}
              <Link
                href={`/search?q=${encodeURIComponent(value.trim())}`}
                onClick={() => setIsOpen(false)}
                style={{
                  padding: '10px 12px',
                  textAlign: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--accent)',
                  textDecoration: 'none',
                  background: 'rgba(0, 245, 212, 0.02)',
                  transition: 'background 0.15s',
                }}
                className="instant-result-footer"
              >
                <style dangerouslySetInnerHTML={{ __html: `
                  .instant-result-footer:hover { background: rgba(0, 245, 212, 0.06) !important; }
                `}} />
                See all results for &quot;{value.trim()}&quot; →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
