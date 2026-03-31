import type { Artist as DBArtist } from '@prisma/client';

/**
 * Merged Artist Interface
 */
interface Artist {
  id: number | -1;
  playcount: number;
  ignoreChinese: boolean;
}

/**
 * Database Album Interface (Cleaned)
 */
export interface DBAlbumClean {
  name: string;
  aliases: string[];
}

/**
 * Cleaned Albums Interface
 */
interface cleanedAlbums {
  playcount: number;
  image: string;
}

/**
 * Artist Album Container Interface
 */
export interface artistAlbumContainer extends Artist {
  albums: Record<string, cleanedAlbums>;
}

/**
 * Artist Top Album Interface
 */
export type artistAlbumTopAlbum = Artist & {
  name: string;
  albumName: string;
  topAlbumImage: string;
};

/**
 * Same Artist Values Interface
 */
export interface sameArtistValues {
  default: string;
  splits: Record<string, { albumNames: string[] }>;
}

/**
 * Database Artist Map Type
 * @key string - Artist name
 * @value DBArtist - Artist object from the database
 */
export type dbArtistMapType = Record<string, DBArtist>;

/**
 * Artist Clean Albums Map Type
 * @key string - Artist name
 * @value cleanedAlbums - Cleaned albums object
 */
export type artistCleanAlbumsMapType = Record<string, cleanedAlbums>;

/**
 * Artist Album Container Map Type
 * @key string - Artist name
 * @value artistAlbumContainer - Merged artist and album information
 */
export type artistAlbumContainerMapType = Record<string, artistAlbumContainer>;
