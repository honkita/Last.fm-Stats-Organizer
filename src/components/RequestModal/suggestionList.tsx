import { Button, VStack } from '@chakra-ui/react';

const SuggestionList = ({
  items,
  onSelect,
}: {
  items: string[];
  onSelect: (value: string) => void;
}) => {
  if (!items.length) return null;

  return (
    <VStack
      align="stretch"
      border="1px solid"
      borderColor="gray.200"
      borderRadius="md"
      bg="white"
      mt={1}
      zIndex={10}
      position="absolute"
      width="100%"
    >
      {items.map((item) => (
        <Button
          key={item}
          variant="ghost"
          justifyContent="flex-start"
          onClick={() => onSelect(item)}
        >
          {item}
        </Button>
      ))}
    </VStack>
  );
};

export default SuggestionList;
