import { NextRequest, NextResponse } from 'next/server';
import { META, ANIME } from '@consumet/extensions';

// Prevent Next.js from caching this API route
export const dynamic = 'force-dynamic';

// Define the response structures
interface StreamResponse {
  url: string;
  quality?: string;
  isM3U8: boolean;
  headers?: Record<string, string>;
  proxyUrl?: string;
  sources: any[];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const proxyUrl = searchParams.get('url');
  const referer = searchParams.get('referer');

  // 1. CORS / Referer Proxy Mode
  if (proxyUrl) {
    try {
      const headers: HeadersInit = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      };
      
      if (referer) {
        headers['Referer'] = referer;
      } else if (proxyUrl.includes('kwik.cx')) {
        headers['Referer'] = 'https://kwik.cx/';
      }

      const response = await fetch(proxyUrl, { headers });
      
      if (!response.ok) {
        return new NextResponse(`Proxy target returned error ${response.status}`, { status: response.status });
      }

      const contentType = response.headers.get('content-type') || 'application/x-mpegURL';
      
      // Return response stream with CORS headers
      return new Response(response.body, {
        status: response.status,
        headers: {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Cache-Control': 'no-store, max-age=0',
        },
      });
    } catch (err: any) {
      console.error('[StreamProxy] Error proxying request:', err);
      return new NextResponse(`Proxy error: ${err.message}`, { status: 500 });
    }
  }

  // 2. Stream Extraction Mode
  const anilistId = searchParams.get('anilistId');
  const episodeNumber = searchParams.get('episodeNumber');
  const subOrDub = searchParams.get('subOrDub') || 'sub';

  if (!anilistId || !episodeNumber) {
    return NextResponse.json(
      { error: 'Missing required parameters: anilistId and episodeNumber' },
      { status: 400 }
    );
  }

  const epNum = Number(episodeNumber);

  // Attempt 1: Fetch using AnimePahe provider
  try {
    console.log(`[StreamExtractor] Attempting AnimePahe for AniList ID ${anilistId}, Ep ${epNum}`);
    const paheProvider = new ANIME.AnimePahe();
    // Use .com / .ru / .org as fallbacks for base URL if .si has resolution errors
    (paheProvider as any).baseUrl = 'https://animepahe.com';
    const anilist = new META.Anilist(paheProvider);
    
    const info = await anilist.fetchAnimeInfo(anilistId);
    const episode = info.episodes?.find((e: any) => e.number === epNum);
    
    if (episode) {
      const sourcesData = await anilist.fetchEpisodeSources(episode.id);
      if (sourcesData && sourcesData.sources && sourcesData.sources.length > 0) {
        // Filter sources based on sub/dub preference
        const isDubPreferred = subOrDub === 'dub';
        const filteredSources = sourcesData.sources.filter((s: any) => !!s.isDub === isDubPreferred);
        const activeSources = filteredSources.length > 0 ? filteredSources : sourcesData.sources;
        
        // Find best source (prioritize 1080p, 720p, then default)
        const bestSource = activeSources.find((s: any) => s.quality === '1080p') ||
                            activeSources.find((s: any) => s.quality === '720p') ||
                            activeSources.find((s: any) => s.quality === 'default') ||
                            activeSources[0];

        const defaultReferer = sourcesData.headers?.Referer || 'https://kwik.cx/';
        const streamUrl = bestSource.url;
        
        // Construct the proxy URL for HLS playback to bypass CORS/Referer blocks
        const appUrl = req.nextUrl.origin;
        const proxyStreamUrl = `${appUrl}/api/stream?url=${encodeURIComponent(streamUrl)}&referer=${encodeURIComponent(defaultReferer)}`;

        return NextResponse.json({
          url: streamUrl,
          quality: bestSource.quality,
          isM3U8: streamUrl.includes('.m3u8') || bestSource.isM3U8,
          headers: { Referer: defaultReferer },
          proxyUrl: proxyStreamUrl,
          sources: activeSources,
        } as StreamResponse);
      }
    }
  } catch (err: any) {
    console.warn(`[StreamExtractor] AnimePahe extraction failed: ${err.message}`);
  }

  // Attempt 2: Fetch using HiAnime (Zoro) provider
  try {
    console.log(`[StreamExtractor] Attempting HiAnime for AniList ID ${anilistId}, Ep ${epNum}`);
    const hianimeProvider = new ANIME.Hianime();
    const anilist = new META.Anilist(hianimeProvider);
    
    const info = await anilist.fetchAnimeInfo(anilistId);
    const episode = info.episodes?.find((e: any) => e.number === epNum);
    
    if (episode) {
      // HiAnime fetchEpisodeSources signature: (episodeId, server, subOrDub)
      const subOrDubParam = subOrDub === 'dub' ? 'dub' : 'sub';
      const sourcesData = await anilist.fetchEpisodeSources(episode.id, 'vidcloud', subOrDubParam);
      
      if (sourcesData && sourcesData.sources && sourcesData.sources.length > 0) {
        const bestSource = sourcesData.sources.find((s: any) => s.quality === '1080p') ||
                            sourcesData.sources.find((s: any) => s.quality === '720p') ||
                            sourcesData.sources.find((s: any) => s.quality === 'default') ||
                            sourcesData.sources[0];
        
        const defaultReferer = sourcesData.headers?.Referer || 'https://hianime.to/';
        const streamUrl = bestSource.url;
        
        const appUrl = req.nextUrl.origin;
        const proxyStreamUrl = `${appUrl}/api/stream?url=${encodeURIComponent(streamUrl)}&referer=${encodeURIComponent(defaultReferer)}`;

        return NextResponse.json({
          url: streamUrl,
          quality: bestSource.quality,
          isM3U8: streamUrl.includes('.m3u8') || bestSource.isM3U8,
          headers: { Referer: defaultReferer },
          proxyUrl: proxyStreamUrl,
          sources: sourcesData.sources,
        } as StreamResponse);
      }
    }
  } catch (err: any) {
    console.warn(`[StreamExtractor] HiAnime extraction failed: ${err.message}`);
  }

  // Attempt 3: Fetching AniList metadata and doing title-based search fallback
  try {
    console.log(`[StreamExtractor] Attempting fallback title-based search for AniList ID ${anilistId}`);
    
    // Fetch title from official AniList API
    const aniZipRes = await fetch(`https://api.ani.zip/mappings?anilist_id=${anilistId}`);
    if (aniZipRes.ok) {
      const mappingData = await aniZipRes.json();
      const title = mappingData?.mappings?.title_romaji || mappingData?.mappings?.title_english;
      
      if (title) {
        console.log(`[StreamExtractor] Found title: "${title}". Searching on AnimePahe...`);
        const paheProvider = new ANIME.AnimePahe();
        (paheProvider as any).baseUrl = 'https://animepahe.com';
        
        const searchResults = await paheProvider.search(title);
        if (searchResults.results && searchResults.results.length > 0) {
          const match = searchResults.results[0];
          const info = await paheProvider.fetchAnimeInfo(match.id);
          const episode = info.episodes?.find((e: any) => e.number === epNum);
          
          if (episode) {
            const sourcesData = await paheProvider.fetchEpisodeSources(episode.id);
            if (sourcesData && sourcesData.sources && sourcesData.sources.length > 0) {
              const isDubPreferred = subOrDub === 'dub';
              const filteredSources = sourcesData.sources.filter((s: any) => !!s.isDub === isDubPreferred);
              const activeSources = filteredSources.length > 0 ? filteredSources : sourcesData.sources;
              
              const bestSource = activeSources.find((s: any) => s.quality === '1080p') ||
                                  activeSources.find((s: any) => s.quality === '720p') ||
                                  activeSources.find((s: any) => s.quality === 'default') ||
                                  activeSources[0];

              const defaultReferer = sourcesData.headers?.Referer || 'https://kwik.cx/';
              const streamUrl = bestSource.url;
              
              const appUrl = req.nextUrl.origin;
              const proxyStreamUrl = `${appUrl}/api/stream?url=${encodeURIComponent(streamUrl)}&referer=${encodeURIComponent(defaultReferer)}`;

              return NextResponse.json({
                url: streamUrl,
                quality: bestSource.quality,
                isM3U8: streamUrl.includes('.m3u8') || bestSource.isM3U8,
                headers: { Referer: defaultReferer },
                proxyUrl: proxyStreamUrl,
                sources: activeSources,
              } as StreamResponse);
            }
          }
        }
      }
    }
  } catch (err: any) {
    console.error(`[StreamExtractor] Fallback title-based extraction failed: ${err.message}`);
  }

  // If all attempts fail, return a 500 error
  return NextResponse.json(
    { error: 'Failed to extract raw streaming link. All scraper providers returned errors.' },
    { status: 500 }
  );
}
