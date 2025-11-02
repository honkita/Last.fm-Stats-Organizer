import * as OpenCC from "opencc-js";

// Manual mapping for exceptions / romanizations
const manualMap: Record<string, string> = {
   林忆莲: "林憶蓮",
   "Utada Hikaru": "宇多田ヒカル",
   優里: "優里",
};

/**
 * Detect if a string contains Chinese characters
 */
function isChinese(text: string): boolean {
   return /[\u4E00-\u9FFF]/.test(text);
}

/**
 * Detect if a string contains Japanese characters
 */
function isJapanese(text: string): boolean {
   return /[\u3040-\u30FF]/.test(text);
}

/**
 * Canonicalize a name:
 * 1. Converts simplified Chinese → traditional
 * 2. Handles Japanese names manually
 * 3. Applies manual overrides
 */
export function canonicalizeName(name: string): string {
   let normalized = name;

   if (isChinese(name)) {
      const converter = OpenCC.Converter({ from: "hk", to: "cn" });
      normalized = converter(name); // simplified -> traditional
   }

   if (isJapanese(name)) {
      normalized = manualMap[normalized] || normalized;
   }

   normalized = manualMap[normalized] || normalized;

   return normalized;
}
