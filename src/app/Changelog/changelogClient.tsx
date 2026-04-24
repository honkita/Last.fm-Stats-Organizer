'use client';

// React
import { useState } from 'react';

// Chakra UI
import {
  Accordion,
  Box,
  Container,
  HStack,
  Text,
  VStack,
} from '@chakra-ui/react';

// Components
import Title from '@/components/Title/title';

// JSONs
import changelog from './changelog.json';

const ChangelogPage = () => {
  // Track which accordion items are open
  const [openItems, setOpenItems] = useState<string[]>([]);

  return (
    <Box minH="100vh" py={20}>
      <Container maxW="3xl">
        <VStack align="stretch" gap={8} width="100%">
          {/* Header */}
          <Title title="Change Log" emoji="✏︎" />
          {/* List */}
          <Accordion.Root
            collapsible
            gap={10}
            value={openItems}
            onValueChange={(e) => setOpenItems(e.value)}
          >
            {changelog.map((version, versionIdx) => {
              // Find the rank relative to sortedArtists
              return (
                <Accordion.Item
                  key={versionIdx}
                  value={version.version}
                  borderWidth="1px"
                  borderRadius="lg"
                  px={3}
                  py={2}
                  mb={4}
                >
                  <Accordion.ItemTrigger>
                    <HStack gap={1} flex={1} width="200px">
                      <Text fontWeight="semibold">{version.version}</Text>
                    </HStack>
                  </Accordion.ItemTrigger>

                  <Accordion.ItemContent>
                    <VStack gap={2} align="stretch">
                      <Text fontSize="sm" color="gray.500">
                        {version.date}
                      </Text>
                      {version.changes.added.map((item, idx) => (
                        <Text fontSize="sm" key={idx}>
                          + {item}
                        </Text>
                      ))}

                      {version.changes.improved.map((item, idx) => (
                        <Text fontSize="sm" key={idx}>
                          ✓ {item}
                        </Text>
                      ))}

                      {version.changes.fixed.map((item, idx) => (
                        <Text fontSize="sm" key={idx}>
                          ✗ {item}
                        </Text>
                      ))}
                    </VStack>
                  </Accordion.ItemContent>
                </Accordion.Item>
              );
            })}
          </Accordion.Root>
        </VStack>
      </Container>
    </Box>
  );
};

export default ChangelogPage;
