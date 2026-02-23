import "server-only";
import { prisma } from "@/lib/prisma";

// Types
import type { Artist } from "@prisma/client";

const dbArtists: Record<string, Artist> = {};

const globalForArtists = globalThis as unknown as {
  artists?: Record<string, Artist>;
};

/**
 * Gets the artists from the database and stores them in a global variable for caching.
 * @returns
 */
export const getArtists = async (): Promise<Record<string, Artist>> => {
  if (!globalForArtists.artists) {
    const artists = await prisma.artist.findMany();
    for (const artist of artists) {
      dbArtists[artist.name] = artist;
    }
    globalForArtists.artists = dbArtists;
  }
  return globalForArtists.artists!;
};
