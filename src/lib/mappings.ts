import fs from 'fs';
import path from 'path';

interface MappingItem {
  anilist_id?: number;
  mal_id?: number;
  imdb_id?: string[];
  themoviedb_id?: {
    movie?: number[];
    tv?: number[];
  };
}

let cachedMappings: MappingItem[] | null = null;
let mappingsIndex: Map<number, MappingItem> | null = null;

function loadMappings() {
  if (cachedMappings && mappingsIndex) return;

  try {
    const filePath = path.join(process.cwd(), 'src/lib/anime-list-mini.json');
    console.log(`[Mappings] Reading mappings file from: ${filePath}`);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    cachedMappings = JSON.parse(fileContent) as MappingItem[];
    
    // Build index for O(1) instant lookup
    mappingsIndex = new Map();
    for (const item of cachedMappings) {
      if (item.anilist_id) {
        mappingsIndex.set(item.anilist_id, item);
      }
    }
    console.log(`[Mappings] Successfully loaded ${mappingsIndex.size} indexed mappings.`);
  } catch (err) {
    console.error('[Mappings] Failed to load local anime mappings database:', err);
    cachedMappings = [];
    mappingsIndex = new Map();
  }
}

function getFirstId(val: any): string | null {
  if (val === undefined || val === null) return null;
  if (Array.isArray(val)) {
    return val.length > 0 ? String(val[0]) : null;
  }
  return String(val);
}

export function getMappedIds(anilistId: number): {
  malId: number | null;
  tmdbId: string | null;
  imdbId: string | null;
} {
  loadMappings();
  
  const item = mappingsIndex?.get(anilistId);
  if (!item) {
    return { malId: null, tmdbId: null, imdbId: null };
  }

  const malId = item.mal_id ?? null;
  const imdbId = getFirstId(item.imdb_id);
  
  const tmdbMovie = item.themoviedb_id?.movie;
  const tmdbTv = item.themoviedb_id?.tv;
  const tmdbId = getFirstId(tmdbMovie) || getFirstId(tmdbTv);

  return { malId, tmdbId, imdbId };
}
