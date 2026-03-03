import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * Gets the albums from the database and stores them in a global variable for caching.
 * @returns
 */
const GET = async () => {
   const dbSameNames = await prisma.sameNames.findMany({
      select: {
         name: true,
         Artist: { select: { name: true } },
         isDefault: true,
         albumIDs: true,
      },
   });

   return NextResponse.json(dbSameNames);
};

export { GET };
