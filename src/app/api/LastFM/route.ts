import { NextResponse } from "next/server";

// Lib
import { prisma } from "@/lib/prisma";

// Utils
import { getAlbums } from "@/utils/databaseAlbums";
import { getArtists } from "@/utils/databaseArtists";
import { addAlbumMapping, getAlbumName } from "@/utils/albumMapping";
import { normalizeArtistFull } from "@/utils/normalizeName";

// Types
import type { Artist as DBArtist } from "@prisma/client";
import type {
   dbArtistMapType,
   artistAlbumContainerMapType,
   artistCleanAlbumsMapType,
   artistAlbumTopAlbum,
} from "@/types/Music";
import type {
   lfmArtist,
   lfmAlbum,
   lfmArtistAlbumMapType,
   lfmAlbumMapType,
} from "@/types/LastFM";

// Environment Variables
const API_KEY = process.env.NEXT_PUBLIC_LASTFM_API_KEY!;
const API_URL = "https://ws.audioscrobbler.com/2.0/";

// TEMPORARY FIX FOR SOME ARTISTS (FUCKING LAST.FM)

const mapping: Record<string, string> = {
   "Triple S": "tripleS",
   "Baby Monster": "BABYMONSTER",
   에일리: "Ailee",
};

/**
 * Fetches all pages concurrently
 * @param url
 * @param totalPages
 * @returns Promise<any[]>
 */
const fetchAllPages = async <T>(
   url: string,
   totalPages: number,
): Promise<T[]> => {
   const promises: Promise<T>[] = [];

   for (let p = 2; p <= totalPages; p++) {
      promises.push(
         fetch(url + `&page=${p}`).then((r) => r.json() as Promise<T>),
      );
   }

   return Promise.all(promises);
};

/**
 * Fetches all items from Last.fm
 * @param method
 * @param username
 * @param apiKey
 * @returns Promise<T[]>
 */
const fetchAllLastFm = async <T>(
   method: string,
   username: string,
   apiKey: string,
): Promise<T[]> => {
   const baseURL = `${API_URL}?method=${method}&user=${username}&api_key=${apiKey}&format=json&limit=1000`;

   const first = await fetch(baseURL + "&page=1").then((r) => r.json());

   const items: T[] = [];
   let totalPages = 1;

   if (method === "user.gettopartists") {
      const data = first as {
         topartists: {
            artist: T[];
            "@attr": { totalPages: string };
         };
      };

      items.push(...data.topartists.artist);
      totalPages = Number(data.topartists["@attr"].totalPages);
   } else {
      const data = first as {
         topalbums: {
            album: T[];
            "@attr": { totalPages: string };
         };
      };

      items.push(...data.topalbums.album);
      totalPages = Number(data.topalbums["@attr"].totalPages);
   }

   if (totalPages > 1) {
      const rest = await fetchAllPages<typeof first>(baseURL, totalPages);

      for (const page of rest) {
         if (method === "user.gettopartists") {
            const data = page as {
               topartists: { artist: T[] };
            };
            items.push(...data.topartists.artist);
         } else {
            const data = page as {
               topalbums: { album: T[] };
            };
            items.push(...data.topalbums.album);
         }
      }
   }

   return items;
};

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
               (a): a is string => typeof a === "string",
            );
         } else if (typeof artist.aliases === "string") {
            try {
               const parsed = JSON.parse(artist.aliases);
               if (Array.isArray(parsed))
                  aliases = parsed.filter(
                     (a): a is string => typeof a === "string",
                  );
            } catch {}
         }

         const aliasNorm = await Promise.all(
            aliases.map((a) =>
               normalizeArtistFull(a, artist.ignoreChineseCanonization),
            ),
         );

         const aliasNormNoChinese = artist.ignoreChineseCanonization
            ? await Promise.all(
                 aliases.map((a) => normalizeArtistFull(a, false)),
              )
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

/**
 * Builds the final result
 * @param merged
 * @param dbArtistMap
 * @param albums
 * @returns
 */
const buildResult = async (
   lfmArtistsMap: Record<string, number>,
   lfmAlbumMap: lfmAlbumMapType,
): Promise<lfmArtistAlbumMapType> => {
   const lfmArtistAlbumMap: lfmArtistAlbumMapType = {};

   for (const [artistName, playcount] of Object.entries(lfmArtistsMap)) {
      if (mapping[artistName]) {
         lfmArtistAlbumMap[mapping[artistName]] = {
            playcount: playcount,
            albums: {
               ...lfmArtistAlbumMap[mapping[artistName]]?.albums,
               ...lfmArtistAlbumMap[artistName]?.albums,
            },
         };
         lfmAlbumMap[mapping[artistName]] = {
            ...lfmAlbumMap[mapping[artistName]],
            ...lfmAlbumMap[artistName],
         };
      } else {
         lfmArtistAlbumMap[artistName] = {
            playcount: playcount,
            albums: lfmArtistAlbumMap[artistName]?.albums ?? {},
         };
         lfmAlbumMap[artistName] = {
            ...lfmAlbumMap[artistName],
         };
      }
   }

   for (const [artistName, lfmAlbum] of Object.entries(lfmAlbumMap)) {
      for (const [albumName, album] of Object.entries(lfmAlbum)) {
         // Remove the - Single or - EP suffixes for better matching
         const removed = String(
            albumName
               .replace(
                  /\s*(-)\s*(Single|EP|single|ep|\(Deluxe\)|\(Deluxe Edition\))$/i,
                  "",
               )
               .replace(
                  /\s*(Single|EP|single|ep|\(Deluxe\)|\(Deluxe Edition\))$/i,
                  "",
               )
               .replace(/\s*\s*(ep)$/i, "")
               .trim(),
         );

         const cleanedName = String(
            albumName
               .replace(
                  /\s+(-)\s+(Single|EP|single|ep|\(Deluxe\)|\(Deluxe Edition\))$/i,
                  "",
               )
               .replace(
                  /\s+(Single|EP|single|ep|\(Deluxe\)|\(Deluxe Edition\))$/i,
                  "",
               )
               .replace(/\s+(ep)$/i, "")
               .trim()
               .toLowerCase(),
         );

         addAlbumMapping(cleanedName, removed);

         // Check if the name of the artist exists in the lfmArtistsMap
         if (lfmArtistAlbumMap[artistName]) {
            // Check if the artist already has the album
            if (
               lfmArtistAlbumMap[artistName].albums[String(cleanedName)] !==
               undefined
            ) {
               // If it exists, accumulate the playcount
               lfmArtistAlbumMap[artistName].albums[
                  String(cleanedName)
               ].playcount =
                  Number(
                     lfmArtistAlbumMap[artistName].albums[String(cleanedName)]
                        .playcount,
                  ) + Number(album.playcount);

               // Will need to add the album image checker later, but will leave out for now.....
            } else {
               lfmArtistAlbumMap[artistName].albums[String(cleanedName)] =
                  album;
            }
         } else {
            // If the artist does not exist, create a new entry
         }
      }
   }

   return lfmArtistAlbumMap;
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
   for (const [artistName, albums] of Object.entries(lfmAlbumMap)) {
      // Construct alias maps
      const aliasMap: Record<string, string> = {};

      for (const albumName of Object.keys(albums)) {
         const aliasNorms = albums[albumName];
         aliasNorms.forEach((a) => {
            aliasMap[a.toLowerCase()] = albumName;
         });

         // Add album name itself to the alias map
         if (albumName.toLowerCase() != albumName) {
            aliasMap[albumName.toLowerCase()] = albumName;
         }
      }

      // Iterate through mergedAlbumArtists to normalize albums
      for (const [oldName, normalizedName] of Object.entries(aliasMap)) {
         // If the old album name exists in the artist's albums
         try {
            if (mergedAlbumArtists[artistName]["albums"][oldName]) {
               mergedAlbumArtists[artistName]["albums"][normalizedName] = {
                  playcount:
                     Number(
                        mergedAlbumArtists[artistName]["albums"][oldName]
                           .playcount,
                     ) +
                     Number(
                        mergedAlbumArtists[artistName]["albums"][normalizedName]
                           ?.playcount ?? 0,
                     ),
                  image:
                     mergedAlbumArtists[artistName]["albums"][normalizedName]
                        ?.image ??
                     mergedAlbumArtists[artistName]["albums"][oldName].image ??
                     "",
               };

               // Remove the old album entry
               delete mergedAlbumArtists[artistName]["albums"][oldName];
            } else {
               let mainName: string | undefined = aliasMap[oldName];

               if (!mainName) {
                  const asciiLower = (str: string) =>
                     str.replace(/[A-Za-z]/g, (c) => c.toLowerCase());
                  const canonAscii = asciiLower(oldName);
                  for (const dbCanon of Object.keys(albums)) {
                     if (asciiLower(dbCanon).includes(canonAscii)) {
                        mainName = aliasMap[dbCanon];
                        break;
                     }
                  }
               }
            }
         } catch {
            // If the album does not exit for this artist, skip for now
            // Because some artists participate in albums, but I don't listen to the songs
         }
      }
   }

   // Fix the album titles using the name mapping
   for (const [artistName, data] of Object.entries(mergedAlbumArtists)) {
      const updatedAlbums: artistCleanAlbumsMapType = {};
      for (const [albumName, albumData] of Object.entries(data.albums)) {
         const mappedName = getAlbumName(albumName) || albumName;
         updatedAlbums[mappedName] = albumData;
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
      const result: artistAlbumContainerMapType = {};

      // Initialization
      for (const splitName of Object.keys(data)) {
         result[splitName] = {
            id: mergedNormalized[originalName]?.id || -1,
            playcount: 0,
            ignoreChinese:
               mergedNormalized[originalName]?.ignoreChinese || false,
            albums: {},
         };
      }
      // Create a map for quick lookup (album name to split name)
      const albumToSplitMap: Record<string, string> = {};
      for (const [splitName, albums] of Object.entries(data)) {
         albums.forEach((album) => {
            albumToSplitMap[album] = splitName;
         });
      }
      let defaultPlaycount = Number(
         mergedNormalized[originalName]["playcount"],
      );

      const baseData = mergedNormalized[originalName];

      const defaultName = defaultArtist[originalName];
      for (const [albumName, albumData] of Object.entries(baseData.albums)) {
         // If the album belongs to a split artist, add the album to the list AND accumulate the playcount
         if (albumToSplitMap[albumName]) {
            const splitName = albumToSplitMap[albumName];
            const currentAlbums = result[splitName]?.albums || {};
            currentAlbums[albumName] = albumData;

            result[splitName]["playcount"] =
               result[splitName]["playcount"] + albumData.playcount;
            result[splitName]["albums"] = currentAlbums;
         } else {
            const currentAlbums = result[defaultName]?.albums || {};
            currentAlbums[albumName] = albumData;

            result[defaultName]["playcount"] =
               result[defaultName]["playcount"] + albumData.playcount;
            result[defaultName]["albums"] = currentAlbums;
         }
         defaultPlaycount -= albumData.playcount;
      }

      result[defaultName]["playcount"] =
         result[defaultName]["playcount"] + defaultPlaycount;

      // Remove the original artist entry and add the new entries to the merge normalized
      delete mergedNormalized[originalName];
      mergedNormalized = { ...result, ...mergedNormalized };
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
      let topAlbumImage = "";
      let highestPlaycount = -1;
      let topAlbumName = "";
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

/**
 * GET Handler
 * @returns NextResponse
 */
const GET = async (req: Request) => {
   const { searchParams } = new URL(req.url);
   const USERNAME = searchParams.get("user") || "";
   try {
      // Fetch DB Artists
      const [dbArtistAlbums, dbSameNames] = await Promise.all([
         prisma.artistAlbum.findMany({
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
         }),
         prisma.sameNames.findMany({
            select: {
               name: true,
               Artist: { select: { name: true } },
               isDefault: true,
               albumIDs: true,
            },
         }),
      ]);

      // Hash map for default artist names
      const defaultArtist: Record<string, string> = {};

      // Hash map for same artist names (Lisa, Bibi, etc.)
      const sameNameMap: Record<string, Record<string, string[]>> = {};

      // Hash map for quick artist lookup
      const dbArtistMap: Record<string, DBArtist> = await getArtists();

      // Hash map for album names
      const albumMap: Record<number, string> = await getAlbums();

      dbSameNames.forEach((dbSameName) => {
         const displayName = dbSameName.name;
         const originalName = dbSameName.Artist.name;
         const isDefault = dbSameName.isDefault;

         sameNameMap[originalName] ??= {};

         let aliases: number[] = [];
         if (Array.isArray(dbSameName.albumIDs)) {
            aliases = dbSameName.albumIDs.filter(
               (a): a is number => typeof a === "number",
            );
         } else if (typeof dbSameName.albumIDs === "string") {
            try {
               const parsed = JSON.parse(dbSameName.albumIDs);
               if (Array.isArray(parsed))
                  aliases = parsed.filter(
                     (a): a is number => typeof a === "number",
                  );
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

      const dbAlbumsMap: Record<string, Record<string, string[]>> = {};

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

      const [lfmArtists, lfmAlbums] = await Promise.all([
         fetchAllLastFm<lfmArtist>("user.gettopartists", USERNAME, API_KEY),
         fetchAllLastFm<lfmAlbum>("user.gettopalbums", USERNAME, API_KEY),
      ]);
      // Organize the fetched artists and albums into desired structure with hashmap
      const lfmArtistMap: Record<string, number> = {};
      lfmArtists.forEach(
         (artist) => (lfmArtistMap[artist.name] = artist.playcount),
      );

      const lfmAlbumMap: lfmAlbumMapType = {};
      lfmAlbums.forEach((album) => {
         const artist = album.artist.name;
         const name = album.name;
         lfmAlbumMap[artist] ??= {};

         lfmAlbumMap[artist][name] = {
            image: album.image[album.image.length - 1]["#text"],
            playcount: Number(album.playcount),
         };
      });

      // Split artists based on default and same name mappings
      const splitArtistList = await splitArtists(
         await albumNormalization(
            await mergeArtists(
               await buildResult(lfmArtistMap, lfmAlbumMap),
               dbArtistMap,
            ),
            dbAlbumsMap,
         ),
         defaultArtist,
         sameNameMap,
      );

      // USE THIS FOR DEBUGGING ARTISTS AND FOR DATABASE FIXING
      // console.log(Object.keys(splitArtistList["米津玄師"]["albums"]).sort());

      // let p = 0;

      // // Print out the sum of the scrobbles

      // Object.values(splitArtistList).forEach((artist) => {
      //   p += artist.playcount;
      // });
      // console.log("Total Scrobbles:", p);

      // Determine the most listened to album for each artist
      const bestAlbum = await getBestAlbum(splitArtistList);

      return NextResponse.json({
         "Best Albums": bestAlbum,
         "All Data": splitArtistList,
      });
   } catch (err) {
      console.error("Fetch + merge error:", err);
      return NextResponse.json(
         { error: "Failed to fetch and merge artists" },
         { status: 500 },
      );
   }
};

export { GET };
