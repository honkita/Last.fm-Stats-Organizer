import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Types
import type { Artist } from "@prisma/client";

const dbArtists: Record<string, Artist> = {};

/**
 * Gets the artists from the database and stores them in a global variable for caching.
 * @returns
 */
const GET = async () => {
   const artists = await prisma.artist.findMany();
   for (const artist of artists) {
      dbArtists[artist.name] = artist;
   }

   return NextResponse.json(dbArtists);
};

export { GET };
