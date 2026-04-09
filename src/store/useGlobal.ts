import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'


type  GlobalStore = {
  isConnecting: boolean
  isReading: boolean
  isConnected: boolean
  setConnecting: (value: boolean) => void
  setReading: (value: boolean) => void
  setConnected: (value: boolean) => void
}

export const useGlobal = create<GlobalStore>()(
  persist(
    (set) => ({
      isConnecting: false,
      isReading: false,
      isConnected: false,
      setConnecting: (value: boolean) => set({ isConnecting: value }),
      setReading: (value: boolean) => set({ isReading: value }),
      setConnected: (value: boolean) => set({ isConnected: value }),

    }),
    {
      name: 'global-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => sessionStorage), // (optional) by default, 'localStorage' is used
    },
  ),
)