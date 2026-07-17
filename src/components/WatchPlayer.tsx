'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface WatchPlayerProps {
  animeId: number;
  title: string;
  episode: number;
  totalEpisodes: number;
  initialDub: boolean;
  malId: number | null;
  tmdbId: string | null;
  isMovie: boolean;
  routeId: string;
}

export default function WatchPlayer({
  animeId,
  title,
  episode,
  totalEpisodes,
  initialDub,
  malId,
  routeId,
}: WatchPlayerProps) {
  const [isDub, setIsDub] = useState(initialDub);
  const [tmdbId, setTmdbId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch TMDB ID from ani.zip using AniList ID on mount / change
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    fetch(`https://api.ani.zip/mappings?anilist_id=${animeId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Network response error');
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        const mappedTmdbId = data?.mappings?.themoviedb_id;
        if (mappedTmdbId) {
          setTmdbId(String(mappedTmdbId));
          setLoading(false);
        } else {
          throw new Error('TMDB ID not found in mappings');
        }
      })
      .catch((err) => {
        if (!active) return;
        console.error('[WatchPlayer] Failed to load TMDB mapping:', err);
        setError('Mapping Error');
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [animeId]);
  
  // 1. Hardcoded array of working production servers using user templates
  const servers = tmdbId ? [
    {
      id: 'vidlink-tv',
      name: 'VidLink (TV)',
      url: `https://vidlink.pro/tv/${tmdbId}/1/${episode}?primaryColor=00f5d4`,
    },
    {
      id: 'vidsrc-to',
      name: 'VidSrc.to',
      url: `https://vidsrc.to/embed/tv/${tmdbId}/1/${episode}`,
    },
    {
      id: 'embed-su',
      name: 'Embed.su',
      url: `https://embed.su/embed/tv/${tmdbId}/1/${episode}`,
    }
  ] : [];

  // 2. Instant state update for active server
  const [activeServerId, setActiveServerId] = useState<string>('vidlink-tv');

  const activeServer = servers.find((s) => s.id === activeServerId) || servers[0] || null;

  const prevEp = episode > 1 ? episode - 1 : null;
  const nextEp = episode < totalEpisodes ? episode + 1 : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Temporary ID Debug Box */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '8px',
        padding: '12px',
        fontFamily: 'monospace',
        fontSize: '0.8rem',
        color: 'var(--text-secondary)'
      }}>
        <div style={{ fontWeight: 'bold', color: 'var(--accent)', marginBottom: '6px' }}>🛠️ ID Debug Information</div>
        <div>• AniList ID: {animeId}</div>
        <div>• MAL ID: {malId || 'null (Not Resolved)'}</div>
        <div>• Current Route ID: {routeId}</div>
        <div>• Mapped TMDB ID: {tmdbId || (loading ? 'Loading...' : 'None')}</div>
      </div>

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
          {!loading && !error && servers.length === 0 && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No TMDB servers available</span>
          )}
        </div>
      </div>

      {/* Debug Info */}
      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', wordBreak: 'break-all', fontFamily: 'monospace' }}>
        <strong>[Debug Iframe Src]:</strong> {activeServer?.url || 'No active server'}
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
        {loading ? (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner text-teal-400" style={{ borderTopColor: '#00f5d4' }} />
          </div>
        ) : error ? (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="text-orange-500" style={{ fontWeight: 600 }}>{error}</span>
          </div>
        ) : activeServer ? (
          <iframe
            key={activeServer.id}
            src={activeServer.url}
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture"
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
          />
        ) : null}
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
      </div>
    </div>
  );
}
