import { defineConfig, env } from "@prisma/config";
import * as dotenv from "dotenv";
dotenv.config(); // 👈 manually load .env before env() runs

export default defineConfig({
   engine: "classic",
   schema: "prisma/schema.prisma",
   migrations: {
      path: "prisma/migrations",
   },
   datasource: {
      url: env("DATABASE_URL"), // now correctly loaded
   },
});
