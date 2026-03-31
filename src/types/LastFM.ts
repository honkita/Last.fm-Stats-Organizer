/**
 * Last.fm Album Image Interface
 */
interface lfmImage {
  '#text': string;
  size: 'small' | 'medium' | 'large' | 'extralarge' | 'mega' | string;
}

/**
 * Last.fm Artist Interface
 */
export type lfmArtist = {
  name: string;
  playcount: number;
};

/**
 * Last.fm Album Interface (Direct from the API)
 */
export type lfmAlbum = {
  name: string;
  playcount: number;
  artist: { name: string };
  image: lfmImage[];
};

/**
 * Last.fm Album Interface (Cleaned)
 */
interface lfmAlbumClean {
  playcount: number;
  image: string;
}
/**
 * Last.fm Artist Albums Interface
 */
interface lfmArtistAlbums {
  playcount: number;
  albums: Record<string, lfmAlbumClean>;
}

/**
 * Last.fm Artist Album Map Type
 * @key string - Artist name
 * @value lfmArtistAlbums - Artist albums object from Last.fm
 */
export type lfmArtistAlbumMapType = Record<string, lfmArtistAlbums>;

/**
 * Last.fm Album Map Type
 * @key string - Artist name
 * @key string - Album name
 * @value lfmAlbumClean - Cleaned album info
 */
export type lfmAlbumMapType = Record<string, Record<string, lfmAlbumClean>>;
