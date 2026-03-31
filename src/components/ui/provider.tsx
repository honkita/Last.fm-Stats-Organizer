'use client';

import * as React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

const ChakraUIProvider = ({ children }: { children: React.ReactNode }) => {
  const config = defineConfig({
    theme: {
      tokens: {
        colors: {
          brand: {
            primaryAccent: { value: '#F38500' },
            turtoise: { value: '#003B49' },
          },
        },
      },
    },
  });
  const system = createSystem(defaultConfig, config);

  return <ChakraProvider value={system}>{children}</ChakraProvider>;
};

export { ChakraUIProvider };
