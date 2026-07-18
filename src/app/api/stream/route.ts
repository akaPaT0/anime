import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const anilistId = searchParams.get('anilistId');
  const episodeNumber = searchParams.get('episodeNumber');
  const subOrDub = searchParams.get('subOrDub') || 'sub';

  if (!anilistId || !episodeNumber) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  try {
    // 1. Direct fetch to AMVSTR API - bypassing the consumet package and Vercel Cloudflare blocks
    const response = await fetch(`https://api.amvstr.me/api/v2/stream/${anilistId}/${episodeNumber}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      next: { revalidate: 0 } 
    });

    if (!response.ok) {
      throw new Error(`Upstream API failed with status: ${response.status}`);
    }

    const data = await response.json();

    // 2. Extract the raw .m3u8 link from the API payload
    const streamData = data?.stream?.multi?.main || data?.stream?.multi?.backup;
    
    if (!streamData || !streamData.url) {
        throw new Error('No valid HLS stream found in payload');
    }

    // 3. Return the exact JSON structure your WatchPlayer.tsx frontend is currently waiting for
    return NextResponse.json({
      url: streamData.url,
      isM3U8: true,
      proxyUrl: streamData.url, // AMVSTR handles CORS natively, so we pass the link directly to the player
      quality: 'auto',
    });

  } catch (err: any) {
    console.error('[Stream API Error]:', err.message);
    return NextResponse.json(
      { error: 'Extraction Failure: Upstream proxy refused connection.' },
      { status: 500 }
    );
  }
}
