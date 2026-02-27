"use client";

import {
   artistAlbumContainerMapType,
   artistAlbumTopAlbum,
} from "@/types/Music";
import { useState } from "react";

export default function Home() {
   const [username, setUsername] = useState("");
   const [submittedUser, setSubmittedUser] = useState<string | null>(null);

   const [artists, setArtists] = useState<Record<string, artistAlbumTopAlbum>>(
      {},
   );

   const [artistAlbums, setArtistAlbums] = useState<
      Record<string, artistAlbumContainerMapType>
   >({});

   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   const fetchArtists = async (user: string) => {
      try {
         setLoading(true);
         setError(null);

         const res = await fetch(
            `/api/LastFM?user=${encodeURIComponent(user)}`,
         );
         if (!res.ok) throw new Error("Failed to fetch artists");

         const call = await res.json();
         const artistAlbums = call["All Data"] as Record<
            string,
            artistAlbumContainerMapType
         >;
         setArtistAlbums(artistAlbums);
         const data = call["Best Albums"] as Record<
            string,
            artistAlbumTopAlbum
         >;
         setArtists(data);
      } catch (err: unknown) {
         if (err instanceof Error) setError(err.message);
         else setError("An unknown error occurred");
      } finally {
         setLoading(false);
      }
   };

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!username.trim()) return;

      const trimmedUser = username.trim();
      setSubmittedUser(trimmedUser);
      fetchArtists(trimmedUser);
   };

   const sortedArtists = Object.values(artists).sort(
      (a, b) => b.playcount - a.playcount,
   );

   return (
      <div className="flex min-h-screen justify-center bg-zinc-50 font-sans dark:bg-black">
         <main className="w-full max-w-3xl py-20 px-8 bg-white dark:bg-zinc-900">
            {/* Header */}
            <h1 className="text-3xl font-semibold text-black dark:text-zinc-50 mb-6">
               🎧 Last.fm Album Stats
            </h1>

            {/* Username Form */}
            <form onSubmit={handleSubmit} className="flex gap-3 mb-8">
               <input
                  type="text"
                  placeholder="Enter Last.fm username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-zinc-100"
               />
               <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-black text-white dark:bg-zinc-100 dark:text-black hover:opacity-90 transition"
               >
                  Load
               </button>
            </form>

            {/* Loading */}
            {loading && (
               <p className="text-zinc-600 dark:text-zinc-400">
                  Loading data for {submittedUser}…
               </p>
            )}

            {/* Error */}
            {error && (
               <p className="text-red-600 dark:text-red-400 mb-4">
                  Error: {error}
               </p>
            )}

            {/* Results */}
            {!loading && !error && sortedArtists.length > 0 && (
               <>
                  <h2 className="text-xl font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                     All-Time Top Artists ({sortedArtists.length})
                  </h2>

                  <div className="flex flex-col gap-4 w-full">
                     {sortedArtists.map((artist) => {
                        const name = artist.name;

                        const albumData = artistAlbums[name];
                        if (!albumData) return null; // defensive guard

                        const albumEntries = Object.entries(albumData.albums);
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
                                    .sort(
                                       (a, b) =>
                                          b[1].playcount - a[1].playcount,
                                    )
                                    .map(([albumName, album]) => (
                                       <div
                                          key={albumName}
                                          className="flex justify-between text-sm text-zinc-700 dark:text-zinc-300"
                                       >
                                          <span>{albumName}</span>
                                          <span>
                                             {album.playcount.toLocaleString()}{" "}
                                             plays
                                          </span>
                                       </div>
                                    ))}
                              </div>
                           </details>
                        );
                     })}
                  </div>
               </>
            )}
         </main>
      </div>
   );
}
