"use client";

import { useState, useMemo } from "react";
import {
   Box,
   Container,
   Heading,
   Input,
   Button,
   HStack,
   VStack,
   Text,
   Accordion,
   Progress,
} from "@chakra-ui/react";

// Utils
import { getUserInfo } from "@/utils/userData";

// Types
import {
   artistAlbumContainerMapType,
   artistAlbumTopAlbum,
} from "@/types/Music";

const PAGE_SIZE = 100;

export default function Home() {
   const [username, setUsername] = useState("");
   const [submittedUser, setSubmittedUser] = useState<string | null>(null);

   const [artists, setArtists] = useState<Record<string, artistAlbumTopAlbum>>(
      {}
   );

   const [artistAlbums, setArtistAlbums] =
      useState<artistAlbumContainerMapType>({});

   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   const [progress, setProgress] = useState(0);
   const [totalPagesLoading, setTotalPagesLoading] = useState(0);

   const [currentPage, setCurrentPage] = useState(1);

   const fetchArtists = async (user: string) => {
      try {
         setLoading(true);
         setError(null);

         const res = await getUserInfo(user, (current, total) => {
            setProgress(current);
            setTotalPagesLoading(total);
         });

         const allData: artistAlbumContainerMapType = res?.["All Data"] ?? {};
         const bestAlbums = res?.["Best Albums"] ?? {};

         setArtistAlbums(allData);
         setArtists(bestAlbums);
         setCurrentPage(1);
      } catch (err: unknown) {
         if (err instanceof Error) setError(err.message);
         else setError("An unknown error occurred");
      } finally {
         setLoading(false);
      }
   };

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!username.trim()) return;

      setTotalPagesLoading(0);
      setProgress(0);
      setArtists({});
      setArtistAlbums({});

      const trimmedUser = username.trim();
      setSubmittedUser(trimmedUser);
      fetchArtists(trimmedUser);
   };

   const sortedArtists = useMemo(() => {
      return Object.values(artists).sort((a, b) => b.playcount - a.playcount);
   }, [artists]);

   const totalPages = Math.ceil(sortedArtists.length / PAGE_SIZE);

   const paginatedArtists = useMemo(() => {
      const start = (currentPage - 1) * PAGE_SIZE;
      const end = currentPage * PAGE_SIZE;
      return sortedArtists.slice(start, end);
   }, [sortedArtists, currentPage]);

   return (
      <Box minH="100vh" py={20}>
         <Container maxW="3xl">
            <VStack align="stretch" gap={8}>
               {/* Header */}
               <Heading size="lg">🎧 Last.fm Album Stats</Heading>

               {/* Form */}
               <form onSubmit={handleSubmit}>
                  <HStack>
                     <Input
                        placeholder="Enter Last.fm username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                     />
                     <Button type="submit" colorPalette="orange">
                        →
                     </Button>
                  </HStack>
               </form>

               {/* Loading */}
               {loading && (
                  <VStack align="stretch" gap={3}>
                     <Text>Fetching scrobbles for {submittedUser}</Text>

                     <Progress.Root
                        value={
                           totalPagesLoading > 0
                              ? (progress / totalPagesLoading) * 100
                              : 0
                        }
                        size="sm"
                        colorPalette="orange"
                        borderRadius="md"
                     >
                        <Progress.Track>
                           <Progress.Range />
                        </Progress.Track>
                     </Progress.Root>

                     <Text fontSize="sm" color="gray.500">
                        {progress} / {totalPagesLoading} pages
                     </Text>
                  </VStack>
               )}

               {/* Error */}
               {error && (
                  <Text color="red.400" fontWeight="medium">
                     Error: {error}
                  </Text>
               )}

               {/* Results */}
               {!loading && !error && sortedArtists.length > 0 && (
                  <>
                     <Heading size="md">
                        All-Time Top Artists ({sortedArtists.length})
                     </Heading>

                     <Accordion.Root multiple gap={10}>
                        {paginatedArtists.map((artist) => {
                           const name = artist.name;
                           const albumData = artistAlbums[name];
                           if (!albumData) return null;

                           const albumEntries = Object.entries(albumData.albums);
                           const albumCount = albumEntries.length;

                           return (
                              <Accordion.Item
                                 key={name}
                                 value={name}
                                 borderWidth="1px"
                                 borderRadius="lg"
                                 px={4}
                                 py={2}
                                 mb={4}
                              >
                                 <Accordion.ItemTrigger>
                                    <HStack
                                       flex="1"
                                       justify="space-between"
                                       align="center"
                                    >
                                       <HStack gap={3}>
                                          <Text fontWeight="semibold">{name}</Text>

                                       </HStack>
                                       <VStack gap={3} alignItems="flex-end">
                                          <Text fontWeight="medium" textAlign="right">
                                             {artist.playcount.toLocaleString()} 🎧
                                          </Text>
                                          <Text fontWeight="medium" textAlign="right">
                                             {albumCount} 💽
                                          </Text>
                                       </VStack>
                                    </HStack>
                                 </Accordion.ItemTrigger>

                                 <Accordion.ItemContent>
                                    <VStack align="stretch" gap={2} pt={3}>
                                       {albumEntries
                                          .sort(
                                             (a, b) =>
                                                b[1].playcount - a[1].playcount
                                          )
                                          .map(([albumName, album]) => (
                                             <HStack
                                                key={albumName}
                                                justify="space-between"
                                                fontSize="sm"
                                             >
                                                <Text>{albumName}</Text>
                                                <Text color="gray.500">
                                                   {album.playcount.toLocaleString()} plays
                                                </Text>
                                             </HStack>
                                          ))}
                                    </VStack>
                                 </Accordion.ItemContent>
                              </Accordion.Item>
                           );
                        })}
                     </Accordion.Root>

                     {/* Pagination */}
                     {totalPages > 1 && (
                        <HStack justify="center" gap={6} pt={6}>
                           <Button
                              onClick={() =>
                                 setCurrentPage((p) => Math.max(p - 1, 1))
                              }
                              disabled={currentPage === 1}
                              size="sm"
                           >
                              ←
                           </Button>

                           <Text fontSize="sm">
                              Page {currentPage} of {totalPages}
                           </Text>

                           <Button
                              onClick={() =>
                                 setCurrentPage((p) =>
                                    Math.min(p + 1, totalPages)
                                 )
                              }
                              disabled={currentPage === totalPages}
                              size="sm"
                           >
                              →
                           </Button>
                        </HStack>
                     )}
                  </>
               )}
            </VStack>
         </Container>
      </Box>
   );
}