import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const main = async () => {
  const data: Record<string, string[]> = {
    "Utada Hikaru": ["宇多田ヒカル", "Hikaru Utada"],
    林憶蓮: ["Sandy Lam", "Lam Yik Lin"],
    ヨルシカ: ["Yorushika"],
    "i-dle": ["(G)I-DLE"],
    優里: ["Yuuri"],
    Ailee: ["에일리"],
    "MILGRAM カズイ (CV: 竹内良太)": ["カズイ (CV: 竹内良太)"],
    GFRIEND: ["여자친구"],
    Soojin: ["수진"],
  };

  for (const [artist, aliases] of Object.entries(data)) {
    try {
      await prisma.artist.create({
        data: {
          name: artist,
          aliases: {
            create: aliases.map((a) => ({ name: a })),
          },
        },
      });
      console.log(`Inserted artist: ${artist}`);
    } catch (err) {
      console.error(`Failed to insert ${artist}:`, err);
    }
  }
};

main()
  .catch((err) => {
    console.error("Seeding failed:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
