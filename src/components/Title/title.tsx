// Chakra UI
import { Heading, HStack } from '@chakra-ui/react';

// Components
import SidePanel from '@/components/SidePanel/sidePanel';

// Title Props Types
interface TitleProps {
  title: string;
  emoji: string;
}

const Title = ({ title }: TitleProps) => {
  return (
    <HStack width="100%" justify="space-between">
      <Heading
        size="3xl"
        color="black"
        fontWeight="Bold"
        fontFamily="var(--font-sans)"
        display="flex"
        flexDirection="row"
        gap={2}
      >
        <SidePanel />
        {title}
      </Heading>
    </HStack>
  );
};

export default Title;
