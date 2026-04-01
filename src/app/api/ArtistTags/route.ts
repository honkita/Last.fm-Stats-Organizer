import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

/**
 * Gets the artist tags from the database
 * Returns both global and split tags
 */
const GET = async (): Promise<NextResponse> => {
  // Fetch all artist tags with Tag info
  const dbArtistTags = await prisma.artistTag.findMany({
    include: {
      Artist: {
        select: {
          name: true,
        },
      },
      SameNames: {
        select: {
          name: true,
        },
      },
      Tag: true,
    },
  });

  // Build structured map
  const result: Record<
    string, // artistName
    string[]
  > = {};

  for (const at of dbArtistTags) {
    const artistName = at.SameNames?.name || at.Artist.name;
    const tagName = at.Tag.name;

    if (!result[artistName]) {
      result[artistName] = [];
    }

    result[artistName].push(tagName);
  }

  console.log(result);

  return NextResponse.json(result);
};

export { GET };
