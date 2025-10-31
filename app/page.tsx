"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface Artist {
   name: string;
   playcount: number;
   aliases: string[];
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

            // 1️⃣ Fetch Last.fm artists
            const lastFmRes = await fetch(
               `https://ws.audioscrobbler.com/2.0/?method=library.getartists&user=${username}&api_key=${apiKey}&format=json`
            );
            if (!lastFmRes.ok)
               throw new Error("Failed to fetch Last.fm artists");
            const lastFmData = await lastFmRes.json();

            console.log(lastFmData.artists.artist.type);

            const lastFmArtists: Artist[] = lastFmData.artists.artist.map(
               (a: any) => ({
                  name: a.name,
                  playcount: parseInt(a.playcount),
                  aliases: [],
               })
            );

            // 2️⃣ Fetch aliases from your database (object with keys = artist names)
            const aliasRes = await fetch("/api/aliases");
            if (!aliasRes.ok) throw new Error("Failed to fetch aliases");
            const aliasList: Record<string, string[]> = await aliasRes.json();
            console.log("aliasList:", aliasList);

            // 3️⃣ Merge playcounts using canonical names
            const combinedCounts: Record<string, number> = {};

            lastFmArtists.forEach((artist) => {
               // Find canonical name: either the artist key itself or the key where this artist appears as an alias
               const canonicalName =
                  Object.keys(aliasList).find(
                     (key) =>
                        key === artist.name ||
                        aliasList[key].includes(artist.name)
                  ) || artist.name;

               // Add playcount to the canonical name
               combinedCounts[canonicalName] =
                  (combinedCounts[canonicalName] || 0) + artist.playcount;
            });

            // 4️⃣ Convert combinedCounts back into array for rendering
            const mergedArtists: Artist[] = Object.entries(combinedCounts).map(
               ([name, playcount]) => ({
                  name,
                  playcount,
                  aliases: aliasList[name] || [],
               })
            );

            setArtists(mergedArtists);
         } catch (err: any) {
            console.error(err);
            setError(err.message);
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
               🎧 All-Time Top Artists
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mb-8">
               Grouped by aliases
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
