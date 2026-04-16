import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Lang = 'fr' | 'en';

interface LangStore {
  lang: Lang;
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
      setLang: (lang) => set({ lang }),
      toggle: () => set({ lang: get().lang === 'fr' ? 'en' : 'fr' }),
    }),
    { name: 'thrones-lang' },
  ),
);
