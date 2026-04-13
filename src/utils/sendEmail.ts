// Prisma
import { Artist } from '@prisma/client';

// Resend
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_KEY);

// Safe fetch helper
const fetchJsonOrNull = async (url: string) => {
  try {
    const res = await fetch(url);

    if (!res.ok) {
      console.warn(`API returned ${res.status} for ${url}`);
      return null;
    }

    // Try to parse JSON
    const data = await res.json();
    return data;
  } catch (err) {
    console.error(`Failed to fetch JSON from ${url}:`, err);
    return null;
  }
};

const artistId = async (
  artistName: string,
  dbArtists: Record<string, Artist>,
) => {
  if (!artistName) return '';
  const artist = dbArtists[artistName];
  return artist?.id ?? '';
};

const albumId = async (albumName: string) => {
  if (!albumName) return '';
  const data = await fetchJsonOrNull(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/Albums/Single?albumName=${encodeURIComponent(
      albumName,
    )}`,
  );
  return data?.id ?? '';
};

interface SendEmailProps {
  type: 'artist' | 'album';
  artistA?: string;
  artistB?: string;
  artist?: string;
  albumA?: string;
  albumB?: string;
  reason: string;
  user?: string;
}

export const sendEmail = async ({
  type,
  artistA,
  artistB,
  artist,
  albumA,
  albumB,
  reason,
  user,
}: SendEmailProps) => {
  const subject =
    type === 'artist'
      ? `Artist Merge Request: ${artistA} + ${artistB}`
      : `Album Merge Request: ${albumA} + ${albumB}`;

  const start = `${user ?? 'Someone'} has a new ${type} merge request:\n\n`;

  let details = '';

  const dbArtists = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/Artist`,
  ).then((res) => res.json());

  // Fetch artist/album IDs for better context
  if (type === 'artist') {
    const artists = [artistA, artistB];
    for (const [index, a] of artists.entries()) {
      const id = await artistId(a ?? '', dbArtists);
      details += `Artist ${index + 1}: ${a ?? ''} (${id || 'Not found'})\n`;
    }
  } else if (type === 'album') {
    const albums = [albumA, albumB];
    const id = await artistId(artist ?? '', dbArtists);
    details += `Artist: ${artist ?? ''} (${id || 'Not found'})\n`;
    for (const [index, alb] of albums.entries()) {
      const aId = id ? await albumId(alb ?? '') : '';
      details += `Album ${index + 1}: ${alb ?? ''} (${aId || 'Not found'})\n`;
    }
  }

  const reasonText = `Reason: ${reason}\n\n`;

  const text = start + details + reasonText;

  console.log(text);

  // Send email via Resend
  await resend.emails.send({
    from: 'Last.fm Enhanced States Requests <onboarding@resend.dev>',
    to: process.env.TO_EMAIL!,
    subject,
    text,
  });
};
