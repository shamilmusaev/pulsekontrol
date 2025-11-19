import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const subreddit = searchParams.get('subreddit') || 'ClaudeCode';

  try {
    // Use more browser-like headers to avoid Reddit blocking
    const res = await fetch(`https://www.reddit.com/r/${subreddit}/hot.json?limit=15`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://www.reddit.com/',
        'Origin': 'https://www.reddit.com',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
      },
      cache: 'no-store', // Disable caching to avoid stale data
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Reddit API error: ${res.status} - ${errorText}`);
      
      // Return empty data instead of error to avoid breaking the UI
      return NextResponse.json({
        data: {
          children: []
        }
      });
    }

    const data = await res.json();
    
    if (!data || !data.data) {
      return NextResponse.json({
        data: {
          children: []
        }
      });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching Reddit data:', error);
    
    // Return empty data instead of error
    return NextResponse.json({
      data: {
        children: []
      }
    });
  }
}

