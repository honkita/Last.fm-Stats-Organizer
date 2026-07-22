// React
import { useState } from 'react';

// Chakra UI
import { Button, Popover, Portal, Image } from '@chakra-ui/react';

// Components
import Emoji from '@/components/Emoji/emoji';

// Props Types
interface AlbumProps {
  albumImage: string;
}

const Album = ({ albumImage }: AlbumProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover.Root open={open} onOpenChange={(e) => setOpen(e.open)}>
      <Popover.Trigger asChild>
        <Button
          size="sm"
          variant="ghost"
          p={0}
          minW={0}
          aria-label="Album Image"
        >
          <Emoji text="🎧" />
        </Button>
      </Popover.Trigger>

      <Portal>
        <Popover.Positioner>
          <Popover.Content>
            <Popover.Arrow />
            <Popover.Body>
              {open && <Image src={albumImage} alt="Album Image" />}
            </Popover.Body>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
};

export default Album;
