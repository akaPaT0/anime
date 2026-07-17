import { Suspense } from 'react';
import { getCurrentSeason, getTrending, getPopular } from '@/lib/anilist';
import HeroSlider from '@/components/HeroSlider';
import AnimeGrid from '@/components/AnimeGrid';
import SkeletonGrid from '@/components/SkeletonGrid';

export const revalidate = 1800;

export default async function HomePage() {
  const [seasonal, trending, popular] = await Promise.all([
    getCurrentSeason(10).catch(() => []),
    getTrending(24).catch(() => []),
    getPopular(24).catch(() => []),
  ]);

  return (
    <div>
      <HeroSlider animes={seasonal} />
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        <Suspense fallback={<SkeletonGrid count={24} />}>
          <AnimeGrid animes={trending} title="Trending Now" showAll="/search?sort=trending" />
        </Suspense>
        <Suspense fallback={<SkeletonGrid count={24} />}>
          <AnimeGrid animes={popular} title="Most Popular" showAll="/search?sort=popular" />
        </Suspense>
      </div>
    </div>
  );
}
