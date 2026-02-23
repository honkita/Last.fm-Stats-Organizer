// Utils
import { canonicalizeName } from "@/utils/canonicalizeName";

/**
 * Detects if string is predominantly CJK (Chinese/Japanese/Korean)
 */
const isCJK = (str: string): boolean => {
  // Count CJK characters
  const cjk =
    str.match(/[\u4E00-\u9FFF\u3040-\u30FF\u31F0-\u31FF\uFF66-\uFF9F]/g)
      ?.length ?? 0;
  const non = str.replace(
    /[\u4E00-\u9FFF\u3040-\u30FF\u31F0-\u31FF\uFF66-\uFF9F]/g,
    "",
  ).length;

  // Consider "predominantly CJK" if ≥ 40% characters are CJK
  // (can adjust threshold if needed)
  return cjk > 0 && cjk >= non * 0.4;
};

/**
 * Normalizes commas based on if the string is Japanese/Chinese or not
 * @param str
 * @returns
 */
export const normalizeCommas = (str: string): string => {
  if (!str) return str;

  const useCjkComma = isCJK(str);
  const targetComma = useCjkComma ? "，" : ",";

  // Normalize all comma variants but *preserve chosen comma style*
  return str
    .replace(/[\uFF0C,]\s*/g, targetComma)
    .replace(/\s*([，,])\s*/g, targetComma)
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
  const pre = normalizeSpaces(normalizeCommas(normalizeCV(name)));
  return canonicalizeName(pre, { skipChineseConversion: skipChinese });
};

/**
 * Full album name normalization
 * @param name
 * @returns
 */
export const normalizeAlbumFull = (name: string): string => {
  return name.replace(/\s*-\s*(Single|EP)$/i, "").trim();
};

/**
 * Remove any spaces between two Chinese/Japanese characters
 * @param str
 */
export const normalizeSpaces = (str: string): string => {
  if (!str) return str;

  // Remove spaces between two CJK characters
  return str.replace(
    /([\u4E00-\u9FFF\u3040-\u30FF\u31F0-\u31FF\uFF66-\uFF9F])\s+([\u4E00-\u9FFF\u3040-\u30FF\u31F0-\u31FF\uFF66-\uFF9F])/g,
    "$1$2",
  );
};

/**
 * Normalizes seiyuu CV patterns to (CV.NAME)
 * @param str
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
export const normalizeCV = (str: string): string => {
  if (!str) return str;

  // Normalize CJK brackets to ASCII () so regex is simpler
  const normalized = str
    .replace(/[（【「『《]/g, "(")
    .replace(/[）】」』》]/g, ")");

  // Match any (...) containing CV
  const cvRegex = /\(([^)]*CV[^)]*)\)/gi;

  let result = normalized.replace(cvRegex, (full, inner) => {
    // Matches CV + optional punctuation + name
    const match = inner.match(/^CV[\s.:：．]*(.*)$/i);
    if (!match) return full;

    let name = match[1].trim();

    // (CV) if empty name
    if (!name) return `(CV)`;

    // Already like (CV.Name)
    if (/^CV\.[^()]+$/i.test(inner.trim())) {
      return `(${inner.trim()})`;
    }

    return `(CV.${name})`;
  });

  // Ensure EXACTLY 1 space before "(" unless it is at line start
  result = result.replace(/(\S)\s*\(/g, "$1 (");

  return result;
};
