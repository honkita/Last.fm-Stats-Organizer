import { Accordion, HStack, Text, VStack } from "@chakra-ui/react";
import Emoji from "@/components/Emoji/emoji";

// Child Components
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
         px={4}
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
                  {" "}
                  {/* Prevent shrinking */}
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
            <VStack align="stretch" gap={2} pt={3}>
               {albumEntries
                  .sort((a, b) => b[1].playcount - a[1].playcount)
                  .map(([albumName, album]) => (
                     <HStack
                        key={albumName}
                        justify="space-between"
                        fontSize="sm"
                        align="start"
                     >
                        <Text width="80%">
                           {albumName}
                        </Text>
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
};

export default Artist;
