import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Canonicalization function — keeps non-Latin letters intact
function canonicalizeName(name: string) {
   return name;
}

const API_KEY = process.env.NEXT_PUBLIC_LASTFM_API_KEY!;
const USERNAME = process.env.NEXT_PUBLIC_LASTFM_USERNAME!;
const API_URL = "https://ws.audioscrobbler.com/2.0/";

// Fetch all Last.fm artists with pagination
async function fetchAllLastFmArtists(username: string, apiKey: string) {
   let allArtists: any[] = [];
   let page = 1;
   let totalPages = 1;

   while (page <= totalPages) {
      const res = await fetch(
         `${API_URL}?method=user.gettopartists&user=${username}&api_key=${apiKey}&format=json&page=${page}&limit=1000`
      );
      if (!res.ok) throw new Error("Failed to fetch Last.fm artists");
      const data = await res.json();

      allArtists.push(...data.topartists.artist);
      totalPages = parseInt(data.topartists["@attr"].totalPages);
      page++;
   }

   return allArtists;
}

export async function GET() {
   try {
      // 1️⃣ Fetch Last.fm artists
      const lastFmArtists: any[] = await fetchAllLastFmArtists(
         USERNAME,
         API_KEY
      );

      // 2️⃣ Fetch DB artists
      const dbArtists = await prisma.artist.findMany();

      // 3️⃣ Build explicit alias → main name map
      const aliasMap: Record<string, string> = {};
      dbArtists.forEach((artist) => {
         const mainCanon = canonicalizeName(artist.name);
         aliasMap[mainCanon] = artist.name;

         const aliases: string[] = Array.isArray(artist.aliases)
            ? artist.aliases
            : [];
         aliases.forEach((alias) => {
            const canonAlias = canonicalizeName(alias);
            aliasMap[canonAlias] = artist.name;
         });
      });

      // 4️⃣ Merge Last.fm counts
      const combinedCounts: Record<string, number> = {};
      lastFmArtists.forEach((artist) => {
         const canonName = canonicalizeName(artist.name);

         // 4a: Try exact alias match first
         let mainName = aliasMap[canonName];

         // 4b: Fallback substring grouping if no alias match
         if (!mainName) {
            mainName = Object.keys(aliasMap).find(
               (dbCanon) =>
                  dbCanon.includes(canonName) || canonName.includes(dbCanon)
            );
         }

         mainName = mainName || artist.name;

         combinedCounts[mainName] =
            (combinedCounts[mainName] || 0) + parseInt(artist.playcount, 10);
      });

      // 5️⃣ Build final result with aliases
      const result = Object.entries(combinedCounts).map(([name, playcount]) => {
         const dbEntry = dbArtists.find((a) => a.name === name);
         const aliases: string[] =
            dbEntry && Array.isArray(dbEntry.aliases)
               ? (dbEntry.aliases as string[])
               : [];
         return { name, playcount, aliases };
      });

      // 6️⃣ Sort by playcount descending
      result.sort((a, b) => b.playcount - a.playcount);

      return NextResponse.json(result);
   } catch (err) {
      console.error("Fetch + merge error:", err);
      return NextResponse.json(
         { error: "Failed to fetch and merge artists" },
         { status: 500 }
      );
   }
}
