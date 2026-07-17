import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const { searchParams } = new URL(request.url);
    
    // Reconstruct the destination URL pointing to VidLink's official production API
    const targetUrl = new URL(`https://vidlink.pro/api/${path.join('/')}`);
    searchParams.forEach((value, key) => {
      targetUrl.searchParams.append(key, value);
    });

    const response = await fetch(targetUrl.toString(), {
      headers: {
        'User-Agent': request.headers.get('User-Agent') || '',
        'Referer': 'https://vidlink.pro',
      },
    });

    if (!response.ok) {
      return new NextResponse(`Proxy error: ${response.statusText}`, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[API Proxy] Error fetching from VidLink:', error);
    return new NextResponse(error.message || 'Internal Server Error', { status: 500 });
  }
}
