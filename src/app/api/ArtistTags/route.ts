import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

/**
 * Gets the artist tags + hierarchy
 * Returns:
 * - tagMap (artist -> tags)
 * - tagHierarchy (parent-child relationships)
 */
const GET = async (): Promise<NextResponse> => {
  try {
    // Fetch artist tags
    const dbArtistTags = await prisma.artistTag.findMany({
      include: {
        Artist: {
          select: { name: true },
        },
        SameNames: {
          select: { name: true },
        },
        Tag: true,
      },
    });

    // Fetch tag hierarchy
    const dbHierarchy = await prisma.tagHierarchy.findMany({
      include: {
        parentTag: { select: { name: true } },
        childTag: { select: { name: true } },
      },
    });

    // Build artist -> tags map
    const tagMap: Record<string, string[]> = {};

    for (const at of dbArtistTags) {
      const artistName = at.SameNames?.name || at.Artist.name;
      const tagName = at.Tag.name;

      if (!tagMap[artistName]) {
        tagMap[artistName] = [];
      }

      tagMap[artistName].push(tagName);
    }

    // 4. Build hierarchy list
    const tagHierarchy = dbHierarchy.map((h) => ({
      parentTag: h.parentTag.name,
      childTag: h.childTag.name,
    }));

    return NextResponse.json({
      tagMap,
      tagHierarchy,
    });
  } catch (err) {
    console.error('ArtistTags API error:', err);
    return new NextResponse('Failed to fetch artist tags', { status: 500 });
  }
};

export { GET };
