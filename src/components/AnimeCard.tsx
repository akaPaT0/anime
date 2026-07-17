import Link from 'next/link';
import { AnilistCardData, formatScore, formatStatus, formatFormat } from '@/lib/anilist';

interface AnimeCardProps {
  anime: AnilistCardData;
}

function getTypeBadgeClass(format: string | null): string {
  if (!format) return 'badge badge-tv';
  const f = format.toLowerCase();
  if (f === 'movie') return 'badge badge-movie';
  if (f === 'ova' || f === 'ona' || f === 'special') return 'badge badge-ova';
  return 'badge badge-tv';
}

function getStatusDot(status: string): { color: string; label: string } {
  const s = status.toLowerCase();
  if (s === 'releasing' || s === 'airing') return { color: '#00f5d4', label: 'Airing' };
  if (s === 'finished') return { color: '#9ea3b2', label: 'Finished' };
  if (s === 'not_yet_released' || s === 'upcoming') return { color: '#7c5cfc', label: 'Upcoming' };
  return { color: '#9ea3b2', label: status };
}

export default function AnimeCard({ anime }: AnimeCardProps) {
  const { id, title, image, score, format, episodes, status, genres, color } = anime;
  const badgeClass = getTypeBadgeClass(format);
  const statusInfo = getStatusDot(status);
  const displayScore = formatScore(score);

  return (
    <Link
      href={`/anime/${id}`}
      className="anime-card"
      style={{
        display: 'block',
        textDecoration: 'none',
        borderBottom: color ? `2px solid ${color}` : undefined,
      }}
    >
      {/* Poster */}
      <div className="poster-wrap">
        <img
          src={image}
          alt={title}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        <div className="poster-overlay">
          {displayScore !== null && (
            <span className="score-pill">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              {displayScore}
            </span>
          )}
        </div>
      </div>

      {/* Card Info */}
      <div style={{ padding: '10px 10px 12px' }}>
        {/* Title */}
        <p
          className="line-clamp-2"
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 600,
            fontSize: '0.875rem',
            color: '#f0f1f3',
            lineHeight: 1.35,
            marginBottom: '8px',
          }}
        >
          {title}
        </p>

        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span className={badgeClass}>
            {formatFormat(format)}
          </span>
          {episodes !== null && (
            <span
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                fontWeight: 500,
              }}
            >
              {episodes} ep{episodes !== 1 ? 's' : ''}
            </span>
          )}
          {genres && genres.length > 0 && (
            <span style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 500, marginLeft: 'auto' }}>
              {genres[0]}
            </span>
          )}
        </div>

        {/* Status indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '6px' }}>
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: statusInfo.color,
              flexShrink: 0,
              boxShadow: `0 0 4px ${statusInfo.color}`,
            }}
          />
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            {statusInfo.label}
          </span>
        </div>
      </div>
    </Link>
  );
}
