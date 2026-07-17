// AniList GraphQL API - fast, reliable, CORS-enabled, no key needed
// https://anilist.gitbook.io/anilist-apiv2-docs/

const ANILIST_ENDPOINT = 'https://graphql.anilist.co';

export interface AnilistAnime {
  id: number;           // AniList ID
  idMal: number | null; // MyAnimeList ID (used for VidLink)
  title: {
    english: string | null;
    romaji: string;
    native: string | null;
  };
  coverImage: {
    extraLarge: string;
    large: string;
    color: string | null;
  };
  bannerImage: string | null;
  description: string | null;
  episodes: number | null;
  status: 'FINISHED' | 'RELEASING' | 'NOT_YET_RELEASED' | 'CANCELLED' | 'HIATUS';
  format: 'TV' | 'TV_SHORT' | 'MOVIE' | 'SPECIAL' | 'OVA' | 'ONA' | 'MUSIC' | null;
  genres: string[];
  averageScore: number | null; // 0–100
  popularity: number | null;
  season: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL' | null;
  seasonYear: number | null;
  duration: number | null; // minutes per episode
  studios: {
    nodes: { name: string; isAnimationStudio: boolean }[];
  };
  trailer: { id: string; site: string } | null;
  isAdult: boolean;
  countryOfOrigin: string | null;
  source: string | null;
  meanScore: number | null;
  favourites: number | null;
  rankings: { rank: number; type: string; allTime: boolean }[];
  nextAiringEpisode: { episode: number; airingAt: number } | null;
  startDate: { year: number | null; month: number | null; day: number | null };
  externalLinks?: { site: string; url: string; id: number }[];
}

export interface AnilistCardData {
  id: number;
  malId: number | null;
  title: string;
  image: string;
  bannerImage: string | null;
  score: number | null; // 0–100 → we show as /10
  format: string | null;
  episodes: number | null;
  status: string;
  genres: string[];
  color: string | null;
}

// ─── GraphQL fragments ────────────────────────────────────────────────────────

const CARD_FIELDS = `
  id
  idMal
  title { english romaji }
  coverImage { extraLarge large color }
  bannerImage
  episodes
  status
  format
  genres
  averageScore
  popularity
  nextAiringEpisode { episode airingAt }
`;

const FULL_FIELDS = `
  ${CARD_FIELDS}
  title { english romaji native }
  description(asHtml: false)
  season
  seasonYear
  duration
  source
  meanScore
  favourites
  countryOfOrigin
  isAdult
  trailer { id site }
  studios { nodes { name isAnimationStudio } }
  rankings { rank type allTime }
  startDate { year month day }
  externalLinks { site url id }
`;

export function extractExternalIds(links?: { site: string; url: string }[]): { imdbId: string | null; tmdbId: string | null } {
  let imdbId: string | null = null;
  let tmdbId: string | null = null;
  if (!links) return { imdbId, tmdbId };
  for (const link of links) {
    if (link.site.toLowerCase() === 'imdb') {
      const match = link.url.match(/\/title\/(tt\d+)/);
      if (match) imdbId = match[1];
    } else if (link.site.toLowerCase() === 'the movie database') {
      const match = link.url.match(/\/(movie|tv)\/(\d+)/);
      if (match) tmdbId = match[2];
    }
  }
  return { imdbId, tmdbId };
}

// ─── Core fetch ───────────────────────────────────────────────────────────────

async function gql<T>(query: string, variables: Record<string, unknown> = {}, serverCache = false): Promise<T> {
  const opts: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query, variables }),
  };

  if (serverCache) {
    // Next.js server-side: cache for 1 hour
    (opts as RequestInit & { next?: unknown }).next = { revalidate: 3600 };
  }

  const res = await fetch(ANILIST_ENDPOINT, opts);
  if (!res.ok) throw new Error(`AniList error: ${res.status}`);
  const json = await res.json() as { data: T; errors?: { message: string }[] };
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function toCardData(a: AnilistAnime): AnilistCardData {
  return {
    id: a.id,
    malId: a.idMal,
    title: a.title.english || a.title.romaji,
    image: a.coverImage.extraLarge || a.coverImage.large,
    bannerImage: a.bannerImage,
    score: a.averageScore,
    format: a.format,
    episodes: a.episodes,
    status: a.status,
    genres: a.genres,
    color: a.coverImage.color,
  };
}

export function formatScore(score: number | null): string | null {
  if (!score) return null;
  return (score / 10).toFixed(1);
}

export function formatStatus(status: string): string {
  const map: Record<string, string> = {
    FINISHED: 'Finished',
    RELEASING: 'Airing',
    NOT_YET_RELEASED: 'Upcoming',
    CANCELLED: 'Cancelled',
    HIATUS: 'On Hiatus',
  };
  return map[status] ?? status;
}

export function formatFormat(format: string | null): string {
  const map: Record<string, string> = {
    TV: 'TV', TV_SHORT: 'TV Short', MOVIE: 'Movie',
    SPECIAL: 'Special', OVA: 'OVA', ONA: 'ONA', MUSIC: 'Music',
  };
  return format ? (map[format] ?? format) : 'Unknown';
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getTrending(perPage = 20): Promise<AnilistCardData[]> {
  const data = await gql<{ Page: { media: AnilistAnime[] } }>(
    `query($perPage: Int) {
      Page(perPage: $perPage) {
        media(type: ANIME, sort: TRENDING_DESC, isAdult: false) { ${CARD_FIELDS} }
      }
    }`,
    { perPage },
    true,
  );
  return data.Page.media.map(toCardData);
}

export async function getPopular(perPage = 20): Promise<AnilistCardData[]> {
  const data = await gql<{ Page: { media: AnilistAnime[] } }>(
    `query($perPage: Int) {
      Page(perPage: $perPage) {
        media(type: ANIME, sort: POPULARITY_DESC, isAdult: false) { ${CARD_FIELDS} }
      }
    }`,
    { perPage },
    true,
  );
  return data.Page.media.map(toCardData);
}

export async function getCurrentSeason(perPage = 10): Promise<AnilistAnime[]> {
  // Determine current season
  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();
  const season =
    month <= 3 ? 'WINTER' : month <= 6 ? 'SPRING' : month <= 9 ? 'SUMMER' : 'FALL';

  const data = await gql<{ Page: { media: AnilistAnime[] } }>(
    `query($season: MediaSeason, $year: Int, $perPage: Int) {
      Page(perPage: $perPage) {
        media(type: ANIME, season: $season, seasonYear: $year, sort: POPULARITY_DESC, isAdult: false) {
          ${FULL_FIELDS}
        }
      }
    }`,
    { season, year, perPage },
    true,
  );
  return data.Page.media;
}

export async function getAnimeById(anilistId: number): Promise<AnilistAnime> {
  const data = await gql<{ Media: AnilistAnime }>(
    `query($id: Int) {
      Media(id: $id, type: ANIME) { ${FULL_FIELDS} }
    }`,
    { id: anilistId },
    true,
  );
  return data.Media;
}

export async function getAnimeByMalId(malId: number): Promise<AnilistAnime> {
  const data = await gql<{ Media: AnilistAnime }>(
    `query($malId: Int) {
      Media(idMal: $malId, type: ANIME) { ${FULL_FIELDS} }
    }`,
    { malId },
    true,
  );
  return data.Media;
}

export async function getRecommendations(anilistId: number, perPage = 12): Promise<AnilistCardData[]> {
  const data = await gql<{ Media: { recommendations: { nodes: { mediaRecommendation: AnilistAnime }[] } } }>(
    `query($id: Int, $perPage: Int) {
      Media(id: $id, type: ANIME) {
        recommendations(perPage: $perPage, sort: RATING_DESC) {
          nodes { mediaRecommendation { ${CARD_FIELDS} } }
        }
      }
    }`,
    { id: anilistId, perPage },
    true,
  );
  return data.Media.recommendations.nodes
    .filter((n) => n.mediaRecommendation)
    .map((n) => toCardData(n.mediaRecommendation));
}

/** Called from the server (search page SSR) */
export async function searchAnimeServer(
  query: string,
  page = 1,
  genres?: string[],
  perPage = 30,
): Promise<{ results: AnilistCardData[]; hasNext: boolean; total: number }> {
  const data = await gql<{ Page: { pageInfo: { hasNextPage: boolean; total: number }; media: AnilistAnime[] } }>(
    `query($search: String, $genres: [String], $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { hasNextPage total }
        media(type: ANIME, search: $search, genre_in: $genres, isAdult: false, sort: POPULARITY_DESC) {
          ${CARD_FIELDS}
        }
      }
    }`,
    {
      search: query || undefined,
      genres: genres?.length ? genres : undefined,
      page,
      perPage,
    },
    false,
  );
  return {
    results: data.Page.media.map(toCardData),
    hasNext: data.Page.pageInfo.hasNextPage,
    total: data.Page.pageInfo.total,
  };
}

/** Client-side instant search — called directly from browser */
export async function searchAnimeClient(query: string, perPage = 10): Promise<AnilistCardData[]> {
  if (!query.trim()) return [];
  const data = await gql<{ Page: { media: AnilistAnime[] } }>(
    `query($search: String, $perPage: Int) {
      Page(perPage: $perPage) {
        media(type: ANIME, search: $search, isAdult: false, sort: SEARCH_MATCH) {
          ${CARD_FIELDS}
        }
      }
    }`,
    { search: query.trim(), perPage },
  );
  return data.Page.media.map(toCardData);
}

/** All genres from AniList (static list — doesn't need an API call) */
export const ANILIST_GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi', 'Fantasy',
  'Horror', 'Mahou Shoujo', 'Mecha', 'Music', 'Mystery', 'Psychological',
  'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller',
];
