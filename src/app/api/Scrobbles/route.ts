import { NextResponse } from 'next/server';

const API_KEY = process.env.NEXT_PUBLIC_LASTFM_API_KEY!;
const API_URL = 'https://ws.audioscrobbler.com/2.0/';

/**
 * GET Handler
 * @returns NextResponse
 */
const GET = async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const USERNAME = searchParams.get('user') || '';
  try {
    const res = await fetch(
      `${API_URL}?method=user.getinfo&user=${USERNAME}&api_key=${API_KEY}&format=json`,
    );

    if (!res.ok) throw new Error('Failed to fetch user info');

    const data = await res.json();
    const totalScrobbles = parseInt(data.user.playcount, 10);

    return NextResponse.json({ totalScrobbles });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'Failed to fetch total scrobbles' },
      { status: 500 },
    );
  }
};

export { GET };
