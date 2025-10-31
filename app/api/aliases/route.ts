// app/api/artists/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
   try {
      const artists = await prisma.artist.findMany({
         include: { aliases: true },
      });

      // Convert to a map: artist name -> array of alias names
      const aliasMap: Record<string, string[]> = {};
      for (const artist of artists) {
         aliasMap[artist.name] = artist.aliases.map((alias) => alias.name);
      }

      return NextResponse.json(aliasMap);
   } catch (err) {
      console.error("Prisma fetch error:", err);
      return NextResponse.json(
         { error: "Failed to fetch artists" },
         { status: 500 }
      );
   }
}
