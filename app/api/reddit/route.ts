import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const subreddit = searchParams.get('subreddit') || 'ClaudeCode';

  try {
    const res = await fetch(`https://www.reddit.com/r/${subreddit}/hot.json?limit=15`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PulseKontrol/1.0; +https://pulsekontrol.vercel.app)',
        'Accept': 'application/json',
      },
      next: { revalidate: 60 } // Cache for 60 seconds
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Reddit API error: ${res.status} - ${errorText}`);
      return NextResponse.json(
        { error: `Reddit API error: ${res.status}`, details: errorText },
        { status: res.status }
      );
    }

    const data = await res.json();
    
    if (!data || !data.data) {
      return NextResponse.json(
        { error: 'Invalid Reddit API response' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching Reddit data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch Reddit data',
        message: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
