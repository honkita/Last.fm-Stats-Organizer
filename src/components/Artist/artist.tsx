// Chakra UI
import { Accordion, HStack, Text, VStack } from '@chakra-ui/react';

// Child Components
import ArtistName from '@/components/Artist/artistName';
import Emoji from '@/components/Emoji/emoji';

// Types
import { artistAlbumTopAlbum, artistAlbumContainer } from '@/types/Music';

// Props Types
interface ArtistProps {
  rank: number;
  artist: artistAlbumTopAlbum;
  artistAlbums: Record<string, artistAlbumContainer>;
}

const Artist = ({ rank, artist, artistAlbums }: ArtistProps) => {
  const name = artist.name;
  const albumData: artistAlbumContainer = artistAlbums[name];
  if (!albumData) return null;

  const albumEntries = Object.entries(albumData.albums);
  const albumCount = albumEntries.length;

  // DEBUG
  // if (artist.playcount / albumCount < 15 && artist.playcount > 200)
  //    console.log(artist.name, artist.playcount, albumCount);

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
            <ArtistName name={name} rank={rank} />
          </HStack>
          <VStack
            gap={3}
            alignItems="flex-end"
            flexShrink={0}
            width="fit-content"
          >
            {' '}
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
        <VStack align="stretch" gap={2} pt={2}>
          {albumEntries
            .sort((a, b) => b[1].playcount - a[1].playcount)
            .map(([albumName, album]) => (
              <HStack
                key={albumName}
                justify="space-between"
                fontSize="sm"
                align="start"
              >
                <Text width="80%">{albumName}</Text>
                <Text color="gray.500" width="20%" textAlign="right">
                  {album.playcount.toLocaleString()} <Emoji text="🎧" />
                </Text>
              </HStack>
            ))}
        </VStack>
      </Accordion.ItemContent>
    </Accordion.Item>
  );
};

export default Artist;
