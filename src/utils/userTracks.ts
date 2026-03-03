interface lfmRecentTrack {
   artist: { "#text": string };
   album: { "#text": string };
   name: string;
   image?: { "#text": string }[];
   date?: { uts: string };
}

interface PageResponse {
   tracks: lfmRecentTrack[];
   page: number;
   totalPages: number;
}

const fetchPage = async (
   username: string,
   page: number,
   limit: number = 200,
): Promise<PageResponse> => {
   const res = await fetch(
      `/api/LastFM?user=${username}&page=${page}&limit=${limit}`,
   );

   if (!res.ok) {
      throw new Error("Failed to fetch page");
   }

   return res.json();
};

export const fetchAllPages = async (
   username: string,
   limit: number = 200,
   onProgress?: (current: number, total: number) => void,
): Promise<lfmRecentTrack[]> => {
   const first = await fetchPage(username, 1, limit);
   const totalPages = first.totalPages;

   let completedPages = 1;
   onProgress?.(completedPages, totalPages);

   const allTracks: lfmRecentTrack[] = [...first.tracks];

   const fetchPageWithRetry = async (
      page: number,
      retries = 2,
   ): Promise<lfmRecentTrack[]> => {
      try {
         const result = await fetchPage(username, page, limit);
         // Only increment progress on success
         completedPages++;
         onProgress?.(completedPages, totalPages);
         return result.tracks;
      } catch (err) {
         if (retries > 0) return fetchPageWithRetry(page, retries - 1);
         console.error(`Failed page ${page} after retries`, err);
         return [];
      }
   };

   // Prepare all page promises (pages 2..totalPages)
   const pagePromises = Array.from({ length: totalPages - 1 }, (_, i) =>
      fetchPageWithRetry(i + 2),
   );

   // Wait for all pages in parallel
   const results = await Promise.all(pagePromises);

   // Flatten and append
   return allTracks.concat(...results);
};
