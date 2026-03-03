import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const dbAlbumsMap: Record<string, Record<string, string[]>> = {};

/**
 * Gets the albums from the database and stores them in a global variable for caching.
 * @returns
 */
const GET = async (): Promise<
   NextResponse<Record<string, Record<string, string[]>>>
> => {
   const dbArtistAlbums = await prisma.artistAlbum.findMany({
      select: {
         Artist: {
            select: {
               name: true,
            },
         },
         Albums: {
            select: {
               id: true,
               name: true,
               aliases: true,
            },
         },
         role: true,
      },
   });

   dbArtistAlbums.forEach((album) => {
      const artistName = album.Artist.name;
      const albumName = album.Albums.name;

      dbAlbumsMap[artistName] ??= {};

      let aliases: string[] = [];
      if (Array.isArray(album.Albums.aliases)) {
         aliases = album.Albums.aliases.filter(
            (a): a is string => typeof a === "string",
         );
      } else if (typeof album.Albums.aliases === "string") {
         try {
            const parsed = JSON.parse(album.Albums.aliases);
            if (Array.isArray(parsed))
               aliases = parsed.filter(
                  (a): a is string => typeof a === "string",
               );
         } catch {}
      }

      dbAlbumsMap[artistName][albumName] = aliases;
   });

   return NextResponse.json(dbAlbumsMap);
};

export { GET };
