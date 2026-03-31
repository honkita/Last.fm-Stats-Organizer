// Utils
import {
  normalizeArtistFull,
  normalizeAlbumFull,
  canonicalAlbumKey,
} from '@/utils/normalizeName';
import { fetchAllPages } from '@/utils/userTracks';

// Types
import type { Artist as DBArtist } from '@prisma/client';
import type {
  dbArtistMapType,
  artistAlbumContainerMapType,
  artistCleanAlbumsMapType,
  artistAlbumTopAlbum,
} from '@/types/Music';
import type { lfmArtistAlbumMapType } from '@/types/LastFM';

type SameNames = {
  name: string;
  Artist: { name: string };
  albumIDs: number[] | string;
  isDefault: boolean;
};

// Non normalized names

const LIMIT = 1000;

const nonNormalizedAlbumNames: Record<string, string> = {};

interface lfmRecentTrack {
  artist: { '#text': string };
  album: { '#text': string };
  name: string;
  image?: { '#text': string }[];
  date?: { uts: string };
}

/**
 * Merges the artists
 * @param lfmArtistMap
 * @param dbArtistMap
 * @returns
 */
const mergeArtists = async (
  lfmArtistAlbumMap: lfmArtistAlbumMapType,
  dbArtistMap: dbArtistMapType,
): Promise<artistAlbumContainerMapType> => {
  // Maps ALL the aliases
  const aliasMap: Record<string, string> = {};

  const asciiLower = (str: string) =>
    str.replace(/[A-Za-z]/g, (c) => c.toLowerCase());

  const normalizedDbPromises = Object.values(dbArtistMap).map(
    async (artist) => {
      const nameNorm = await normalizeArtistFull(
        artist.name,
        artist.ignoreChineseCanonization,
      );

      let aliases: string[] = [];

      if (Array.isArray(artist.aliases)) {
        aliases = artist.aliases.filter(
          (a): a is string => typeof a === 'string',
        );
      } else if (typeof artist.aliases === 'string') {
        try {
          const parsed = JSON.parse(artist.aliases);
          if (Array.isArray(parsed))
            aliases = parsed.filter((a): a is string => typeof a === 'string');
        } catch {}
      }

      // Handles cases where the artist name itself contains an alias in parentheses
      const parenthesisMatch = artist.name.match(/^(.+?)\s*\((.+?)\)\s*$/);
      const isComposition = /[&,，,、＋+×]/.test(artist.name);
      if (parenthesisMatch && !isComposition) {
        const mainName = parenthesisMatch[1].trim();
        const aliasName = parenthesisMatch[2].trim();

        // Add the alias from parentheses if it's not empty
        if (aliasName) {
          aliases.push(aliasName);
          aliases.push(mainName);
        }
      }

      const aliasNorm = await Promise.all(
        aliases.map((a) =>
          normalizeArtistFull(a, artist.ignoreChineseCanonization),
        ),
      );

      const aliasNormNoChinese = artist.ignoreChineseCanonization
        ? await Promise.all(aliases.map((a) => normalizeArtistFull(a, false)))
        : [];

      const combinedAliasNorm = [...aliasNorm, ...aliasNormNoChinese];

      return {
        id: artist.id,
        name: artist.name,
        ignoreChinese: artist?.ignoreChineseCanonization,
        nameNorm,
        combinedAliasNorm,
      };
    },
  );

  const normalizedDb = await Promise.all(normalizedDbPromises);

  normalizedDb.forEach(({ name, nameNorm, combinedAliasNorm }) => {
    aliasMap[nameNorm] = name;
    combinedAliasNorm.forEach((a) => (aliasMap[a] = name));
  });

  /**
   * Penalty function for sorting
   * If it is a composition of two artists, increase the cost
   * @param name
   * @returns
   */
  const penalty: (name: string) => number = (name: string) => {
    const matches = name.match(/[&,，,、＋+×]/g);
    return matches ? matches.length + 1 : 1;
  };

  /**
   * Sort the DB canon names based on length and penalty, so that when we do the ascii includes matching, we are more likely to match the correct artist first (e.g. Don't want "Queen" to match "Freddie Mercury" before "Queen")
   * @param a
   * @param b
   * @returns
   */
  const sortedDbCanonNames = Object.keys(aliasMap).sort((a, b) => {
    const pa = penalty(a);
    const pb = penalty(b);
    return a.length * pa - b.length * pb;
  });

  const merged: artistAlbumContainerMapType = {};

  for (const [artistName, information] of Object.entries(lfmArtistAlbumMap)) {
    const dbRow = dbArtistMap[artistName];
    const canonName = await normalizeArtistFull(
      artistName,
      dbRow?.ignoreChineseCanonization ?? false,
    );

    let mainName: string | undefined = aliasMap[canonName];

    if (!mainName) {
      const canonAscii = asciiLower(canonName);
      for (const dbCanon of sortedDbCanonNames) {
        if (asciiLower(dbCanon).includes(canonAscii)) {
          mainName = aliasMap[dbCanon];
          break;
        }
      }
      if (dbRow?.ignoreChineseCanonization) {
        const canonName2 = await normalizeArtistFull(artistName, false);
        const canonAscii2 = asciiLower(canonName2);
        for (const dbCanon of sortedDbCanonNames) {
          if (asciiLower(dbCanon).includes(canonAscii2)) {
            mainName = aliasMap[dbCanon];
            break;
          }
        }
      }
    }
    mainName = mainName || artistName;

    if (!merged[mainName])
      merged[mainName] = {
        playcount: 0,
        albums: {},
        ignoreChinese: false,
        id: dbArtistMap[mainName]?.id || -1,
      };

    merged[mainName].playcount += Number(information.playcount);

    // Merge albums

    const mergedAlbums = <artistCleanAlbumsMapType>{};
    for (const [name, value] of Object.entries(merged[mainName].albums)) {
      mergedAlbums[name] = {
        playcount:
          (mergedAlbums[name]?.playcount ?? 0) + Number(value.playcount),
        image: value.image,
      };
    }
    for (const [name, value] of Object.entries(information.albums)) {
      mergedAlbums[name] = {
        playcount:
          (mergedAlbums[name]?.playcount ?? 0) + Number(value.playcount),
        image: value.image,
      };
    }

    merged[mainName].albums = mergedAlbums;
  }

  return merged;
};

const normalizeForDistance = (s: string) =>
  s.replace(/[^a-z0-9]/gi, '').toLowerCase();

const levenshtein = (a: string, b: string): number => {
  const dp = Array.from({ length: a.length + 1 }, () =>
    Array(b.length + 1).fill(0),
  );

  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;

      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }

  return dp[a.length][b.length];
};

const similarityScore = (a: string, b: string): number => {
  const na = normalizeForDistance(a);
  const nb = normalizeForDistance(b);

  if (!na.length || !nb.length) return 0;

  const dist = levenshtein(na, nb);
  return 1 - dist / Math.max(na.length, nb.length);
};

/**
 * Normalizes albums and groups based on aliases
 * @param mergedAlbumArtists
 * @param lfmAlbumMap
 * @returns
 */
const albumNormalization = async (
  mergedAlbumArtists: artistAlbumContainerMapType,
  lfmAlbumMap: Record<string, Record<string, string[]>>,
): Promise<artistAlbumContainerMapType> => {
  for (const [artistName, artistData] of Object.entries(mergedAlbumArtists)) {
    const albums = artistData.albums;

    // Build alias map for this artist
    const aliasMap: Record<string, string> = {};

    const dbAlbums = lfmAlbumMap[artistName] || {};

    for (const [albumName, aliasList] of Object.entries(dbAlbums)) {
      const normalized = normalizeAlbumFull(albumName);

      aliasList.forEach((alias) => {
        aliasMap[canonicalAlbumKey(alias)] = normalized;
      });

      aliasMap[canonicalAlbumKey(albumName)] = normalized;
    }

    const updatedAlbums: artistCleanAlbumsMapType = {};

    for (const [albumKey, albumData] of Object.entries(albums)) {
      let targetName: string | undefined;

      // 1. Exact alias match
      if (aliasMap[albumKey]) {
        targetName = aliasMap[albumKey];
      } else {
        // 2. Levenshtein fallback ONLY if no alias matc

        const DISTANCE_THRESHOLD = 3;
        const SIMILARITY_THRESHOLD = 0.82; // tune: 0.8–0.9 typical

        let bestMatch: string | null = null;
        let bestDistance = Infinity;
        let bestSimilarity = 0;

        for (const aliasKey of Object.keys(aliasMap)) {
          const dist = levenshtein(albumKey, aliasKey);
          const sim = similarityScore(albumKey, aliasKey);

          // prioritize similarity first, then distance as tiebreaker
          if (
            sim > bestSimilarity ||
            (sim === bestSimilarity && dist < bestDistance)
          ) {
            bestSimilarity = sim;
            bestDistance = dist;
            bestMatch = aliasKey;
          }
        }

        // STRICT merge condition
        if (
          bestMatch &&
          bestDistance <= DISTANCE_THRESHOLD &&
          bestSimilarity >= SIMILARITY_THRESHOLD
        ) {
          targetName = aliasMap[bestMatch];
        }
      }

      // 4. Merge OR keep original
      const finalName =
        targetName || nonNormalizedAlbumNames[albumKey] || albumKey;

      updatedAlbums[finalName] = {
        playcount:
          (updatedAlbums[finalName]?.playcount ?? 0) + albumData.playcount,
        image: updatedAlbums[finalName]?.image || albumData.image,
      };
    }

    mergedAlbumArtists[artistName].albums = updatedAlbums;
  }

  return mergedAlbumArtists;
};

/**
 * Splits artists based on same name mappings
 * @param mergedNormalized
 * @param defaultArtist
 * @param sameNameMap
 * @returns
 */
const splitArtists = async (
  mergedNormalized: artistAlbumContainerMapType,
  defaultArtist: Record<string, string> = {},
  sameNameMap: Record<string, Record<string, string[]>>,
): Promise<artistAlbumContainerMapType> => {
  for (const [originalName, data] of Object.entries(sameNameMap)) {
    const baseData = mergedNormalized[originalName];
    if (!baseData) {
      // If no albums exist for the original artist, just remove it and skip
      delete mergedNormalized[originalName];
      continue;
    }

    const result: artistAlbumContainerMapType = {};

    const defaultName = defaultArtist[originalName] || originalName;

    // Create a map of album -> split artist
    const albumToSplitMap: Record<string, string> = {};
    for (const [splitName, albums] of Object.entries(data)) {
      if (!Array.isArray(albums)) continue;
      albums.forEach((album) => (albumToSplitMap[album] = splitName));
    }

    let defaultPlaycount = baseData.playcount;

    for (const [albumName, albumData] of Object.entries(baseData.albums)) {
      const targetName = albumToSplitMap[albumName] || defaultName;

      // Initialize the split artist only if needed
      if (!result[targetName]) {
        result[targetName] = {
          id: baseData.id,
          playcount: 0,
          ignoreChinese: baseData.ignoreChinese,
          albums: {},
        };
      }

      result[targetName].albums[albumName] = albumData;
      result[targetName].playcount += albumData.playcount;

      defaultPlaycount -= albumData.playcount;
    }

    // Add any remaining default playcount to defaultName
    if (!result[defaultName]) {
      result[defaultName] = {
        id: baseData.id,
        playcount: 0,
        ignoreChinese: baseData.ignoreChinese,
        albums: {},
      };
    }
    result[defaultName].playcount += defaultPlaycount;

    // Remove the original artist and merge new split artists
    delete mergedNormalized[originalName];

    // Only add split artists that have albums or playcount > 0
    for (const [name, info] of Object.entries(result)) {
      if (info.playcount > 0 || Object.keys(info.albums).length > 0) {
        mergedNormalized[name] = info;
      }
    }
  }

  return mergedNormalized;
};

/**
 * Gets the best album for each split artist
 * @param merged
 * @returns
 */
const getBestAlbum = async (
  merged: artistAlbumContainerMapType,
): Promise<artistAlbumTopAlbum[]> => {
  const result: artistAlbumTopAlbum[] = [];

  for (const [artistName, data] of Object.entries(merged)) {
    let topAlbumImage = '';
    let highestPlaycount = -1;
    let topAlbumName = '';
    for (const [albumName, album] of Object.entries(data.albums)) {
      if (album.playcount > highestPlaycount) {
        highestPlaycount = album.playcount;
        topAlbumImage = album.image;
        topAlbumName = albumName;
      }
    }
    result.push({
      name: artistName,
      id: data.id,
      playcount: data.playcount,
      ignoreChinese: data.ignoreChinese,
      topAlbumImage: topAlbumImage,
      albumName: topAlbumName,
    });
  }
  return result;
};

const buildFromTracks = (
  tracks: lfmRecentTrack[],
): artistAlbumContainerMapType => {
  const result: artistAlbumContainerMapType = {};

  for (const track of tracks) {
    const rawArtist = track.artist['#text'];
    const albumRaw = normalizeAlbumFull(track.album['#text'] || '');

    if (!albumRaw) continue;

    const artistName = rawArtist;

    result[artistName] ??= {
      id: -1,
      playcount: 0,
      ignoreChinese: false,
      albums: {},
    };

    result[artistName].playcount += 1;

    const cleanedAlbum = canonicalAlbumKey(track.album['#text'] || '');

    result[artistName].albums[cleanedAlbum] ??= {
      playcount: 0,
      image: track.image?.[track.image.length - 1]?.['#text'] ?? '',
    };

    nonNormalizedAlbumNames[cleanedAlbum] = albumRaw;

    result[artistName].albums[cleanedAlbum].playcount += 1;
  }

  return result;
};

/**
 *
 * @param USERNAME
 * @returns
 */
export const getUserInfo = async (
  USERNAME: string,
  onProgress?: (current: number, total: number) => void,
) => {
  try {
    // Fetch DB Artists

    const dbAlbums = await fetch('/api/ArtistAlbum');
    if (!dbAlbums.ok) throw new Error('Failed to fetch artist albums');
    const dbAlbumsMap: Record<
      string,
      Record<string, string[]>
    > = await dbAlbums.json();

    const dbSameNamesFetch = await fetch('/api/SameName');
    if (!dbSameNamesFetch.ok)
      throw new Error('Failed to fetch same name mappings');
    const dbSameNames: SameNames[] = await dbSameNamesFetch.json();

    // Hash map for default artist names
    const defaultArtist: Record<string, string> = {};

    // Hash map for same artist names (Lisa, Bibi, etc.)
    const sameNameMap: Record<string, Record<string, string[]>> = {};

    // Hash map for quick artist lookup
    const dbArtistsResponse = await fetch('/api/Artist');
    if (!dbArtistsResponse.ok) throw new Error('Failed to fetch artists');
    const dbArtistMap: Record<string, DBArtist> =
      await dbArtistsResponse.json();

    // Hash map for album names
    const albumFetch = await fetch('/api/Albums');
    if (!albumFetch.ok) throw new Error('Failed to fetch albums');
    const albumMap: Record<number, string> = await albumFetch.json();

    dbSameNames.forEach((dbSameName) => {
      const displayName = dbSameName.name;
      const originalName = dbSameName.Artist.name;
      const isDefault = dbSameName.isDefault;

      sameNameMap[originalName] ??= {};

      let aliases: number[] = [];
      if (Array.isArray(dbSameName.albumIDs)) {
        aliases = dbSameName.albumIDs.filter(
          (a): a is number => typeof a === 'number',
        );
      } else if (typeof dbSameName.albumIDs === 'string') {
        try {
          const parsed = JSON.parse(dbSameName.albumIDs);
          if (Array.isArray(parsed))
            aliases = parsed.filter((a): a is number => typeof a === 'number');
        } catch {}
      }

      const aliaseNames = aliases
        .map((id) => albumMap[Number(id)])
        .filter((a) => a);

      sameNameMap[originalName][displayName] = aliaseNames;

      if (isDefault) {
        defaultArtist[originalName] = displayName;
      }
    });

    const userData = await fetchAllPages(USERNAME, LIMIT, onProgress);

    if (!userData || userData.length === 0) {
      throw new Error(
        `Username "${USERNAME}" not found or has no recent tracks.`,
      );
    }

    const built = buildFromTracks(userData);

    // Split artists based on default and same name mappings
    const splitArtistList = await splitArtists(
      await albumNormalization(
        await mergeArtists(built, dbArtistMap),
        dbAlbumsMap,
      ),
      defaultArtist,
      sameNameMap,
    );

    const bestAlbum = await getBestAlbum(splitArtistList);

    return {
      'Best Albums': bestAlbum,
      'All Data': splitArtistList,
    };
  } catch {
    throw new Error('Failed to fetch user data for ' + USERNAME);
  }
};
