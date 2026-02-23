"use client";

import { useEffect, useState, useMemo } from "react";

interface Album {
   playcount: number;
   image?: string;
}

interface ArtistData {
   id: number;
   playcount: number;
   ignoreChinese: boolean;
   albums: Record<string, Album>;
}

interface ApiResponse {
   "Best Albums": string[];
   "All Data": Record<string, ArtistData>;
}

export default function Home() {
   const [artists, setArtists] = useState<Record<string, ArtistData>>({});
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);

   useEffect(() => {
      const fetchArtists = async () => {
         try {
            const res = await fetch("/api/LastFM");
            if (!res.ok) throw new Error("Failed to fetch artists");

            const data: ApiResponse = await res.json();
            setArtists(data["All Data"]);
         } catch (err: unknown) {
            if (err instanceof Error) setError(err.message);
            else setError("An unknown error occurred");
         } finally {
            setLoading(false);
         }
      };

      fetchArtists();
   }, []);

   const sortedArtists = useMemo(() => {
      return Object.entries(artists).sort(
         ([, a], [, b]) => b.playcount - a.playcount,
      );
   }, [artists]);

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

   return (
      <div className="flex min-h-screen justify-center bg-zinc-50 font-sans dark:bg-black">
         <main className="w-full max-w-3xl py-20 px-8 bg-white dark:bg-zinc-900">
            <h1 className="text-3xl font-semibold text-black dark:text-zinc-50 mb-2">
               🎧 All-Time Top Artists ({sortedArtists.length})
            </h1>

            <p className="text-zinc-600 dark:text-zinc-400 mb-8">
               Artist name, total listens, and number of albums listened.
            </p>

            <div className="flex flex-col gap-4 w-full">
               {sortedArtists.map(([name, artist]) => {
                  const albumEntries = Object.entries(artist.albums);
                  const albumCount = albumEntries.length;

                  return (
                     <details
                        key={name}
                        className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 shadow-sm hover:shadow-md transition-all"
                     >
                        <summary className="cursor-pointer flex justify-between items-center">
                           <div>
                              <span className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                                 {name}
                              </span>
                              <span className="ml-3 text-sm text-zinc-500 dark:text-zinc-400">
                                 {albumCount} albums
                              </span>
                           </div>

                           <span className="text-zinc-600 dark:text-zinc-400">
                              {artist.playcount.toLocaleString()} listens
                           </span>
                        </summary>

                        <div className="mt-4 flex flex-col gap-2">
                           {albumEntries
                              .sort((a, b) => b[1].playcount - a[1].playcount)
                              .map(([albumName, album]) => (
                                 <div
                                    key={albumName}
                                    className="flex justify-between text-sm text-zinc-700 dark:text-zinc-300"
                                 >
                                    <span>{albumName}</span>
                                    <span>
                                       {album.playcount.toLocaleString()} plays
                                    </span>
                                 </div>
                              ))}
                        </div>
                     </details>
                  );
               })}
            </div>
         </main>
      </div>
   );
}
