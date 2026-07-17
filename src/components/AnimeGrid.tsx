import Link from 'next/link';
import AnimeCard from '@/components/AnimeCard';
import { AnilistCardData } from '@/lib/anilist';

interface AnimeGridProps {
  animes: AnilistCardData[];
  title?: string;
  showAll?: string;
}

export default function AnimeGrid({ animes, title, showAll }: AnimeGridProps) {
  return (
    <section>
      {title && (
        <div className="section-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h2>
          {showAll && (
            <Link href={showAll} style={{ fontSize: '0.875rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
              View All
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>
      )}

      {animes.length === 0 ? (
        <p className="empty-state">No anime found.</p>
      ) : (
        <div className="anime-grid">
          {animes.map((anime) => (
            <AnimeCard key={anime.id} anime={anime} />
          ))}
        </div>
      )}
    </section>
  );
}
