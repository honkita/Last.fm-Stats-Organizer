// Utils
import { canonicalizeName } from '@/utils/canonicalizeName';

/**
 * Detects if string is predominantly CJK (Chinese/Japanese/Korean)
 * @param name
 * @returns
 */
const isCJK = (name: string): boolean => {
  // Count CJK characters
  const cjk =
    name.match(/[\u4E00-\u9FFF\u3040-\u30FF\u31F0-\u31FF\uFF66-\uFF9F]/g)
      ?.length ?? 0;
  const non = name.replace(
    /[\u4E00-\u9FFF\u3040-\u30FF\u31F0-\u31FF\uFF66-\uFF9F]/g,
    '',
  ).length;

  // Consider "predominantly CJK" if ≥ 40% characters are CJK
  // (can adjust threshold if needed)
  return cjk > 0 && cjk >= non * 0.4;
};

/**
 * Normalizes commas based on if the string is Japanese/Chinese or not
 * @param name
 * @returns
 */
export const normalizeCommas = (name: string): string => {
  if (!name) return name;

  const useCjkComma = isCJK(name);
  const targetComma = useCjkComma ? '，' : ',';

  // Normalize all comma variants but *preserve chosen comma style*
  return name
    .replace(/[\uFF0C,]\s*/g, targetComma)
    .replace(/\s*([，,])\s*/g, targetComma)
    .trim();
};

/**
 * Normalizes brackets and commas in a string, with special handling for CJK text.
 * - Converts all types of brackets to standard parentheses ( )
 * - Normalizes commas to either full-width (，) or half-width (,) based on whether the text is predominantly CJK
 * - Collapses multiple spaces and trims the result
 * @param name
 * @returns The normalized string
 */
export const normalizeBrackets = (name: string): string => {
  if (!name) return name;

  const leftBracket = '(';
  const rightBracket = ')';

  // Normalize all comma variants but *preserve chosen comma style*
  return name
    .replace(/([【\(])/g, leftBracket)
    .replace(/([】\)])/g, rightBracket)
    .replace(/\(\s+/g, '(')
    .trim();
};

/**
 * Full artist name normalization
 * @param name
 * @param skipChinese
 * @returns
 */
export const normalizeArtistFull = async (
  name: string,
  skipChinese: boolean,
): Promise<string> => {
  const pre = normalizeBrackets(
    normalizeSpaces(normalizeCommas(normalizeCV(name))),
  );
  return canonicalizeName(pre, { skipChineseConversion: skipChinese });
};

/**
 * Convert ASCII digits (0-9) to full-width digits (０-９)
 */
// export const toFullWidthNumbers = (input: string): string => {
//    return input.replace(/[0-9]/g, (digit) =>
//       String.fromCharCode(digit.charCodeAt(0) + 0xfee0),
//    );
// };

/**
 * Converts full-width digits (０-９) to ASCII digits (0-9)
 * @param name
 * @returns
 */
export const toHalfWidthNumbers = (name: string): string => {
  return name.replace(/[０-９]/g, (digit) =>
    String.fromCharCode(digit.charCodeAt(0) - 0xfee0),
  );
};

/**
 * Normalizes Unicode characters, including:
 * - NFKC normalization (handles full-width, compatibility chars)
 * - Normalizes various apostrophes to '
 * - Normalizes various quotes to "
 * - Collapses multiple spaces into one and trims
 * @param s
 * @returns
 */
const normalizeUnicode = (name: string) =>
  name
    .normalize('NFKC') // handles full-width, compatibility chars
    .replace(/[\u2018\u2019\u201B\u2032]/g, "'") // all apostrophes → '
    .replace(/[\u201C\u201D]/g, '"') // quotes → "
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Canonical album key (FOR MATCHING ONLY)
 * @param name
 * @returns
 */
export const canonicalAlbumKey = (name: string): string => {
  return normalizeAlbumFull(
    normalizeSymbols(
      normalizeBrackets(toHalfWidthNumbers(normalizeUnicode(name))),
    ),
  )
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .toLowerCase();
};

/**
 * Normalizes various symbols in a string
 * @param name
 * @returns
 */
export const normalizeSymbols = (name: string): string => {
  if (!name) return name;

  return (
    name
      // Normalize question marks
      .replace(/[？]/g, '?')

      // Normalize tildes
      .replace(/[〜～]/g, '~')

      // Normalize spacing around tildes
      .replace(/\s*~\s*/g, '~')

      // Normalize Japanese quotes to parentheses
      .replace(/[「『【]/g, '(')
      .replace(/[」』】]/g, ')')

      // Normalize full-width spaces
      .replace(/　/g, ' ')

      // Collapse whitespace
      .replace(/\s+/g, ' ')
      .trim()
  );
};

/**
 * Full album name normalization
 * - Removes common edition tags like (Deluxe Edition), (Video Version), - EP, etc.
 * - Normalizes brackets and commas
 * - Converts full-width numbers to half-width
 * @param name
 * @returns
 */
export const normalizeAlbumFull = (name: string): string => {
  const normalized = normalizeBrackets(
    name
      .replace(
        /\s*\((Standard|Video|Deluxe|Expanded|Special|Unmixed Extended)(\s*(Edition|Version|Ver|Versions\.?))?\)/gi,
        '',
      )
      .replace(/\s*-\s*(?:EP|Single)$/i, '')
      .replace(/\s+(?:EP)$/i, '')
      .trim(),
  ).replace(/Version\s*\)$/i, 'Ver.)');

  return toHalfWidthNumbers(normalized);
};

/**
 * Remove any spaces between two Chinese/Japanese characters
 * @param name
 * @return
 */
export const normalizeSpaces = (name: string): string => {
  if (!name) return name;

  // Remove spaces between two CJK characters
  return name.replace(
    /([\u4E00-\u9FFF\u3040-\u30FF\u31F0-\u31FF\uFF66-\uFF9F])\s+([\u4E00-\u9FFF\u3040-\u30FF\u31F0-\u31FF\uFF66-\uFF9F])/g,
    '$1$2',
  );
};

/**
 * Normalizes seiyuu CV patterns to (CV.NAME)
 * @param name
 * @returns
 */
/**
 * Normalizes seiyuu CV patterns to (CV.NAME)
 * Handles ASCII and full-width punctuation like Japanese/Chinese colons.
 */
/**
 * Normalizes seiyuu CV patterns to (CV.NAME)
 * Supports full-width brackets & punctuation.
 */
/**
 * Normalizes seiyuu CV patterns:
 * - Converts any CJK brackets to standard ( )
 * - Normalizes CV patterns to (CV.NAME)
 * - Ensures EXACTLY ONE space before "(" when there is preceding text
 */
export const normalizeCV = (name: string): string => {
  if (!name) return name;

  // Normalize CJK brackets to ASCII () so regex is simpler
  const normalized = name
    .replace(/[（【「『《]/g, '(')
    .replace(/[）】」』》]/g, ')');

  // Match any (...) containing CV
  const cvRegex = /\(([^)]*CV[^)]*)\)/gi;

  let result = normalized.replace(cvRegex, (full, inner) => {
    // Matches CV + optional punctuation + name
    const match = inner.match(/^CV[\s.:：．]*(.*)$/i);
    if (!match) return full;

    const name = match[1].trim();

    // (CV) if empty name
    if (!name) return `(CV)`;

    // Already like (CV.Name)
    if (/^CV\.[^()]+$/i.test(inner.trim())) {
      return `(${inner.trim()})`;
    }

    return `(CV.${name})`;
  });

  // Ensure EXACTLY 1 space before "(" unless it is at line start
  result = result.replace(/(\S)\s*\(/g, '$1 (');

  return result;
};
