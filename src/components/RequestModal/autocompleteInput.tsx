'use client';

import { useState } from 'react';
import { Input, Box, VStack } from '@chakra-ui/react';

interface AutocompleteInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  options: string[];
}

const AutocompleteInput = ({
  value,
  onChange,
  placeholder,
  options,
}: AutocompleteInputProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const filtered = value
    ? options.filter((item) => item.toLowerCase().includes(value.toLowerCase()))
    : [];

  return (
    <Box position="relative" width="100%">
      <Input
        value={value}
        placeholder={placeholder}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 100)}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
      />

      {isOpen && filtered.length > 0 && (
        <Box
          position="absolute"
          top="100%"
          left={0}
          right={0}
          bg="white"
          borderWidth="1px"
          borderRadius="md"
          shadow="md"
          zIndex={10}
          maxH="200px"
          overflowY="auto"
        >
          <VStack align="stretch" gap={0}>
            {filtered.map((item) => (
              <Box
                key={item}
                px={3}
                py={2}
                cursor="pointer"
                _hover={{ bg: 'gray.100' }}
                onMouseDown={() => {
                  onChange(item);
                  setIsOpen(false);
                }}
              >
                {item}
              </Box>
            ))}
          </VStack>
        </Box>
      )}
    </Box>
  );
};

export default AutocompleteInput;
