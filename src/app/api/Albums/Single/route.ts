// Next.js
import { NextRequest, NextResponse } from 'next/server';

// Prisma
import { prisma } from '@/lib/prisma';

// Utils
import { levenshtein, similarityScore } from '@/utils/levenshtein';
import { canonicalAlbumKey } from '@/utils/normalizeName';

type ArtistLite = {
  id: number;
  name: string;
};

type AlbumResult = {
  id: number;
  name: string;
  artists: ArtistLite[];
};

const DISTANCE_THRESHOLD = 3;
const SIMILARITY_THRESHOLD = 0.82;

function parseAliases(raw: unknown): string[] {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw.filter((a): a is string => typeof a === 'string');
  }

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((a): a is string => typeof a === 'string');
      }
    } catch {}
  }

  return [];
}

const GET = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const albumName = searchParams.get('albumName');

    if (!albumName) {
      return NextResponse.json({ error: 'Missing albumName' }, { status: 400 });
    }

    // Strict match
    const strictAlbums = await prisma.album.findMany({
      where: {
        name: albumName,
      },
      select: {
        id: true,
        name: true,
        AlbumsArtists: {
          select: {
            Artist: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (strictAlbums.length > 0) {
      const result: AlbumResult[] = strictAlbums.map((album) => ({
        id: album.id,
        name: album.name,
        artists: album.AlbumsArtists.map((aa) => aa.Artist),
      }));

      return NextResponse.json(result, { status: 200 });
    }

    // Load all albums
    const allAlbums = await prisma.album.findMany({
      select: {
        id: true,
        name: true,
        aliases: true,
        AlbumsArtists: {
          select: {
            Artist: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    // Build alias map
    const aliasMap: Record<string, AlbumResult[]> = {};

    for (const album of allAlbums) {
      const artists = album.AlbumsArtists.map((aa) => aa.Artist);

      const entry: AlbumResult = {
        id: album.id,
        name: album.name,
        artists,
      };

      const keys = [
        canonicalAlbumKey(album.name),
        ...parseAliases(album.aliases).map(canonicalAlbumKey),
      ];

      for (const key of keys) {
        if (!aliasMap[key]) aliasMap[key] = [];
        aliasMap[key].push(entry);
      }
    }

    const normalizedInput = canonicalAlbumKey(albumName);

    // Exact alias match
    if (aliasMap[normalizedInput]) {
      return NextResponse.json(aliasMap[normalizedInput], { status: 200 });
    }

    // Fuzzy match
    let bestMatches: AlbumResult[] = [];
    let bestSimilarity = 0;

    for (const [key, values] of Object.entries(aliasMap)) {
      const dist = levenshtein(normalizedInput, key);
      const sim = similarityScore(normalizedInput, key);

      if (dist <= DISTANCE_THRESHOLD && sim >= SIMILARITY_THRESHOLD) {
        if (sim > bestSimilarity) {
          bestSimilarity = sim;
          bestMatches = [...values];
        } else if (sim === bestSimilarity) {
          bestMatches.push(...values);
        }
      }
    }

    if (bestMatches.length > 0) {
      // Optional: dedupe by album id
      const deduped = Object.values(
        Object.fromEntries(bestMatches.map((a) => [a.id, a])),
      );

      return NextResponse.json(deduped, { status: 200 });
    }

    // No match
    return NextResponse.json([], { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal error: ' + err },
      { status: 500 },
    );
  }
};

export { GET };
