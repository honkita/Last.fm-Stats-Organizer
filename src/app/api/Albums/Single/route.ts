// Next.js
import { NextRequest, NextResponse } from 'next/server';

// Prisma
import { prisma } from '@/lib/prisma';

/**
 * Gets the albums from the database and stores them in a global variable for caching.
 * @returns
 */
const GET = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const albumName = searchParams.get('albumName');

    if (!albumName) {
      return NextResponse.json({ error: 'Missing albumName' }, { status: 400 });
    }
    const album = await prisma.album.findFirst({
      where: {
        name: albumName,
      },
      select: { id: true, name: true },
    });

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    return NextResponse.json(album, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal error: ' + err },
      { status: 500 },
    );
  }
};

export { GET };
