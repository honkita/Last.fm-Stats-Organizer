// Chakra UI
import { useAccordionItemContext, Text } from '@chakra-ui/react';

// Context
import { useLanguage } from '@/contexts/LanguageContext';

// Utils
import {
  traditionalToSimplified,
  simplifiedToTraditional,
} from '@/utils/canonicalizeName';

// Props Types
interface ArtistNameProps {
  name: string;
  rank: number;
  ignoreChineseConversion: boolean;
}

const ArtistName = ({
  name,
  rank,
  ignoreChineseConversion,
}: ArtistNameProps) => {
  const item = useAccordionItemContext();

  const { chineseScript } = useLanguage();

  const expanded = item?.expanded;

  return (
    <Text
      fontWeight="semibold"
      title={name}
      minW={0}
      maxW="100%"
      overflow={expanded ? 'visible' : 'hidden'}
      textOverflow={expanded ? 'clip' : 'ellipsis'}
      whiteSpace={expanded ? 'normal' : 'nowrap'}
    >
      {rank}.{' '}
      {ignoreChineseConversion
        ? name
        : chineseScript === 'traditional'
          ? simplifiedToTraditional(name)
          : traditionalToSimplified(name)}
    </Text>
  );
};

export default ArtistName;
