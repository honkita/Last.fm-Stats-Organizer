import * as OpenCC from "opencc-js";

/**
 * Manual override map
 */
const manualMap: Record<string, string> = {};

/**
 * CJK detection ranges (Chinese, Japanese, Korean) with Unicode
 */
const CJK_REGEX =
  /[\u4E00-\u9FFF\u3040-\u30FF\u31F0-\u31FF\u3400-\u4DBF\uF900-\uFAFF]/;

/**
 * Returns true if the text contains any Chinese characters.
 * @param text
 * @returns
 */
export const isChinese = (text: string): boolean => {
  return /[\u4E00-\u9FFF]/.test(text);
};

/**
 * Returns true if the text contains any Japanese characters.
 * Supercedes isChinese in terms of priority.
 * @param text
 * @returns
 */
export const isJapanese = (text: string): boolean => {
  return /[\u3040-\u30FF]/.test(text);
};

/**
 * Removes the spaces between CJK characters since not needed!
 * @param text
 * @returns
 */
export const removeCJKInnerSpaces = (text: string): string => {
  return text.replace(/(\S)\s+(\S)/g, (match, left, right) => {
    if (CJK_REGEX.test(left) && CJK_REGEX.test(right)) {
      return left + right;
    }
    return match;
  });
};

/**
 * Canonicalize a name by normalizing spaces, converting Traditional Chinese to Simplified by default, unless the skipChineseConversion option is set.
 * @param rawName
 * @param opts
 * @returns
 */
export const canonicalizeName = (
  rawName: string,
  opts?: { skipChineseConversion?: boolean },
): string => {
  let normalized = removeCJKInnerSpaces(rawName);

  const skipChineseConversion = !!opts?.skipChineseConversion;

  // Only apply OpenCC when the string only contains Chinese characters and does not have the canonize field set to skip.
  if (
    isChinese(normalized) &&
    !isJapanese(normalized) &&
    !skipChineseConversion
  ) {
    try {
      // Traditional -> Simplified
      const converter = OpenCC.Converter({ from: "t", to: "cn" });
      normalized = converter(normalized);
    } catch (e) {
      // Warn about conversion failure
      console.warn("OpenCC conversion failed:", normalized, e);
    }
  }

  // Apply Japanese manual map if applicable
  if (isJapanese(normalized)) {
    normalized = manualMap[normalized] || normalized;
  }

  // Global manual map override
  normalized = manualMap[normalized] || normalized;

  return normalized;
};
