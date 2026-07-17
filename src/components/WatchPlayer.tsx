'use client';

import { useState } from 'react';
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
  
  // 1. Hardcoded array of working production servers using user templates
  // Using malId for the MAL route if available, otherwise falling back to animeId just in case
  const servers = [
    {
      id: 'vidlink-anilist',
      name: 'VidLink (AniList)',
      url: `https://vidlink.pro/anime/anilist/${animeId}/${episode}?primaryColor=00f5d4`,
    },
    {
      id: 'vidlink-mal',
      name: 'VidLink (MAL)',
      url: `https://vidlink.pro/anime/mal/${malId || animeId}/${episode}?primaryColor=00f5d4`,
    },
    {
      id: 'vidsrc-to',
      name: 'VidSrc.to',
      url: `https://vidsrc.to/embed/anime/${animeId}/${episode}`,
    },
    {
      id: 'embed-su',
      name: 'Embed.su',
      url: `https://embed.su/embed/anime/${animeId}/${episode}`,
    }
  ];

  // 2. Instant state update for active server
  const [activeServerId, setActiveServerId] = useState<string>(servers[0].id);

  const activeServer = servers.find((s) => s.id === activeServerId) || servers[0];

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
        </div>
      </div>

      {/* Debug Info */}
      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', wordBreak: 'break-all', fontFamily: 'monospace' }}>
        <strong>[Debug Iframe Src]:</strong> {activeServer.url}
      </div>

      {/* Video Iframe Player Wrapper */}
      {/* 3. Ensuring no pointer-events-none or invisible overlays */}
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
        <iframe
          key={activeServer.id}
          src={activeServer.url}
          allowFullScreen
          allow="autoplay; encrypted-media; picture-in-picture"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
        />
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
