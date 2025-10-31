import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const API_KEY = process.env.NEXT_PUBLIC_LASTFM_API_KEY!;
const USERNAME = process.env.NEXT_PUBLIC_LASTFM_USERNAME!;
const API_URL = "https://ws.audioscrobbler.com/2.0/";

async function fetchLastFmArtists(username: string, apiKey: string) {
   const res = await fetch(
      `${API_URL}?method=user.gettopartists&user=${username}&api_key=${apiKey}&format=json&limit=1000`
   );
   const data = await res.json();
   return data.topartists?.artist || [];
}

export async function GET() {
   try {
      // 1️⃣ Fetch Last.fm artists
      const lastFmArtists: any[] = await fetchLastFmArtists(USERNAME, API_KEY);

      // 2️⃣ Fetch DB artists + aliases
      const dbArtists = await prisma.artist.findMany({
         include: { aliases: true },
      });

      // 3️⃣ Build alias → main artist mapping
      const aliasMap: Record<string, string> = {};
      for (const artist of dbArtists) {
         aliasMap[artist.name] = artist.name; // main name maps to itself
         for (const alias of artist.aliases) {
            aliasMap[alias.name] = artist.name; // alias maps to main name
         }
      }

      // 4️⃣ Merge Last.fm counts using alias map
      const combinedCounts: Record<string, number> = {};
      for (const artist of lastFmArtists) {
         const mainName = aliasMap[artist.name] || artist.name;
         combinedCounts[mainName] =
            (combinedCounts[mainName] || 0) + parseInt(artist.playcount, 10);
      }

      // 5️⃣ Build final array with aliases for UI
      const result = Object.entries(combinedCounts).map(([name, playcount]) => {
         const dbEntry = dbArtists.find((a) => a.name === name);
         const aliases = dbEntry ? dbEntry.aliases.map((a) => a.name) : [];
         return { name, playcount, aliases };
      });

      return NextResponse.json(result);
   } catch (err) {
      console.error("Fetch + DB merge error:", err);
      return NextResponse.json(
         { error: "Failed to fetch artists" },
         { status: 500 }
      );
   }
}
