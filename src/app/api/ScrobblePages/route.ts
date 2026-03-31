import { NextResponse } from 'next/server';

// Environment Variables
const API_KEY = process.env.NEXT_PUBLIC_LASTFM_API_KEY!;
const API_URL = 'https://ws.audioscrobbler.com/2.0/';

interface lfmRecentTrack {
  artist: { '#text': string };
  album: { '#text': string };
  name: string;
  image?: { '#text': string }[];
  date?: { uts: string };
}

/**
 * Fetches all items from Last.fm
 * @param method
 * @param username
 * @param apiKey
 * @returns Promise<T[]>
 */
const fetchScrobblePages = async (
  username: string,
  limit: number = 1000,
): Promise<number> => {
  const base = `${API_URL}?method=user.getrecenttracks&user=${username}&api_key=${API_KEY}&format=json&limit=${limit}`;

  console.log(base);
  const first: {
    recenttracks: {
      track: lfmRecentTrack[];
      '@attr': { totalPages: string };
    };
  } = await fetchWithTimeout(base + '&page=1');

  const totalPages = Number(first.recenttracks['@attr'].totalPages);

  return totalPages;
};

const fetchWithTimeout = async <T>(url: string, ms = 10000): Promise<T> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timeout);
  }
};

/**
 * GET Handler
 * @returns NextResponse
 */
const GET = async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const USERNAME = searchParams.get('user') || '';
  const LIMIT = Number(searchParams.get('limit') || 1000);
  try {
    const pages = await fetchScrobblePages(USERNAME, LIMIT);
    console.log('Total Pages:', pages);
    return NextResponse.json({ totalPages: pages });
  } catch (err) {
    console.error('Scrobble Pages Fetch Error:', err);
    return NextResponse.json(
      { error: 'Failed to get the number of pages of scrobbles' },
      { status: 500 },
    );
  }
};

export { GET };
