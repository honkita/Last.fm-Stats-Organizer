import "server-only";
import { prisma } from "@/lib/prisma";

const dbAlbums: Record<number, string> = {};

const globalForAlbums = globalThis as unknown as {
  albums?: Record<number, string>;
};

/**
 * Gets the albums from the database and stores them in a global variable for caching.
 * @returns
 */
export const getAlbums = async (): Promise<Record<number, string>> => {
  if (!globalForAlbums.albums) {
    const albums = await prisma.album.findMany({
      select: { id: true, name: true },
    });
    for (const album of albums) {
      dbAlbums[album.id] = album.name;
    }
    globalForAlbums.albums = dbAlbums;
  }
  return globalForAlbums.albums!;
};
