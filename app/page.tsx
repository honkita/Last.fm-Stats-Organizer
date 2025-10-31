"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function Home() {
   const [artistCounts, setArtistCounts] = useState<Record<string, number>>({});
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);

   const API_KEY = process.env.NEXT_PUBLIC_LASTFM_API_KEY;
   const USERNAME = process.env.NEXT_PUBLIC_LASTFM_USERNAME;

   useEffect(() => {
      if (!API_KEY || !USERNAME) {
         setError("Missing Last.fm API credentials");
         setLoading(false);
         return;
      }

      const fetchData = async () => {
         try {
            // load local alias JSON
            // const aliasRes = await fetch("/artistGroups.json");

            // const aliasMap = aliasRes.ok ? await aliasRes.json() : {};

            const aliasRes = await fetch("/api/aliases");
            const aliasMap = aliasRes.ok ? await aliasRes.json() : {};

            // fetch all-time top artists
            const res = await fetch(
               `https://ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=${USERNAME}&api_key=${API_KEY}&format=json&limit=1000`
            );

            if (!res.ok) throw new Error("Failed to fetch Last.fm data");

            const json = await res.json();
            const artists = json.topartists?.artist || [];

            if (!Array.isArray(artists))
               throw new Error("Unexpected Last.fm response format");

            // Step 1: Build raw counts
            const rawCounts = artists.reduce(
               (acc: Record<string, number>, a: any) => {
                  const name = a.name || "Unknown Artist";
                  const playcount = Number(a.playcount) || 0;
                  acc[name] = playcount;
                  return acc;
               },
               {}
            );

            // Step 2: Merge according to aliasMap
            const mergedCounts: Record<string, number> = {};

            for (const [mainName, aliases] of Object.entries(aliasMap)) {
               let total = 0;

               // add main name if exists
               if (rawCounts[mainName]) total += rawCounts[mainName];

               // add all aliases
               for (const alias of aliases as string[]) {
                  if (rawCounts[alias]) total += rawCounts[alias];
               }

               if (total > 0) mergedCounts[mainName] = total;
            }

            // include any leftover artists not in alias map
            for (const [artist, count] of Object.entries(rawCounts)) {
               const isGrouped = Object.values(aliasMap).some((aliases) =>
                  (aliases as string[]).includes(artist)
               );
               const isMain = Object.keys(aliasMap).includes(artist);
               if (!isGrouped && !isMain) mergedCounts[artist] = count;
            }

            setArtistCounts(mergedCounts);
         } catch (err: any) {
            console.error("Error loading Last.fm data:", err);
            setError(err.message);
         } finally {
            setLoading(false);
         }
      };

      fetchData();
   }, [API_KEY, USERNAME]);

   if (loading)
      return (
         <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
            <p className="text-zinc-700 dark:text-zinc-300">
               Loading your Last.fm top artists…
            </p>
         </div>
      );

   if (error)
      return (
         <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
            <p className="text-red-600 dark:text-red-400">⚠️ {error}</p>
         </div>
      );

   const sortedArtists = Object.entries(artistCounts).sort(
      (a, b) => b[1] - a[1]
   );

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
               🎧 {USERNAME}&apos;s All-Time Top Artists
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mb-8">
               Grouped by aliases (e.g. Utada Hikaru = 宇多田ヒカル)
            </p>

            <div className="flex flex-col gap-4 w-full">
               {sortedArtists.map(([artist, count]) => (
                  <div
                     key={artist}
                     className="flex justify-between items-center rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 shadow-sm hover:shadow-md transition-all"
                  >
                     <span className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                        {artist}
                     </span>
                     <span className="text-zinc-600 dark:text-zinc-400">
                        {count.toLocaleString()} listens
                     </span>
                  </div>
               ))}
            </div>
         </main>
      </div>
   );
}
