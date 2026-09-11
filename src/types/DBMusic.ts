import type { Artist } from '@prisma/client';

/**
 * Database Albums Interface
 */
export interface DBAlbums {
  [key: number]: string;
}

/**
 * Database Artist Type
 */
export type DBArtist = Record<string, Artist>;

/**
 * Database Artist Albums Type
 */
export type DBArtistAlbum = Record<string, Record<string, string[]>>;

/**
 * Database Artist Album Redirect Type
 */
export type DBArtistAlbumRedirect = Record<string, Record<string, string>>;

/**
 * Database SameNames Interface
 */
interface DBSameName {
  name: string;
  Artist: { name: string };
  albumIDs: number[] | string;
  isDefault: boolean;
}

/**
 * Database SameNames Type
 */
export type DBSameNameList = DBSameName[];
