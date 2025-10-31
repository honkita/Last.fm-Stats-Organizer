import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
   const artists = await prisma.artist.findMany({
      include: { aliases: true },
   });

   // Convert to the same format as your old JSON
   const aliasMap: Record<string, string[]> = {};
   for (const a of artists) {
      aliasMap[a.name] = a.aliases.map((alias) => alias.name);
   }

   return Response.json(aliasMap);
}
