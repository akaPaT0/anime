'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { AnilistAnime } from '@/lib/anilist';

interface HeroSliderProps {
  animes: AnilistAnime[];
}

function getFormatBadgeClass(format: string | null | undefined): string {
  if (!format) return 'badge badge-tv';
  const f = format.toUpperCase();
  if (f === 'MOVIE') return 'badge badge-movie';
  if (f === 'OVA' || f === 'ONA' || f === 'SPECIAL' || f === 'TV_SHORT') return 'badge badge-ova';
  return 'badge badge-tv';
}

function getFormatLabel(format: string | null | undefined): string {
  const map: Record<string, string> = {
    TV: 'TV',
    TV_SHORT: 'TV Short',
    MOVIE: 'Movie',
    SPECIAL: 'Special',
    OVA: 'OVA',
    ONA: 'ONA',
    MUSIC: 'Music',
  };
  return format ? (map[format] ?? format) : 'TV';
}

function toTitleCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&[a-z]+;/gi, (e) => {
    const entities: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#039;': "'" };
    return entities[e] ?? e;
  });
}

function StarIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

export default function HeroSlider({ animes }: HeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const goTo = useCallback(
    (index: number) => {
      if (index === currentIndex) return;
      setFading(true);
      setTimeout(() => {
        setCurrentIndex(index);
        setFading(false);
      }, 300);
    },
    [currentIndex],
  );

  const goNext = useCallback(() => {
    goTo((currentIndex + 1) % animes.length);
  }, [currentIndex, animes.length, goTo]);

  useEffect(() => {
    setIsMounted(true);
    if (animes.length <= 1) return;
    const id = setInterval(goNext, 5000);
    return () => clearInterval(id);
  }, [goNext, animes.length]);

  if (!animes.length) return null;

  const anime = animes[currentIndex];
  const displayTitle = anime.title.english || anime.title.romaji;
  const bgImage = anime.bannerImage || anime.coverImage.extraLarge;
  const badgeClass = getFormatBadgeClass(anime.format);
  const formatLabel = getFormatLabel(anime.format);

  const rawDescription = anime.description ? stripHtml(anime.description) : null;
  const synopsis = rawDescription
    ? rawDescription.length > 220
      ? rawDescription.slice(0, 220).trimEnd() + '…'
      : rawDescription
    : null;

  const seasonBadge =
    anime.season && anime.seasonYear
      ? `${toTitleCase(anime.season)} ${anime.seasonYear}`
      : anime.season
      ? toTitleCase(anime.season)
      : 'Featured';

  const displayScore =
    anime.averageScore != null ? (anime.averageScore / 10).toFixed(1) : null;

  return (
    <section className="hero-section" style={{ minHeight: "520px" }}>
      {/* Blurred background image — fades on transition */}
      <div
        className="hero-bg"
        style={{
          backgroundImage: `url('${bgImage}')`,
          opacity: fading ? 0 : 1,
          transition: 'opacity 0.35s ease, background-image 0s',
        }}
        aria-hidden="true"
      />

      {/* Directional gradient overlay */}
      <div className="hero-gradient" aria-hidden="true" />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          minHeight: '520px',
          padding: '0 5% 56px',
          maxWidth: '620px',
          opacity: fading ? 0 : 1,
          transition: 'opacity 0.3s ease',
        }}
      >
        {/* Season badge */}
        <div style={{ marginBottom: '14px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '100px',
              background: 'rgba(0, 245, 212, 0.12)',
              border: '1px solid rgba(0, 245, 212, 0.25)',
              color: 'var(--accent)',
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--accent)',
                boxShadow: '0 0 6px var(--accent)',
              }}
            />
            {seasonBadge}
          </span>
        </div>

        {/* Title */}
        <h1
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 800,
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            color: '#f0f1f3',
            lineHeight: 1.1,
            marginBottom: '12px',
            letterSpacing: '-0.01em',
          }}
        >
          {displayTitle}
        </h1>

        {/* Synopsis */}
        {synopsis && (
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
              lineHeight: 1.65,
              marginBottom: '16px',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {synopsis}
          </p>
        )}

        {/* Meta pills row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '16px',
          }}
        >
          {/* Format badge */}
          {anime.format && <span className={badgeClass}>{formatLabel}</span>}

          {/* Episodes */}
          {anime.episodes != null && (
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                fontWeight: 500,
              }}
            >
              {anime.episodes} eps
            </span>
          )}

          {/* Score */}
          {displayScore !== null && (
            <span className="score-pill">
              <StarIcon />
              {displayScore}
            </span>
          )}
        </div>

        {/* Genre pills */}
        {anime.genres.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: '6px',
              flexWrap: 'wrap',
              marginBottom: '24px',
            }}
          >
            {anime.genres.slice(0, 5).map((g) => (
              <span key={g} className="genre-pill" style={{ cursor: 'default' }}>
                {g}
              </span>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <Link href={`/anime/${anime.id}`} className="btn-accent">
            <PlayIcon />
            Watch Now
          </Link>
          <Link href={`/anime/${anime.id}`} className="btn-ghost">
            <InfoIcon />
            Details
          </Link>
        </div>
      </div>

      {/* Dot navigation */}
      {animes.length > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: '22px',
            left: '5%',
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {animes.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              style={{
                width: i === currentIndex ? '22px' : '7px',
                height: '7px',
                borderRadius: '100px',
                background: i === currentIndex ? 'var(--accent)' : 'rgba(255,255,255,0.25)',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                transition: 'width 0.3s ease, background 0.3s ease',
                boxShadow: i === currentIndex ? '0 0 8px var(--accent)' : 'none',
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
