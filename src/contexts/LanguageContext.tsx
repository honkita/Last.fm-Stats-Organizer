'use client';

import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

type ChineseScript = 'simplified' | 'traditional';

interface LanguageContextType {
  chineseScript: ChineseScript;
  setChineseScript: (script: ChineseScript) => void;
  isSimplifiedChinese: boolean;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [chineseScript, setChineseScript] =
    useState<ChineseScript>('simplified');

  const value = useMemo(
    () => ({
      chineseScript,
      setChineseScript,
      isSimplifiedChinese: chineseScript === 'simplified',
    }),
    [chineseScript],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider');
  }

  return context;
}
