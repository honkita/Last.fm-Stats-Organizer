import { NextResponse } from "next/server";

// Environment Variables
const API_KEY = process.env.NEXT_PUBLIC_LASTFM_API_KEY!;
const API_URL = "https://ws.audioscrobbler.com/2.0/";

interface lfmRecentTrack {
   artist: { "#text": string };
   album: { "#text": string };
   name: string;
   image?: { "#text": string }[];
   date?: { uts: string };
}

interface LastFmResponse {
   recenttracks: {
      track: lfmRecentTrack[];
      "@attr": {
         page: string;
         totalPages: string;
      };
   };
}

const fetchWithTimeout = async <T>(url: string, ms = 30000): Promise<T> => {
   const controller = new AbortController();
   const timeout = setTimeout(() => controller.abort(), ms);

   try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
         throw new Error(`HTTP ${res.status}`);
      }
      return res.json() as Promise<T>;
   } finally {
      clearTimeout(timeout);
   }
};

const GET = async (req: Request) => {
   const { searchParams } = new URL(req.url);

   const username = searchParams.get("user");
   const page = searchParams.get("page") ?? "1";
   const limit = searchParams.get("limit") ?? "200";

   if (!username) {
      return NextResponse.json(
         { error: "Missing user parameter" },
         { status: 400 },
      );
   }

   const url =
      `${API_URL}?method=user.getrecenttracks` +
      `&user=${username}` +
      `&api_key=${API_KEY}` +
      `&format=json` +
      `&limit=${limit}` +
      `&page=${page}`;

   try {
      const data = await fetchWithTimeout<LastFmResponse>(url);

      const tracks = data.recenttracks.track.filter(
         (t) => t.date, // remove now-playing
      );

      return NextResponse.json({
         tracks,
         page: Number(data.recenttracks["@attr"].page),
         totalPages: Number(data.recenttracks["@attr"].totalPages),
      });
   } catch (err) {
      console.error("Last.fm fetch error:", err);

      return NextResponse.json(
         { error: "Failed to fetch page" },
         { status: 500 },
      );
   }
};

export { GET };
