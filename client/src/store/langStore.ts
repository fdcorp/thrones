import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Lang = 'fr' | 'en';

interface LangStore {
  lang: Lang;
  userOverride: boolean;
  setLang: (lang: Lang) => void;
  toggle: () => void;
}

function detectLang(): Lang {
  const browser = navigator.language || 'en';
  return browser.toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

export const useLangStore = create<LangStore>()(
  persist(
    (set, get) => ({
      lang: detectLang(),
      userOverride: false,
      setLang: (lang) => set({ lang, userOverride: true }),
      toggle: () => set({ lang: get().lang === 'fr' ? 'en' : 'fr', userOverride: true }),
    }),
    {
      name: 'thrones-lang',
      merge: (persisted, current) => {
        const stored = persisted as { lang?: Lang; userOverride?: boolean } | null;
        // If the user never explicitly chose a language, always re-detect from browser
        if (!stored?.userOverride) {
          return { ...current, lang: detectLang(), userOverride: false };
        }
        return { ...current, ...stored };
      },
    },
  ),
);
