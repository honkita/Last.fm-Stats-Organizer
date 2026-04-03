import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

const GET = async (): Promise<NextResponse> => {
  const redirects = await prisma.artistAlbumRedirect.findMany({
    include: {
      Album: true,
      FromArtist: true,
      ToArtist: true,
    },
  });

  const result: Record<string, Record<string, string>> = {};

  for (const row of redirects) {
    const from = row.FromArtist.name;
    const to = row.ToArtist.name;
    const album = row.Album.name;

    result[from] ??= {};
    result[from][album] = to;
  }

  return NextResponse.json(result);
};

export { GET };
