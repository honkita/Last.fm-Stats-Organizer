// Next.js
import { NextRequest, NextResponse } from 'next/server';

// Prisma
import { prisma } from '@/lib/prisma';

const GET = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const artistName = searchParams.get('artistName');

    if (!artistName) {
      return NextResponse.json(
        { error: 'Missing artistName' },
        { status: 400 },
      );
    }
    console.log(artistName);

    // Search for the artist by name
    const artist = await prisma.artist.findFirst({
      where: {
        name: {
          equals: artistName,
        },
      },
      select: { id: true, name: true },
    });

    if (!artist) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
    }

    return NextResponse.json(artist, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal error: ' + err },
      { status: 500 },
    );
  }
};

export { GET };
