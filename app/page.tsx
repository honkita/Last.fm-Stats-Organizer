"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { canonicalizeName } from "../utils/canonicalizeName";

interface Artist {
   name: string;
   playcount: number;
   aliases: string[];
}

interface LastFmArtist {
   name: string;
   playcount: string;
   mbid?: string;
   url?: string;
}

export default function Home() {
   const [artists, setArtists] = useState<Artist[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);

   useEffect(() => {
      const fetchArtists = async () => {
         try {
            const username = process.env.NEXT_PUBLIC_LASTFM_USERNAME!;
            const apiKey = process.env.NEXT_PUBLIC_LASTFM_API_KEY!;

            // 1️⃣ Fetch all Last.fm artists (handle pagination)
            const allArtists: LastFmArtist[] = [];
            let page = 1;
            let totalPages = 1;

            while (page <= totalPages) {
               const res = await fetch(
                  `https://ws.audioscrobbler.com/2.0/?method=library.getartists&user=${username}&api_key=${apiKey}&format=json&page=${page}`
               );
               if (!res.ok) throw new Error("Failed to fetch Last.fm artists");
               const data = await res.json();
               allArtists.push(...data.artists.artist);
               totalPages = parseInt(data.artists["@attr"].totalPages);
               page++;
            }

            const lastFmArtists: Artist[] = allArtists.map((a) => ({
               name: a.name,
               playcount: parseInt(a.playcount),
               aliases: [],
            }));

            // 2️⃣ Fetch alias list from DB
            const aliasRes = await fetch("/api/aliases");
            if (!aliasRes.ok) throw new Error("Failed to fetch aliases");
            const aliasList: Record<string, string[]> = await aliasRes.json();

            // 3️⃣ Fetch ignore lists
            const [ignoreCanonRes, ignoreGroupRes] = await Promise.all([
               fetch("/api/ignoreCanonicalization"),
               fetch("/api/ignoreGrouping"),
            ]);
            if (!ignoreCanonRes.ok || !ignoreGroupRes.ok)
               throw new Error("Failed to fetch ignore lists");

            const ignoreCanonicalization: string[] =
               await ignoreCanonRes.json();
            const ignoreGrouping: string[] = await ignoreGroupRes.json();

            // 4️⃣ Merge Last.fm artists using encapsulation logic
            const combinedCounts: Record<string, number> = {};

            lastFmArtists.forEach((artist) => {
               // Skip canonicalization if ignored
               const isIgnoredCanon = ignoreCanonicalization.includes(
                  artist.name
               );
               const canonName = isIgnoredCanon
                  ? artist.name
                  : canonicalizeName(artist.name);
               const canonLower = canonName.toLowerCase();

               // 4a. Find DB canonical name that fully contains Last.fm name or its alias
               const matchedDbName =
                  Object.keys(aliasList).find((dbName) => {
                     const dbLower = dbName.toLowerCase();

                     // Skip ignored DB names
                     if (ignoreGrouping.includes(dbName)) return false;

                     // Direct match or any alias contains the Last.fm name
                     return (
                        dbLower.includes(canonLower) ||
                        aliasList[dbName].some((alias) =>
                           alias.toLowerCase().includes(canonLower)
                        )
                     );
                  }) || canonName;

               // 4b. Add playcount to canonical DB name
               combinedCounts[matchedDbName] =
                  (combinedCounts[matchedDbName] || 0) + artist.playcount;
            });

            // 5️⃣ Build final artist list
            const mergedArtists: Artist[] = Object.entries(combinedCounts).map(
               ([name, playcount]) => ({
                  name,
                  playcount,
                  aliases: aliasList[name] || [],
               })
            );

            setArtists(mergedArtists);
         } catch (err: unknown) {
            if (err instanceof Error) setError(err.message);
            else setError("An unknown error occurred");
         } finally {
            setLoading(false);
         }
      };

      fetchArtists();
   }, []);

   if (loading)
      return (
         <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
            <p className="text-zinc-700 dark:text-zinc-300">
               Loading your artists…
            </p>
         </div>
      );

   if (error)
      return (
         <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
            <p className="text-red-600 dark:text-red-400">⚠️ {error}</p>
         </div>
      );

   const sortedArtists = artists.sort((a, b) => b.playcount - a.playcount);

   console.log(sortedArtists.slice(0, 100));

   return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
         <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-start py-20 px-8 bg-white dark:bg-zinc-900 sm:items-start">
            <Image
               className="dark:invert mb-6"
               src="/next.svg"
               alt="Next.js logo"
               width={100}
               height={20}
               priority
            />

            <h1 className="text-3xl font-semibold text-black dark:text-zinc-50 mb-2">
               🎧 All-Time Top Artists {sortedArtists.length}
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mb-8">
               Grouped using encapsulation with canonical database names
            </p>

            <div className="flex flex-col gap-4 w-full">
               {sortedArtists.map(({ name, playcount }) => (
                  <div
                     key={name}
                     className="flex justify-between items-center rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 shadow-sm hover:shadow-md transition-all"
                  >
                     <span className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                        {name}
                     </span>
                     <span className="text-zinc-600 dark:text-zinc-400">
                        {playcount.toLocaleString()} listens
                     </span>
                  </div>
               ))}
            </div>
         </main>
      </div>
   );
}
