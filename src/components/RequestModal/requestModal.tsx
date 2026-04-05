'use client';

// React
import { useEffect, useState } from 'react';

// Chakra UI
import {
  Button,
  Dialog,
  Tabs,
  Input,
  Textarea,
  VStack,
  Portal,
} from '@chakra-ui/react';

// Components
import SuggestionList from './suggestionList';

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

  const submit = async (type: 'artist' | 'album') => {
    const payload =
      type === 'artist'
        ? {
            type,
            artistA,
            artistB,
            reason,
            user: defaultUser,
          }
        : {
            type,
            artist: albumArtist,
            albumA,
            albumB,
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
      setArtistA('');
      setArtistB('');
      setAlbumArtist('');
      setAlbumA('');
      setAlbumB('');
      setReason('');
      setOpen(false);
    } catch {
      alert('Failed to submit request');
    }
  };

  const useSuggestions = (list: string[], query: string) => {
    if (!query.trim()) return [];

    const q = query.toLowerCase();

    return list.filter((item) => item.toLowerCase().includes(q)).slice(0, 5); // limit results
  };

  const artistSuggestionsA = useSuggestions(artistsList, artistA);
  const artistSuggestionsB = useSuggestions(artistsList, artistB);
  const albumArtistSuggestions = useSuggestions(artistsList, albumArtist);

  const albumList = artistAlbumsMap[albumArtist] || [];
  const albumSuggestionsA = useSuggestions(albumList, albumA);
  const albumSuggestionsB = useSuggestions(albumList, albumB);

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
                <Dialog.Title>Submit Merge Request</Dialog.Title>
              </Dialog.Header>

              <Dialog.Body>
                <Tabs.Root defaultValue="artist" variant="enclosed">
                  <Tabs.List>
                    <Tabs.Trigger value="artist">Artist Merge</Tabs.Trigger>
                    <Tabs.Trigger value="album">Album Merge</Tabs.Trigger>
                  </Tabs.List>

                  {/* Artist Merge */}
                  <Tabs.Content value="artist">
                    <VStack mt={4} gap={3}>
                      <VStack position="relative" width="100%">
                        <Input
                          placeholder="Artist A"
                          value={artistA}
                          onChange={(e) => setArtistA(e.target.value)}
                        />
                        <SuggestionList
                          items={artistSuggestionsA}
                          onSelect={(val) => setArtistA(val)}
                        />
                      </VStack>
                      <VStack position="relative" width="100%">
                        <Input
                          placeholder="Artist B"
                          value={artistB}
                          onChange={(e) => setArtistB(e.target.value)}
                        />
                        <SuggestionList
                          items={artistSuggestionsB}
                          onSelect={(val) => setArtistB(val)}
                        />
                      </VStack>

                      <Textarea
                        placeholder="Reason (optional)"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                      />

                      <Button
                        onClick={() => submit('artist')}
                        backgroundColor="brand.primaryAccent"
                      >
                        Submit Artist Merge
                      </Button>
                    </VStack>
                  </Tabs.Content>

                  {/* Album Merge */}
                  <Tabs.Content value="album">
                    <VStack mt={4} gap={3}>
                      <VStack position="relative" width="100%">
                        <Input
                          placeholder="Artist"
                          value={albumArtist}
                          onChange={(e) => setAlbumArtist(e.target.value)}
                        />
                        <SuggestionList
                          items={albumArtistSuggestions}
                          onSelect={(val) => setAlbumArtist(val)}
                        />
                      </VStack>
                      <VStack position="relative" width="100%">
                        <Input
                          placeholder="Album A"
                          value={albumA}
                          onChange={(e) => setAlbumA(e.target.value)}
                        />
                        <SuggestionList
                          items={albumSuggestionsA}
                          onSelect={(val) => setAlbumA(val)}
                        />
                      </VStack>
                      <VStack position="relative" width="100%">
                        <Input
                          placeholder="Album B"
                          value={albumB}
                          onChange={(e) => setAlbumB(e.target.value)}
                        />
                        <SuggestionList
                          items={albumSuggestionsB}
                          onSelect={(val) => setAlbumB(val)}
                        />
                      </VStack>

                      <Textarea
                        placeholder="Reason (optional)"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                      />

                      <Button
                        onClick={() => submit('album')}
                        backgroundColor="brand.primaryAccent"
                      >
                        Submit Album Merge
                      </Button>
                    </VStack>
                  </Tabs.Content>
                </Tabs.Root>
              </Dialog.Body>

              <Dialog.Footer>
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
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
