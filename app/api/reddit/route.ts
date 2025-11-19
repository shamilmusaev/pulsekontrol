import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const subreddit = searchParams.get('subreddit') || 'ClaudeCode';

  try {
    const res = await fetch(`https://www.reddit.com/r/${subreddit}/hot.json?limit=15`, {
      headers: {
        'User-Agent': 'PulseKontrol/1.0'
      }
    });

    if (!res.ok) {
      throw new Error(`Reddit API responded with status: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching Reddit data:', error);
    return NextResponse.json({ error: 'Failed to fetch Reddit data' }, { status: 500 });
  }
}
