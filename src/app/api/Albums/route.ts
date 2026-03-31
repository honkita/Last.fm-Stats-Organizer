import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

const dbAlbums: Record<number, string> = {};

/**
 * Gets the albums from the database and stores them in a global variable for caching.
 * @returns
 */
const GET = async () => {
  const albums = await prisma.album.findMany({
    select: { id: true, name: true },
  });
  for (const album of albums) {
    dbAlbums[album.id] = album.name;
  }
  return NextResponse.json(dbAlbums);
};

export { GET };
