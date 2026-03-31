import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

/**
 * Gets the artist tags from the database and stores them in a global variable for caching.
 * @returns
 */
const GET = async (): Promise<NextResponse<Record<string, string[]>>> => {
  const dbArtistTags = await prisma.artist.findMany({
    include: {
      ArtistTags: {
        include: {
          Tag: true,
        },
      },
    },
  });

  const result = Object.fromEntries(
    dbArtistTags.map((artist) => [
      artist.name,
      artist.ArtistTags.map((at) => at.Tag.name),
    ]),
  );

  return NextResponse.json(result);
};

export { GET };
