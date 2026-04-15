'use client';

// Next.js
import Link from 'next/link';

// Chakra UI
import {
  Box,
  Container,
  Heading,
  VStack,
  Text,
  HStack,
} from '@chakra-ui/react';

import changelog from './changelog.json';
import { FaArrowLeft } from 'react-icons/fa';

const ChangelogPage = () => {
  return (
    <Box minH="100vh" py={20}>
      <Container maxW="2xl">
        <VStack align="stretch" gap={8}>
          {/* Header */}
          <VStack align="start" gap={2}>
            <Link
              href="/"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <HStack color="gray.600">
                <FaArrowLeft />
                <Text fontSize="sm">Back</Text>
              </HStack>
            </Link>

            <Heading size="xl" fontFamily="var(--font-sans)">
              Changelog
            </Heading>

            <Text fontSize="sm" color="gray.500">
              Updates and improvements to Last.fm Enhanced Stats
            </Text>
          </VStack>

          {/* List */}
          {changelog.map((version, versionIdx) => (
            <VStack key={versionIdx} align="start" gap={2}>
              <Heading size="md">{version.version}</Heading>

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
          ))}
        </VStack>
      </Container>
    </Box>
  );
};

export default ChangelogPage;
