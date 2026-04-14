/**
 * Capitalizes the first letter of a string and lowercases the rest.
 * @param s
 * @returns
 */
export const capitalize = (s: string) =>
  s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
