'use client';

// React
import { useState } from 'react';
import { FaBars, FaTimes } from 'react-icons/fa';

// Next.js
import Link from 'next/link';

// Chakra UI
import { Button, Box, VStack, IconButton } from '@chakra-ui/react';

// Chakra UI Snippets
import { Tooltip } from '@/components/ui/tooltip';

// Framer Motion
import { motion } from 'framer-motion';

// Components
import { sidePanelButtons } from './sidePanelButtons';

// Types
import { SidePanelButtonType } from '@/types/SidePanelButtonType';

const MotionBox = motion.create(Box);

const SidePanel = () => {
  const [open, setOpen] = useState(false);

  return (
    <MotionBox position="fixed" left="10px" bottom="10px" zIndex={1000}>
      <VStack gap={3} align="center" justify="center">
        {/* Toggle Button */}
        <IconButton
          aria-label="toggle panel"
          onClick={() => setOpen((v) => !v)}
          borderRadius="full"
          size="lg"
          backgroundColor="brand.primaryAccent"
          color="white"
        >
          <motion.div
            animate={{ rotate: open ? 90 : 0 }}
            transition={{ duration: 0.25 }}
          >
            {open ? <FaTimes /> : <FaBars />}
          </motion.div>
        </IconButton>

        <MotionBox
          initial={false}
          animate={{
            opacity: open ? 1 : 0,
            scale: open ? 1 : 0.95,
            pointerEvents: open ? 'auto' : 'none',
            translateY: open ? '0' : '10px',
          }}
          transition={{ duration: 0.2 }}
          position="absolute"
          bottom="60px"
        >
          <VStack gap={5}>
            {sidePanelButtons
              .reverse()
              .map((button: SidePanelButtonType, index: number) => (
                <Tooltip
                  key={index}
                  content={button.tooltip}
                  positioning={{ placement: 'left' }}
                >
                  <Button
                    asChild
                    size="lg"
                    p={3}
                    color="brand.primaryAccent"
                    background="none"
                  >
                    <Link
                      href={button.link}
                      onClick={() => setOpen(false)}
                      target={button.newTab ? '_blank' : undefined}
                      rel="noopener noreferrer"
                    >
                      {button.icon}
                    </Link>
                  </Button>
                </Tooltip>
              ))}
          </VStack>
        </MotionBox>
      </VStack>
    </MotionBox>
  );
};

export default SidePanel;
