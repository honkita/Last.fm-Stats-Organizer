type CacheEntry<T> = {
  promise: Promise<T>;
  data?: T;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache = new Map<string, CacheEntry<any>>();

const getCached = async <T>(url: string): Promise<T> => {
  const existing = cache.get(url);

  // Already loaded
  if (existing?.data) {
    return existing.data;
  }

  // Currently loading
  if (existing) {
    return existing.promise;
  }

  // First request
  const promise = fetch(url).then(async (res) => {
    if (!res.ok) {
      cache.delete(url);
      throw new Error(`Failed to fetch ${url}`);
    }

    const data = (await res.json()) as T;

    cache.set(url, {
      promise: Promise.resolve(data),
      data,
    });

    return data;
  });

  cache.set(url, { promise });

  return promise;
};

const clearCache = (url?: string) => {
  if (url) {
    cache.delete(url);
  } else {
    cache.clear();
  }
};

export { getCached, clearCache };
