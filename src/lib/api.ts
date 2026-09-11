// Lib
import { getCached } from '@/lib/apiCache';
const API_URL = process.env.NEXT_PUBLIC_LASTFM_API_URL!;

// Types
import type {
  DBAlbums,
  DBArtist,
  DBArtistAlbum,
  DBArtistAlbumRedirect,
  DBSameNameList,
} from '@/types/DBMusic';

export const getAlbum = () => getCached<DBAlbums>(`${API_URL}/api/Album`);

export const getArtist = () => getCached<DBArtist>(`${API_URL}/api/Artist`);

export const getArtistAlbum = () =>
  getCached<DBArtistAlbum>(`${API_URL}/api/ArtistAlbum`);

export const getArtistAlbumRedirect = () =>
  getCached<DBArtistAlbumRedirect>(`${API_URL}/api/ArtistAlbumRedirect`);

export const getSameNames = () =>
  getCached<DBSameNameList>(`${API_URL}/api/SameName`);

// export const getArtistTags = () =>
//   getCached<ArtistTag>(`${API_URL}/api/ArtistTags`);
