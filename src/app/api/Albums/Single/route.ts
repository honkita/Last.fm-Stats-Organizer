// Next.js
import { NextRequest, NextResponse } from 'next/server';

// Prisma
import { prisma } from '@/lib/prisma';

// Utils
import { canonicalAlbumKey } from '@/utils/normalizeName';
import { levenshtein, similarityScore } from '@/utils/stringSimilarity';

/**
 * Gets the albums from the database and stores them in a global variable for caching.
 * @returns
 */
const GET = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const albumName = searchParams.get('albumName');

    if (!albumName) {
      return NextResponse.json({ error: 'Missing albumName' }, { status: 400 });
    }

    // Strict Artist and Album name match (case-insensitive)
    const strictAlbums = await prisma.album.findMany({
      where: {
        name: albumName,
      },
      select: {
        id: true,
        name: true,
        Artist: {
          select: { id: true, name: true },
        },
      },
    });

    if (strictAlbums.length > 0) {
      return NextResponse.json(strictAlbums, { status: 200 });
    }

    // Alias and fuzzy matching logic
    const normalizedInput = canonicalAlbumKey(albumName);

    const allAlbums = await prisma.album.findMany({
      select: {
        id: true,
        name: true,
        aliases: true,
        Artist: {
          select: { id: true, name: true },
        },
      },
    });

    const aliasMap: Record<
      string,
      { id: number; name: string; artist: { id: number; name: string } }
    > = {};

    for (const album of allAlbums) {
      const canon = canonicalAlbumKey(album.name);

      aliasMap[canon] = {
        id: album.id,
        name: album.name,
        artist: album.Artist,
      };

      let aliases: string[] = [];

      if (Array.isArray(album.aliases)) {
        aliases = album.aliases.filter(
          (a): a is string => typeof a === 'string',
        );
      } else if (typeof album.aliases === 'string') {
        try {
          const parsed = JSON.parse(album.aliases);
          if (Array.isArray(parsed)) aliases = parsed;
        } catch {}
      }

      for (const alias of aliases) {
        aliasMap[canonicalAlbumKey(alias)] = {
          id: album.id,
          name: album.name,
          artist: album.Artist,
        };
      }
    }

    // Exact alias match (can be multiple, so collect)
    const aliasMatches = Object.entries(aliasMap)
      .filter(([key]) => key === normalizedInput)
      .map(([, value]) => value);

    if (aliasMatches.length > 0) {
      return NextResponse.json(aliasMatches, { status: 200 });
    }

    // Levenshtein + similarity match (with thresholds to avoid false positives)
    const DISTANCE_THRESHOLD = 3;
    const SIMILARITY_THRESHOLD = 0.82;

    let bestMatches: typeof aliasMatches = [];
    let bestSimilarity = 0;

    for (const [key, value] of Object.entries(aliasMap)) {
      const dist = levenshtein(normalizedInput, key);
      const sim = similarityScore(normalizedInput, key);

      if (dist <= DISTANCE_THRESHOLD && sim >= SIMILARITY_THRESHOLD) {
        if (sim > bestSimilarity) {
          bestSimilarity = sim;
          bestMatches = [value];
        } else if (sim === bestSimilarity) {
          bestMatches.push(value);
        }
      }
    }

    if (bestMatches.length > 0) {
      return NextResponse.json(bestMatches, { status: 200 });
    }

    // No matches found
    return NextResponse.json([], { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal error: ' + err },
      { status: 500 },
    );
  }
};

export { GET };
