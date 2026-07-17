'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

interface WatchPlayerProps {
  animeId: number;
  title: string;
  malId: number | null;
  tmdbId: string | null;
  imdbId: string | null;
  episode: number;
  totalEpisodes: number;
  format: string | null;
  initialDub: boolean;
}

interface ServerOption {
  id: string;
  name: string;
  url: string;
}

export default function WatchPlayer({
  animeId,
  title,
  malId,
  tmdbId,
  imdbId,
  episode,
  totalEpisodes,
  format,
  initialDub,
}: WatchPlayerProps) {
  const [isDub, setIsDub] = useState(initialDub);
  const subOrDub = isDub ? 'dub' : 'sub';
  const isMovie = format === 'MOVIE';

  // Construct active server sources dynamically based on available IDs
  const servers = useMemo<ServerOption[]>(() => {
    const list: ServerOption[] = [];
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || '';

    // Server 1: VidLink MAL-based (natively resolves Vidstream/GogoPlay, MyCloud, Filemoon sources)
    if (malId) {
      list.push({
        id: 'vidlink-mal',
        name: 'VidLink (MAL)',
        url: `${base}/anime/${malId}/${episode}/${subOrDub}?primaryColor=00f5d4&icons=vid`,
      });
    }

    // Server 2: VidLink TMDb-based
    if (tmdbId) {
      list.push({
        id: 'vidlink-tmdb',
        name: 'VidLink (TMDb)',
        url: isMovie
          ? `${base}/movie/${tmdbId}?primaryColor=00f5d4&icons=vid`
          : `${base}/tv/${tmdbId}/1/${episode}?primaryColor=00f5d4&icons=vid`,
      });
    }

    // Server 3: VidSrc.to (high-speed TMDb mirror)
    if (tmdbId) {
      list.push({
        id: 'vidsrc-to',
        name: 'VidSrc.to',
        url: isMovie
          ? `https://vidsrc.to/embed/movie/${tmdbId}`
          : `https://vidsrc.to/embed/tv/${tmdbId}/1/${episode}`,
      });
    }

    // Server 4: VidSrc.xyz (TMDb-focused streaming engine)
    if (tmdbId) {
      list.push({
        id: 'vidsrc-xyz',
        name: 'VidSrc.xyz',
        url: isMovie
          ? `https://vidsrc.xyz/embed/movie/${tmdbId}`
          : `https://vidsrc.xyz/embed/tv/${tmdbId}/1/${episode}`,
      });
    }

    // Server 5: Embed.su (highly stable multi-source mirror)
    if (tmdbId) {
      list.push({
        id: 'embed-su',
        name: 'Embed.su',
        url: isMovie
          ? `https://embed.su/embed/movie/${tmdbId}`
          : `https://embed.su/embed/tv/${tmdbId}/1/${episode}`,
      });
    }

    return list;
  }, [malId, tmdbId, episode, subOrDub, isMovie]);

  const [activeServerId, setActiveServerId] = useState<string>(
    servers.length > 0 ? servers[0].id : ''
  );

  const activeServer = useMemo(() => {
    return servers.find((s) => s.id === activeServerId) || servers[0];
  }, [servers, activeServerId]);

  // Prev & Next navigation configuration
  const prevEp = episode > 1 ? episode - 1 : null;
  const nextEp = episode < totalEpisodes ? episode + 1 : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Server selection buttons row */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginRight: '4px' }}>
            SERVERS:
          </span>
          {servers.map((srv) => (
            <button
              key={srv.id}
              onClick={() => setActiveServerId(srv.id)}
              style={{
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: '6px',
                cursor: 'pointer',
                border: '1px solid var(--border-subtle)',
                transition: 'all 0.15s ease',
                backgroundColor: activeServerId === srv.id ? 'var(--accent-glow)' : 'rgba(255,255,255,0.03)',
                color: activeServerId === srv.id ? 'var(--accent)' : 'var(--text-secondary)',
                borderColor: activeServerId === srv.id ? 'rgba(0, 245, 212, 0.3)' : 'var(--border-subtle)',
              }}
            >
              {srv.name}
            </button>
          ))}
          {servers.length === 0 && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No backup streaming servers found</span>
          )}
        </div>
        
        {activeServerId.startsWith('vidlink') && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', margin: '2px 0 0' }}>
            <span style={{ color: 'var(--accent)' }}>💡 Tip:</span> 
            If player displays an error, click the <b>&quot;Server&quot; settings icon</b> inside the video player to switch between <b>Vidstream</b>, <b>MyCloud</b>, and <b>Filemoon</b> mirrors.
          </p>
        )}
      </div>

      {/* Video Iframe Player Wrapper */}
      <div
        className="watch-player-wrap"
        style={{
          position: 'relative',
          width: '100%',
          paddingTop: '56.25%',
          background: '#000',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        {activeServer ? (
          <iframe
            src={activeServer.url}
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture"
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '20px', textAlign: 'center' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" style={{ opacity: 0.6 }}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Streaming Unavailable</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '340px' }}>
              We could not map this title to any of our third-party movie or anime resolver servers.
            </p>
          </div>
        )}
      </div>

      {/* Title block + Sub/Dub toggle */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          background: 'var(--bg-card)',
          padding: '1.25rem',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', display: 'inline' }}>
              {title}
            </h1>
            <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
              — Episode {episode}
            </span>
          </div>

          {/* Sub/Dub Quick Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => setIsDub(false)}
              className={`dub-toggle-btn ${!isDub ? 'active-lang' : ''}`}
            >
              SUB
            </button>
            <button
              onClick={() => setIsDub(true)}
              className={`dub-toggle-btn ${isDub ? 'active-lang' : ''}`}
            >
              DUB
            </button>
          </div>
        </div>

        {/* Navigation buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
          {prevEp ? (
            <Link href={`/watch/${animeId}/${prevEp}?dub=${isDub}`} className="btn-ghost" style={{ fontSize: '0.85rem', padding: '8px 16px' }}>
              ← Prev Episode
            </Link>
          ) : (
            <span style={{ color: 'var(--text-muted)', cursor: 'not-allowed', background: 'rgba(255,255,255,0.02)', padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem', border: '1px solid transparent' }}>
              ← Prev Episode
            </span>
          )}

          {nextEp ? (
            <Link href={`/watch/${animeId}/${nextEp}?dub=${isDub}`} className="btn-accent" style={{ fontSize: '0.85rem', padding: '8px 20px' }}>
              Next Episode →
            </Link>
          ) : (
            <span style={{ color: 'var(--text-muted)', cursor: 'not-allowed', background: 'rgba(255,255,255,0.02)', padding: '8px 20px', borderRadius: '8px', fontSize: '0.85rem', border: '1px solid transparent' }}>
              Next Episode →
            </span>
          )}
        </div>

        {/* External fallback block */}
        <div style={{ marginTop: '10px', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            ⚠️ Issues with the player? Try external mirror search:
          </span>
          <a
            href={`https://gogoanime3.co/search.html?keyword=${encodeURIComponent(title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost"
            style={{ fontSize: '0.75rem', padding: '6px 12px', color: 'var(--accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
          >
            Search Gogoanime ↗
          </a>
        </div>
      </div>
    </div>
  );
}
