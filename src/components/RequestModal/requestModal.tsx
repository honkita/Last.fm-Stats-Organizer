'use client';

// React
import { useEffect, useState } from 'react';

// Chakra UI
import {
  Button,
  Dialog,
  Tabs,
  Textarea,
  VStack,
  Portal,
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

  const [reason, setReason] = useState('');

  const [otherRequest, setOtherRequest] = useState('');

  const resetForm = () => {
    setArtistA('');
    setArtistB('');
    setAlbumArtist('');
    setAlbumA('');
    setAlbumB('');
    setReason('');
  };

  type RequestType = 'artist' | 'album' | 'other';

  const submit: (type: RequestType) => Promise<void> = async (type) => {
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
        onClick={() => setOpen(true)}
        backgroundColor="brand.primaryAccent"
      >
        Request Merge
      </Button>

      {/* Modal */}
      <Dialog.Root open={open} onOpenChange={(e) => setOpen(e.open)}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxW="lg">
              <Dialog.Header>
                <Dialog.Title>Submit Change Request</Dialog.Title>
              </Dialog.Header>

              <Dialog.Body>
                <Tabs.Root defaultValue="artist" variant="enclosed">
                  <Tabs.List width="100%">
                    {Object.entries(tabs).map(([key, value]) => (
                      <Tabs.Trigger width="100%" key={key} value={key}>
                        {value}
                      </Tabs.Trigger>
                    ))}
                  </Tabs.List>

                  {/* Artist Merge */}
                  <Tabs.Content value="artist">
                    <VStack mt={4} gap={3}>
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
                      />

                      <ConfirmButton type="artist" submit={submit} />
                    </VStack>
                  </Tabs.Content>

                  {/* Album Merge */}
                  <Tabs.Content value="album">
                    <VStack mt={4} gap={3}>
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
                      />
                      <ConfirmButton type="album" submit={submit} />
                    </VStack>
                  </Tabs.Content>
                  <Tabs.Content value="other">
                    <VStack mt={4} gap={3}>
                      <Textarea
                        placeholder="Describe your request..."
                        value={otherRequest}
                        onChange={(e) => setOtherRequest(e.target.value)}
                      />

                      <VStack width="100%" gap={2}>
                        <ConfirmButton type="other" submit={submit} />
                      </VStack>
                    </VStack>
                  </Tabs.Content>
                </Tabs.Root>
              </Dialog.Body>

              <Dialog.Footer>
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  Clear
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
};

export default RequestModal;
