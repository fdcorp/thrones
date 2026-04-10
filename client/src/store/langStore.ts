import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Lang = 'fr' | 'en';

interface LangStore {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggle: () => void;
}

export const useLangStore = create<LangStore>()(
  persist(
    (set, get) => ({
      lang: 'fr',
      setLang: (lang) => set({ lang }),
      toggle: () => set({ lang: get().lang === 'fr' ? 'en' : 'fr' }),
    }),
    { name: 'thrones-lang' },
  ),
);
