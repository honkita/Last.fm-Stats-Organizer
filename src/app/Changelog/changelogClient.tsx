'use client';

// React
import { useState } from 'react';

// Chakra UI
import {
  Accordion,
  Box,
  Container,
  Heading,
  HStack,
  Text,
  VStack,
} from '@chakra-ui/react';

// JSONs
import changelog from './changelog.json';
import Emoji from '@/components/Emoji/emoji';

const ChangelogPage = () => {
  // Track which accordion items are open
  const [openItems, setOpenItems] = useState<string[]>([]);

  return (
    <Box minH="100vh" py={20}>
      <Container maxW="2xl">
        <VStack align="stretch" gap={8}>
          {/* Header */}
          <VStack align="start" gap={2}>
            <Heading
              size="3xl"
              color="black"
              fontWeight="Bold"
              fontFamily="var(--font-sans)"
              display="flex"
              flexDirection="row"
              gap={2}
            >
              <Emoji text="✏︎" />
              Change Log
            </Heading>

            <Text fontSize="sm" color="gray.500">
              Updates and improvements to Last.fm Enhanced Stats
            </Text>
          </VStack>

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
