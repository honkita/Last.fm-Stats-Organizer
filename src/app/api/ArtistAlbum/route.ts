import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

const albumAliasMap: Record<string, Record<string, string[]>> = {};
const splitMap: Record<string, Record<string, string[]>> = {};
const defaultArtist: Record<string, string> = {};

interface ArtistAlbumResponse {
  albumAliasMap: Record<string, Record<string, string[]>>;
  splitMap: Record<string, Record<string, string[]>>;
  defaultArtist: Record<string, string>;
}

/**
 * Gets the albums from the database and stores them in a global variable for caching.
 * @returns
 */
const GET = async (): Promise<NextResponse<ArtistAlbumResponse>> => {
  const dbArtistAlbums = await prisma.artistAlbum.findMany({
    select: {
      Artist: {
        select: {
          name: true,
        },
      },
      Albums: {
        select: {
          name: true,
          aliases: true,
        },
      },
      SameNames: { select: { name: true, isDefault: true } },
      role: true,
    },
  });

  dbArtistAlbums.forEach((row) => {
    const baseArtist = row.Artist.name;
    const splitName = row.SameNames?.name ?? baseArtist;
    const albumName = row.Albums.name;

    // Album alias map
    albumAliasMap[splitName] ??= {};

    let aliases: string[] = [];
    if (Array.isArray(row.Albums.aliases)) {
      aliases = row.Albums.aliases.filter(
        (a): a is string => typeof a === 'string',
      );
    }

    albumAliasMap[baseArtist] ??= {};
    albumAliasMap[baseArtist][albumName] ??= [];

    albumAliasMap[baseArtist][albumName].push(...aliases);

    // Split map
    if (row.SameNames) {
      splitMap[baseArtist] ??= {};
      splitMap[baseArtist][splitName] ??= [];
      splitMap[baseArtist][splitName].push(albumName);

      if (row.SameNames.isDefault) {
        defaultArtist[baseArtist] = splitName;
      }
    }
  });

  return NextResponse.json({
    albumAliasMap,
    splitMap,
    defaultArtist,
  });
};

export { GET };
