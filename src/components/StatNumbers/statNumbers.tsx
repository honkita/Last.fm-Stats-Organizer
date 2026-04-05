'use client';

// Chakra UI
import { HoverCard, HStack, Text } from '@chakra-ui/react';

// Components
import Emoji from '@/components/Emoji/emoji';

// Props Types
interface statNumbersProps {
  emoji: string;
  value: string | number;
  infoText: string;
}

const StatNumbers = ({ emoji, value, infoText }: statNumbersProps) => {
  return (
    <HoverCard.Root>
      <HoverCard.Trigger asChild>
        <HStack cursor="help">
          <Emoji text={emoji} /> {value}
        </HStack>
      </HoverCard.Trigger>

      <HoverCard.Positioner>
        <HoverCard.Content p={3} maxW="220px">
          <Text fontSize="sm">{infoText}</Text>
        </HoverCard.Content>
      </HoverCard.Positioner>
    </HoverCard.Root>
  );
};

export default StatNumbers;
