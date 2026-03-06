"use client";

// React
import { useState, useMemo } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";

// Chakra UI
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

// Components
import Emoji from "@/components/Emoji/emoji";

// Utils
import { getUserInfo } from "@/utils/userData";

// Types
import {
   artistAlbumContainerMapType,
   artistAlbumTopAlbum,
} from "@/types/Music";

const PAGE_SIZE = 100;

const Home = () => {
   const [username, setUsername] = useState("");
   const [submittedUser, setSubmittedUser] = useState<string | null>(null);

   const [artists, setArtists] = useState<Record<string, artistAlbumTopAlbum>>(
      {},
   );

   const [artistAlbums, setArtistAlbums] =
      useState<artistAlbumContainerMapType>({});

   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   const [progress, setProgress] = useState(0);
   const [totalPagesLoading, setTotalPagesLoading] = useState(0);

   const [currentPage, setCurrentPage] = useState(1);
   const [scrobbles, setScrobbles] = useState<number | null>(null);

   const fetchArtists = async (user: string) => {
      try {
         setLoading(true);
         setError(null);

         try {
            const res = await fetch("/api/Scrobbles?user=" + user);
            if (!res.ok) throw new Error("Failed to fetch scrobbles");
            const data = await res.json();
            setScrobbles(data.totalScrobbles);
         } catch (err) {
            console.log(
               "Fetching user info for:",
               user + " failed, error fetching scrobbles:",
               err,
            );
         }

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
               <Box width="100%" textAlign="center">
                  <Heading
                     size="3xl"
                     color="black"
                     fontWeight={"Bold"}
                     fontFamily="var(--font-sans)"
                  >
                     <Emoji text="🎧" /> Last.fm Summarized Album Stats
                  </Heading>
               </Box>

               {/* Form */}
               <form onSubmit={handleSubmit}>
                  <HStack>
                     <Input
                        placeholder="Enter Last.fm username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                     />
                     <Button
                        aspectRatio="1"
                        type="submit"
                        backgroundColor="brand.primaryAccent"
                     >
                        <FaArrowRight color="white" />
                     </Button>
                  </HStack>
               </form>

               {/* Loading */}
               {loading && (
                  <VStack align="stretch" gap={3}>
                     <Text fontFamily="var(--font-sans)">
                        Fetching scrobbles for {submittedUser}
                     </Text>

                     <Progress.Root
                        value={
                           totalPagesLoading > 0
                              ? (progress / totalPagesLoading) * 100
                              : 0
                        }
                        size="sm"
                        borderRadius="md"
                     >
                        <Progress.Track>
                           <Progress.Range bg="brand.primaryAccent" />
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
                        <HStack width="100%" gap={2} alignItems="flex-start">
                           <HStack>
                              <Emoji text="👤" /> {sortedArtists.length}
                           </HStack>
                           <HStack>
                              <Emoji text="🎧" /> {scrobbles?.toLocaleString()}
                           </HStack>
                        </HStack>
                     </Heading>

                     <Accordion.Root multiple gap={10}>
                        {paginatedArtists.map((artist) => {
                           const name = artist.name;
                           const albumData = artistAlbums[name];
                           if (!albumData) return null;

                           const albumEntries = Object.entries(
                              albumData.albums,
                           );
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
                                          <Text fontWeight="semibold">
                                             {name}
                                          </Text>
                                       </HStack>
                                       <VStack gap={3} alignItems="flex-end">
                                          <Text
                                             fontWeight="medium"
                                             textAlign="right"
                                          >
                                             {artist.playcount.toLocaleString()}{" "}
                                             <Emoji text="🎧" />
                                          </Text>
                                          <Text
                                             fontWeight="medium"
                                             textAlign="right"
                                          >
                                             {albumCount} <Emoji text="💽" />
                                          </Text>
                                       </VStack>
                                    </HStack>
                                 </Accordion.ItemTrigger>

                                 <Accordion.ItemContent>
                                    <VStack align="stretch" gap={2} pt={3}>
                                       {albumEntries
                                          .sort(
                                             (a, b) =>
                                                b[1].playcount - a[1].playcount,
                                          )
                                          .map(([albumName, album]) => (
                                             <HStack
                                                key={albumName}
                                                justify="space-between"
                                                fontSize="sm"
                                             >
                                                <Text>{albumName}</Text>
                                                <Text color="gray.500">
                                                   {album.playcount.toLocaleString()}{" "}
                                                   <Emoji text="🎧" />
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
                              aspectRatio="1"
                              onClick={() =>
                                 setCurrentPage((p) => Math.max(p - 1, 1))
                              }
                              disabled={currentPage === 1}
                              size="sm"
                              backgroundColor="brand.primaryAccent"
                           >
                              <FaArrowLeft />
                           </Button>

                           <Text fontSize="sm">
                              Page {currentPage} of {totalPages}
                           </Text>

                           <Button
                              aspectRatio="1"
                              onClick={() =>
                                 setCurrentPage((p) =>
                                    Math.min(p + 1, totalPages),
                                 )
                              }
                              disabled={currentPage === totalPages}
                              size="sm"
                              backgroundColor="brand.primaryAccent"
                           >
                              <FaArrowRight />
                           </Button>
                        </HStack>
                     )}
                  </>
               )}
            </VStack>
         </Container>
      </Box>
   );
};

export default Home;
