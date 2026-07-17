import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAnimeById, formatFormat, extractExternalIds } from '@/lib/anilist';
import { getMappedIds } from '@/lib/mappings';
import EpisodeList from '@/components/EpisodeList';
import WatchPlayer from '@/components/WatchPlayer';

export const dynamic = 'force-dynamic';

interface WatchPageProps {
  params: Promise<{ id: string; episode: string }>;
  searchParams: Promise<{ dub?: string }>;
}

export async function generateMetadata({ params }: WatchPageProps): Promise<Metadata> {
  const { id, episode } = await params;
  try {
    const anime = await getAnimeById(Number(id));
    const title = anime.title.english || anime.title.romaji;
    return {
      title: `${title} Episode ${episode} — AniStream`,
      description: `Watch ${title} Episode ${episode} online in HD. Multiple servers available.`,
    };
  } catch {
    return { title: 'Watch — AniStream' };
  }
}

export default async function WatchPage({ params, searchParams }: WatchPageProps) {
  const [{ id, episode }, { dub }] = await Promise.all([params, searchParams]);

  const animeId = Number(id);
  const epNum = Math.max(1, Number(episode) || 1);
  const isDub = dub === 'true';

  let anime;
  try {
    anime = await getAnimeById(animeId);
  } catch {
    notFound();
  }

  const title = anime.title.english || anime.title.romaji;
  const totalEpisodes = anime.episodes ?? 1;

  // Query local mappings first
  const localMap = getMappedIds(animeId);
  const { imdbId: apiImdb, tmdbId: apiTmdb } = extractExternalIds(anime.externalLinks);

  const malId = localMap.malId || anime.idMal;
  const tmdbId = localMap.tmdbId || apiTmdb;
  const isMovie = anime.format === 'MOVIE';

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem' }}>
      {/* ── Breadcrumbs ── */}
      <nav style={{ display: 'flex', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <Link href="/" className="breadcrumb-link">Home</Link>
        <span>/</span>
        <Link href={`/anime/${animeId}`} style={{ color: 'var(--text-secondary)' }}>{title}</Link>
        <span>/</span>
        <span style={{ color: 'var(--accent)' }}>Episode {epNum}</span>
      </nav>

      <style dangerouslySetInnerHTML={{ __html: `
        .breadcrumb-link {
          color: var(--text-muted);
          transition: color 0.15s ease;
        }
        .breadcrumb-link:hover {
          color: var(--text-primary);
        }
        .watch-sidebar-card {
          display: flex;
          gap: 12px;
          background: var(--bg-card);
          padding: 12px;
          border-radius: 10px;
          border: 1px solid var(--border-subtle);
          text-decoration: none;
          transition: border-color 0.2s ease;
        }
        .watch-sidebar-card:hover {
          border-color: var(--accent) !important;
        }
        @media (max-width: 860px) {
          .watch-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}} />

      {/* ── Main Layout Grid ── */}
      <div className="watch-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left Column: Player (delegated to WatchPlayer client-side component) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <WatchPlayer
            animeId={animeId}
            title={title}
            episode={epNum}
            totalEpisodes={totalEpisodes}
            initialDub={isDub}
            malId={malId}
            tmdbId={tmdbId}
            isMovie={isMovie}
            routeId={id}
          />
        </div>

        {/* Right Column: Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Quick info card */}
          <Link href={`/anime/${animeId}`} className="watch-sidebar-card">
            <div style={{ width: '60px', height: '85px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0 }}>
              <img src={anime.coverImage.extraLarge} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px' }}>
              <p className="line-clamp-2" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>{title}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {anime.averageScore && (
                  <span className="score-pill" style={{ padding: '1px 6px', fontSize: '0.68rem' }}>
                    ★ {(anime.averageScore / 10).toFixed(1)}
                  </span>
                )}
                <span className="badge badge-tv" style={{ padding: '1px 6px', fontSize: '0.65rem' }}>
                  {formatFormat(anime.format)}
                </span>
              </div>
            </div>
          </Link>

          {/* Episode List */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '1rem' }}>
            <EpisodeList
              animeId={animeId}
              totalEpisodes={totalEpisodes}
              currentEp={epNum}
              subOrDub={isDub ? 'dub' : 'sub'}
            />
          </div>
        </div>
      </div>
    </div>
  );
}