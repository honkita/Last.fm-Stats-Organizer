'use client';

// React
import { useState } from 'react';
import { FaBars } from 'react-icons/fa';

// Next.js
import Link from 'next/link';

// Chakra UI
import { Button, Menu, Portal } from '@chakra-ui/react';

// Framer Motion
import { motion } from 'framer-motion';

// Components
import { sidePanelButtons } from './sidePanelButtons';

// Types
import { SidePanelButtonType } from '@/types/SidePanelButtonType';

const SidePanel = () => {
  const [open, setOpen] = useState(false);

  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button asChild size="lg" color="brand.primaryAccent" background="none">
          <motion.div
            animate={{ rotate: open ? 90 : 0 }}
            transition={{ duration: 0.25 }}
          >
            <FaBars />
          </motion.div>
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content p={1} minW="unset" overflow="hidden" borderRadius="xl">
            {sidePanelButtons.map(
              (button: SidePanelButtonType, index: number) => (
                <Menu.Item value={button.link} key={index}>
                  <Button
                    asChild
                    size="lg"
                    color="brand.primaryAccent"
                    background="none"
                    aspectRatio={1}
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
                </Menu.Item>
              ),
            )}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
};

export default SidePanel;
