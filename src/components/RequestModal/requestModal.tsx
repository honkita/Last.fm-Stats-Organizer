'use client';

// React
import { useEffect, useState } from 'react';

// Chakra UI
import {
  Box,
  Button,
  Dialog,
  Tabs,
  Text,
  Textarea,
  VStack,
  Portal,
  HStack,
} from '@chakra-ui/react';

// Components
import AutocompleteInput from './autocompleteInput';
import ConfirmButton from './confirmButton';

const RequestModal = ({
  defaultUser,
  artistsList,
  artistAlbumsMap,
}: {
  defaultUser?: string;
  artistsList: string[];
  artistAlbumsMap: Record<string, string[]>;
}) => {
  const [open, setOpen] = useState(false);

  // Artist merge state
  const [artistA, setArtistA] = useState('');
  const [artistB, setArtistB] = useState('');

  // Album merge state
  const [albumArtist, setAlbumArtist] = useState('');
  const [albumA, setAlbumA] = useState('');
  const [albumB, setAlbumB] = useState('');

  // Reason state for merging/changing
  const [reason, setReason] = useState('');

  const [otherRequest, setOtherRequest] = useState('');

  // Error Messages
  const [artistError, setArtistError] = useState('');
  const [albumError, setAlbumError] = useState('');
  const [otherError, setOtherError] = useState('');

  // Active Tab
  const [activeTab, setActiveTab] = useState<RequestType>('artist');

  const resetForm = () => {
    // Reset artist fields
    setArtistA('');
    setArtistB('');
    setAlbumArtist('');

    // Reset album fields
    setAlbumA('');
    setAlbumB('');
    setReason('');

    // Reset other request field
    setOtherRequest('');

    // Reset the error states
    setArtistError('');
    setAlbumError('');
    setOtherError('');
  };

  type RequestType = 'artist' | 'album' | 'other';

  const submit: (type: RequestType) => Promise<void> = async (type) => {
    // Reset errors
    setArtistError('');
    setAlbumError('');
    setOtherError('');

    if (type === 'artist') {
      if (!artistA || !artistB) {
        setArtistError('Both artists are required.');
        return;
      }
      if (artistA === artistB) {
        setArtistError('Artists must be different.');
        return;
      }
    }

    if (type === 'album') {
      if (!albumArtist || !albumA || !albumB) {
        setAlbumError('Artist and both albums are required.');
        return;
      }
      if (albumA === albumB) {
        setAlbumError('Albums must be different.');
        return;
      }
    }

    if (type === 'other') {
      if (!otherRequest.trim()) {
        setOtherError('Request cannot be empty.');
        return;
      }
    }
    const payload =
      type === 'artist'
        ? {
            type,
            artistA,
            artistB,
            reason,
            user: defaultUser,
          }
        : type === 'album'
          ? {
              type,
              artist: albumArtist,
              albumA,
              albumB,
              reason,
              user: defaultUser,
            }
          : {
              type,
              reason,
              user: defaultUser,
            };

    try {
      const res = await fetch('/api/MergeRequest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();

      // Reset + close
      resetForm();
      setOpen(false);
    } catch {
      alert('Failed to submit request');
    }
  };

  const tabs = { artist: 'Artist Merge', album: 'Album Merge', other: 'Other' };

  useEffect(() => {
    setAlbumA('');
    setAlbumB('');
  }, [albumArtist]);

  return (
    <>
      {/* Trigger */}
      <Button
        onClick={() => {
          resetForm();
          setOpen(true);
        }}
        backgroundColor="brand.primaryAccent"
      >
        Request Merge
      </Button>

      {/* Modal */}
      <Dialog.Root open={open} onOpenChange={(e) => setOpen(e.open)}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content
              maxW="lg"
              height="80%"
              display="flex"
              flexDirection="column"
            >
              <Dialog.Header>
                <Dialog.Title>Submit Change Request</Dialog.Title>
              </Dialog.Header>

              <Dialog.Body
                display="flex"
                flexDirection="column"
                overflow="hidden"
                flex={1}
              >
                <Tabs.Root
                  defaultValue="artist"
                  variant="enclosed"
                  value={activeTab}
                  onValueChange={(e) => setActiveTab(e.value as RequestType)}
                  style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
                >
                  <Tabs.List width="100%">
                    {Object.entries(tabs).map(([key, value]) => (
                      <Tabs.Trigger width="100%" key={key} value={key}>
                        {value}
                      </Tabs.Trigger>
                    ))}
                  </Tabs.List>

                  {/* Artist Merge */}
                  <Tabs.Content
                    value="artist"
                    style={{ flex: 1, display: 'flex', overflow: 'hidden' }}
                  >
                    <VStack flex={1} mt={4} gap={3} align="stretch">
                      <AutocompleteInput
                        value={artistA}
                        onChange={setArtistA}
                        placeholder="Artist A"
                        options={artistsList}
                      />
                      <AutocompleteInput
                        value={artistB}
                        onChange={setArtistB}
                        placeholder="Artist B"
                        options={artistsList}
                      />
                      <Textarea
                        placeholder="Reason (optional)"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        resize="none"
                        flex={1}
                        overflowY="auto"
                      />
                      <Text color="red.400" fontSize="sm">
                        {artistError}
                      </Text>
                    </VStack>
                  </Tabs.Content>

                  {/* Album Merge */}
                  <Tabs.Content
                    value="album"
                    style={{ flex: 1, display: 'flex', overflow: 'hidden' }}
                  >
                    <VStack flex={1} mt={4} gap={3} align="stretch">
                      <AutocompleteInput
                        value={albumArtist}
                        onChange={setAlbumArtist}
                        placeholder="Artist"
                        options={artistsList}
                      />
                      <AutocompleteInput
                        value={albumA}
                        onChange={setAlbumA}
                        placeholder="Album A"
                        options={artistAlbumsMap[albumArtist] || []}
                      />
                      <AutocompleteInput
                        value={albumB}
                        onChange={setAlbumB}
                        placeholder="Album B"
                        options={artistAlbumsMap[albumArtist] || []}
                      />
                      <Textarea
                        placeholder="Reason (optional)"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        resize="none"
                        flex={1}
                        overflowY="auto"
                      />
                      <Text color="red.400" fontSize="sm">
                        {albumError}
                      </Text>
                    </VStack>
                  </Tabs.Content>
                  <Tabs.Content
                    value="other"
                    style={{ flex: 1, display: 'flex', overflow: 'hidden' }}
                  >
                    <VStack flex={1} mt={4} gap={3} align="stretch">
                      <Textarea
                        placeholder="Describe your request..."
                        value={otherRequest}
                        onChange={(e) => setOtherRequest(e.target.value)}
                        flex={1}
                        resize="none"
                      />
                      <Text color="red.400" fontSize="sm">
                        {otherError}
                      </Text>
                    </VStack>
                  </Tabs.Content>
                </Tabs.Root>
              </Dialog.Body>

              <Dialog.Footer>
                <VStack width="100%" justifyContent="flex-end">
                  <ConfirmButton type={activeTab} submit={submit} />

                  <HStack width="100%">
                    <Button
                      flex={1}
                      variant="outline"
                      onClick={() => setOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button flex={1} variant="outline" onClick={resetForm}>
                      Clear
                    </Button>
                  </HStack>
                </VStack>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
};

export default RequestModal;
