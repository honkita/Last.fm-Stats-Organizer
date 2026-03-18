import {
   Accordion,
   HStack,
   Text,
   VStack,
   Button,
   Image,
   Popover,
   Portal,
} from "@chakra-ui/react";
import Emoji from "@/components/Emoji/emoji";
import ArtistName from "@/components/Artist/artistName";

// Types
import { artistAlbumTopAlbum, artistAlbumContainer } from "@/types/Music";

interface ArtistProps {
   artist: artistAlbumTopAlbum;
   artistAlbums: Record<string, artistAlbumContainer>;
}

const Artist = ({ artist, artistAlbums }: ArtistProps) => {
   const name = artist.name;
   const albumData: artistAlbumContainer = artistAlbums[name];
   if (!albumData) return null;

   const albumEntries = Object.entries(albumData.albums);
   const albumCount = albumEntries.length;

   return (
      <Accordion.Item
         key={name}
         value={name}
         borderWidth="1px"
         borderRadius="lg"
         px={3}
         py={2}
         mb={4}
      >
         <Accordion.ItemTrigger>
            <HStack flex="1" justify="space-between" align="center">
               <HStack gap={1} flex={1} width="200px">
                  <ArtistName name={name} />
               </HStack>
               <VStack
                  gap={3}
                  alignItems="flex-end"
                  flexShrink={0}
                  width="fit-content"
               >
                  <Text fontWeight="medium" textAlign="right">
                     {artist.playcount.toLocaleString()} <Emoji text="🎧" />
                  </Text>
                  <Text fontWeight="medium" textAlign="right">
                     {albumCount} <Emoji text="💽" />
                  </Text>
               </VStack>
            </HStack>
         </Accordion.ItemTrigger>

         <Accordion.ItemContent>
            <VStack align="stretch" gap={1} pt={2}>
               {albumEntries
                  .sort((a, b) => b[1].playcount - a[1].playcount)
                  .map(([albumName, album]) => (
                     <HStack
                        key={albumName}
                        justify="space-between"
                        fontSize="sm"
                        align="start"
                     >
                        <Text width="70%">{albumName}</Text>

                        <HStack gap={1} width="30%" justify="flex-end">
                           <Text color="gray.500" textAlign="right">
                              {album.playcount.toLocaleString()}{" "}
                           </Text>

                           {/* Popover */}
                           <Popover.Root>
                              <Popover.Trigger asChild>
                                 <Button
                                    size="sm"
                                    aspectRatio={1}
                                    background="transparent"
                                    _hover={{ background: "transparent" }}
                                    p={1}
                                 >
                                    <Emoji text="🎧" />
                                 </Button>
                              </Popover.Trigger>
                              <Portal>
                                 <Popover.Positioner>
                                    <Popover.Content>
                                       <Popover.Arrow />
                                       <Popover.Body>
                                          <Image
                                             src={album.image || ""}
                                             alt={albumName}
                                             width="100%"
                                          />
                                       </Popover.Body>
                                    </Popover.Content>
                                 </Popover.Positioner>
                              </Portal>
                           </Popover.Root>
                        </HStack>
                     </HStack>
                  ))}
            </VStack>
         </Accordion.ItemContent>
      </Accordion.Item>
   );
};

export default Artist;
