// Chakra UI
import { Button } from '@chakra-ui/react';

// Components
import Emoji from '@/components/Emoji/emoji';

// Props Types
interface AlbumProps {
  albumImage: string;
}

interface AlbumProps {
  albumImage: string;
  onOpen: (image: string) => void;
}

const Album = ({ albumImage, onOpen }: AlbumProps) => {
  return (
    <Button
      size="xs"
      variant="ghost"
      p={0}
      minW="24px"
      h="24px"
      lineHeight="1"
      onClick={() => onOpen(albumImage)}
    >
      <Emoji text="🎧" />
    </Button>
  );
};

export default Album;
