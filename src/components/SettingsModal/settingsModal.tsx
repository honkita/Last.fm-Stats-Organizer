'use client';

import {
  Button,
  CloseButton,
  Dialog,
  Flex,
  Portal,
  Switch,
  Text,
  VStack,
} from '@chakra-ui/react';

import { useLanguage } from '@/contexts/LanguageContext';

const SettingsModal = () => {
  const { chineseScript, setChineseScript } = useLanguage();

  const isSimplifiedChinese = chineseScript === 'simplified';

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button flex={1} backgroundColor="brand.primaryAccent">
          Settings
        </Button>
      </Dialog.Trigger>

      <Portal>
        <Dialog.Backdrop />

        <Dialog.Positioner>
          <Dialog.Content rounded="xl">
            <Dialog.Header>
              <Flex w="full" align="center" justify="space-between">
                <Dialog.Title>Settings</Dialog.Title>

                <Dialog.CloseTrigger asChild>
                  <CloseButton />
                </Dialog.CloseTrigger>
              </Flex>
            </Dialog.Header>

            <Dialog.Body pb={6}>
              <VStack align="stretch" gap={5}>
                <Flex align="center" justify="space-between">
                  <VStack align="start" gap={0}>
                    <Text fontWeight="medium">Chinese Script</Text>

                    <Text fontSize="sm" color="fg.muted">
                      Toggle between Simplified and Traditional Chinese
                    </Text>
                  </VStack>

                  <Switch.Root
                    checked={isSimplifiedChinese}
                    onCheckedChange={(e) =>
                      setChineseScript(e.checked ? 'simplified' : 'traditional')
                    }
                  >
                    <Switch.HiddenInput />
                    <Switch.Control />
                  </Switch.Root>
                </Flex>

                <Text fontSize="sm">
                  Current Mode:{' '}
                  <strong>
                    {isSimplifiedChinese ? '简体中文' : '繁體中文'}
                  </strong>
                </Text>
              </VStack>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default SettingsModal;
