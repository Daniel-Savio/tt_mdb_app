import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'


type LanguageStore = {
  language: string
  setEnglish: () => void
  setPortuguese: () => void
}

export const useLanguage = create<LanguageStore>()(
  persist(
    (set) => ({
      language: 'pt-br',
      setEnglish: () => set({ language: 'en-us' }),
      setPortuguese: () => set({ language: 'pt-br' }),
    }),
    {
      name: 'language-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => sessionStorage), // (optional) by default, 'localStorage' is used
    },
  ),
)