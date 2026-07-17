import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAnimeById, getRecommendations, formatScore, formatStatus, formatFormat } from '@/lib/anilist';
import AnimeGrid from '@/components/AnimeGrid';

interface AnimeDetailsPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: AnimeDetailsPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const anime = await getAnimeById(Number(id));
    const title = anime.title.english || anime.title.romaji;
    return {
      title: `${title} — AniStream`,
      description: anime.description?.replace(/<[^>]*>/g, '').slice(0, 160) || undefined,
    };
  } catch {
    return { title: 'Anime Details — AniStream' };
  }
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', padding: '10px 0', fontSize: '0.875rem' }}>
      <span style={{ color: 'var(--text-muted)', width: '40%', flexShrink: 0 }}>{label}</span>
      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

export default async function AnimeDetailsPage({ params }: AnimeDetailsPageProps) {
  const { id } = await params;
  let anime;
  let recommendations;

  try {
    [anime, recommendations] = await Promise.all([
      getAnimeById(Number(id)),
      getRecommendations(Number(id)).catch(() => []),
    ]);
  } catch {
    notFound();
  }

  const title = anime.title.english || anime.title.romaji;
  const originalTitle = anime.title.native || anime.title.romaji;
  const synopsis = anime.description?.replace(/<[^>]*>/g, '') ?? 'No description available.';
  const displayScore = formatScore(anime.averageScore);
  const statusLabel = formatStatus(anime.status);
  const formatLabel = formatFormat(anime.format);
  const studiosList = anime.studios.nodes
    .filter((s) => s.isAnimationStudio)
    .map((s) => s.name)
    .join(', ');

  const ratingLabel = anime.isAdult ? '18+ (Adult)' : 'PG-13 / Teen';
  
  // Link to watch first episode (using AniList ID in watch page URL, MAL ID resolved inside)
  const watchLink = `/watch/${anime.id}/1`;

  return (
    <div>
      {/* ── Banner Section ── */}
      <div className="hero-section" style={{ minHeight: '380px', display: 'flex', alignItems: 'flex-end', position: 'relative' }}>
        <div
          className="hero-bg"
          style={{
            backgroundImage: `url(${anime.bannerImage || anime.coverImage.extraLarge})`,
            backgroundPosition: 'center 30%',
            filter: 'blur(10px) brightness(0.22)',
            transform: 'scale(1.08)',
          }}
        />
        <div className="hero-gradient" />

        {/* Banner Content */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            maxWidth: '1400px',
            width: '100%',
            margin: '0 auto',
            padding: '2.5rem 1.5rem',
            display: 'flex',
            gap: '2rem',
            flexWrap: 'wrap',
          }}
        >
          {/* Poster Image */}
          <div style={{ flexShrink: 0, width: '180px', height: '270px', borderRadius: '12px', overflow: 'hidden', border: '2px solid var(--accent)', boxShadow: 'var(--shadow-card)' }}>
            <img src={anime.coverImage.extraLarge} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          {/* Details Intro */}
          <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '12px' }}>
            <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.75rem)', fontWeight: 800, lineHeight: 1.1, color: 'var(--text-primary)' }}>
              {title}
            </h1>
            {anime.title.native && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{originalTitle}</p>
            )}

            {/* Badges Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
              <span className={`badge ${anime.format === 'MOVIE' ? 'badge-movie' : 'badge-tv'}`}>{formatLabel}</span>
              {displayScore && (
                <span className="score-pill">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  {displayScore}
                </span>
              )}
              {anime.episodes !== null && (
                <span className="badge badge-ova" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}>
                  {anime.episodes} Episode{anime.episodes !== 1 ? 's' : ''}
                </span>
              )}
              <span className="badge badge-sub" style={{ backgroundColor: 'rgba(0, 245, 212, 0.15)', color: 'var(--accent)' }}>SUB</span>
            </div>

            {/* Meta Row */}
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <span>{statusLabel}</span>
              {anime.season && (
                <span>• {anime.season.charAt(0) + anime.season.slice(1).toLowerCase()} {anime.seasonYear}</span>
              )}
              {anime.duration && <span>• {anime.duration} min / ep</span>}
            </p>

            {studiosList && (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Studio: <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{studiosList}</span>
              </p>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '1.25rem' }}>
              <Link href={watchLink} className="btn-accent" style={{ padding: '12px 28px', fontSize: '0.95rem' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Watch Now
              </Link>
              <button className="btn-ghost" style={{ padding: '12px 20px', fontSize: '0.95rem' }}>
                + Add to List
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Details Grid Section ── */}
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '2.5rem 1.5rem',
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '2.5rem',
        }}
      >
        <style dangerouslySetInnerHTML={{ __html: `
          @media (min-width: 1024px) {
            .details-main-grid {
              display: grid !important;
              grid-template-columns: 1fr 320px !important;
              gap: 2.5rem !important;
            }
          }
        `}} />
        
        <div className="details-main-grid" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Left Column: Synopsis & Genres */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
              <h2 className="section-heading" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Synopsis</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.95rem', whiteSpace: 'pre-line' }}>
                {synopsis}
              </p>
            </div>

            {/* Genres */}
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Genres</h3>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {anime.genres.map((genre) => (
                  <Link key={genre} href={`/search?genre=${encodeURIComponent(genre)}`} className="genre-pill">
                    {genre}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Info Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
                Details
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <InfoRow label="Format" value={formatLabel} />
                <InfoRow label="Status" value={statusLabel} />
                <InfoRow label="Episodes" value={anime.episodes ?? 'Unknown'} />
                <InfoRow label="Duration" value={anime.duration ? `${anime.duration} min` : 'Unknown'} />
                <InfoRow label="Source" value={anime.source ? anime.source.replace(/_/g, ' ') : '—'} />
                <InfoRow label="Rating" value={ratingLabel} />
                <InfoRow label="Score" value={displayScore ? `${displayScore} / 10` : '—'} />
                <InfoRow label="Popularity" value={anime.popularity ? anime.popularity.toLocaleString() : '—'} />
                <InfoRow label="Favourites" value={anime.favourites ? anime.favourites.toLocaleString() : '—'} />
              </div>
              <Link href={watchLink} className="btn-accent" style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem', padding: '12px' }}>
                Start Streaming
              </Link>
            </div>
          </div>
        </div>

        {/* ── Recommendations ── */}
        {recommendations.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <AnimeGrid animes={recommendations} title="You Might Also Like" />
          </div>
        )}
      </div>
    </div>
  );
}
