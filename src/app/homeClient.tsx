"use client";

// React
import { useState, useMemo } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { FaGithub } from "react-icons/fa6";

// Next.js
import Link from "next/link";

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
   HoverCard,
} from "@chakra-ui/react";

// Components
import Emoji from "@/components/Emoji/emoji";
import Artist from "@/components/Artist/artist";

// Utils
import { getUserInfo } from "@/utils/userData";

// Types
import {
   artistAlbumContainerMapType,
   artistAlbumTopAlbum,
} from "@/types/Music";

const PAGE_SIZE = 100;

const HomeClient = () => {
   const inputStyles = {
      fontFamily: "var(--font-sans)",
      fontSize: "sm",
      borderRadius: "md",
      borderColor: "gray.300",
   };

   const [username, setUsername] = useState("");
   const [submittedUser, setSubmittedUser] = useState<string | null>(null);

   const [artists, setArtists] = useState<Record<string, artistAlbumTopAlbum>>(
      {},
   );

   const [totalArtistsLoaded, setTotalArtistsLoaded] = useState(0);

   const [artistAlbums, setArtistAlbums] =
      useState<artistAlbumContainerMapType>({});

   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   const [progress, setProgress] = useState(0);
   const [totalPagesLoading, setTotalPagesLoading] = useState(0);

   const [currentPage, setCurrentPage] = useState(1);
   const [scrobbles, setScrobbles] = useState<number | null>(null);

   const [artistSearch, setArtistSearch] = useState("");

   // Track which accordion items are open
   const [openItems, setOpenItems] = useState<string[]>([]);

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
         const bestAlbumsArray = res?.["Best Albums"] ?? [];

         setArtistAlbums(allData);

         // Convert array to record with artist name as key
         const bestAlbumsRecord = Array.isArray(bestAlbumsArray)
            ? bestAlbumsArray.reduce(
                 (acc, artist) => {
                    acc[artist.name] = artist;
                    return acc;
                 },
                 {} as Record<string, artistAlbumTopAlbum>,
              )
            : {};

         setArtists(bestAlbumsRecord);

         setCurrentPage(1);
         setOpenItems([]); // Reset open items on new search
         setArtistSearch(""); // Reset artist search
         setTotalArtistsLoaded(Object.keys(bestAlbumsRecord).length);
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

   const filteredArtists = useMemo(() => {
      if (!artistSearch.trim()) return sortedArtists;
      return sortedArtists.filter((a) =>
         a.name.toLowerCase().includes(artistSearch.toLowerCase()),
      );
   }, [sortedArtists, artistSearch]);

   const totalPages = Math.ceil(filteredArtists.length / PAGE_SIZE);

   const paginatedArtists = useMemo(() => {
      const start = (currentPage - 1) * PAGE_SIZE;
      const end = currentPage * PAGE_SIZE;
      return filteredArtists.slice(start, end);
   }, [filteredArtists, currentPage]);

   return (
      <Box minH="100vh" py={20}>
         <Container maxW="3xl">
            <VStack align="stretch" gap={8} width="100%">
               {/* Header */}
               <HStack width="100%" justify="space-between">
                  <Heading
                     size="3xl"
                     color="black"
                     fontWeight="Bold"
                     fontFamily="var(--font-sans)"
                  >
                     <Emoji text="🎧" /> Last.fm Enhanced Stats
                  </Heading>

                  <Button
                     asChild
                     size="lg"
                     p={3}
                     color="brand.primaryAccent"
                     background="none"
                  >
                     <Link
                        href="https://github.com/honkita/Last.fm-Stats-Organizer"
                        target="_blank"
                        rel="noopener noreferrer"
                     >
                        <FaGithub style={{ width: "40px", height: "40px" }} />
                     </Link>
                  </Button>
               </HStack>

               {/* Form */}
               <form onSubmit={handleSubmit}>
                  <HStack>
                     <Input
                        placeholder="Enter Last.fm username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        {...inputStyles}
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
                        <HStack width="100%" gap={6} alignItems="center">
                           {/* Artist Count */}
                           <HoverCard.Root>
                              <HoverCard.Trigger asChild>
                                 <HStack cursor="help">
                                    <Emoji text="👤" /> {totalArtistsLoaded}
                                 </HStack>
                              </HoverCard.Trigger>

                              <HoverCard.Positioner>
                                 <HoverCard.Content p={3} maxW="220px">
                                    <Text fontSize="sm">
                                       Total number of artists after merging.
                                    </Text>
                                 </HoverCard.Content>
                              </HoverCard.Positioner>
                           </HoverCard.Root>

                           {/* Total Scrobbles */}
                           <HoverCard.Root>
                              <HoverCard.Trigger asChild>
                                 <HStack cursor="help">
                                    <Emoji text="🎧" />{" "}
                                    {scrobbles?.toLocaleString()}
                                 </HStack>
                              </HoverCard.Trigger>

                              <HoverCard.Positioner>
                                 <HoverCard.Content p={3} maxW="220px">
                                    <Text fontSize="sm">
                                       Total number of listens (scrobbles)
                                       recorded on your Last.fm account.
                                    </Text>
                                 </HoverCard.Content>
                              </HoverCard.Positioner>
                           </HoverCard.Root>
                           {/* Artist Search */}
                           <Input
                              placeholder="Search artist..."
                              value={artistSearch}
                              onChange={(e) => setArtistSearch(e.target.value)}
                              {...inputStyles}
                           />
                        </HStack>
                     </Heading>

                     <Accordion.Root
                        collapsible
                        gap={10}
                        value={openItems}
                        onValueChange={(e) => setOpenItems(e.value)}
                     >
                        {paginatedArtists.map((artist) => {
                           // Find the rank relative to sortedArtists
                           const rank =
                              sortedArtists.findIndex(
                                 (a) => a.name === artist.name,
                              ) + 1;

                           return (
                              <Artist
                                 key={artist.name}
                                 artist={artist}
                                 artistAlbums={artistAlbums}
                                 rank={rank}
                              />
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

export default HomeClient;
