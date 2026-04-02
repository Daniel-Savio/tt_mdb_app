import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'


type  GlobalStore = {
  isConnecting: boolean
  setConnecting: (value: boolean) => void
}

export const useGlobal = create<GlobalStore>()(
  persist(
    (set) => ({
      isConnecting: false,
      setConnecting: (value: boolean) => set({ isConnecting: value }),
    }),
    {
      name: 'global-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => sessionStorage), // (optional) by default, 'localStorage' is used
    },
  ),
)