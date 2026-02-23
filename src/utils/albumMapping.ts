const globalForArtists = globalThis as unknown as {
  albumsMappingRecord?: Record<string, string>;
};

export const addAlbumMapping = (albumLowerCase: string, albumName: string) => {
  if (!globalForArtists.albumsMappingRecord) {
    globalForArtists.albumsMappingRecord = {};
  }
  globalForArtists.albumsMappingRecord[albumLowerCase] = albumName;
};

export const getAlbumName = (albumLowerCase: string) => {
  if (!globalForArtists.albumsMappingRecord) {
    globalForArtists.albumsMappingRecord = {};
  }
  return globalForArtists.albumsMappingRecord[albumLowerCase];
};
