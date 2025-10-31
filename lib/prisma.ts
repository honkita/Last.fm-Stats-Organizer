// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

// global variable to survive HMR reloads
let prisma: PrismaClient;

declare global {
   // This is a TypeScript declaration so TS won't complain
   var __prisma: PrismaClient | undefined;
}

if (process.env.NODE_ENV === "production") {
   prisma = new PrismaClient();
} else {
   // In dev, reuse global variable to avoid multiple clients
   if (!global.__prisma) {
      global.__prisma = new PrismaClient({
         log: ["query"], // optional, helpful for debugging
      });
   }
   prisma = global.__prisma;
}

export { prisma };
