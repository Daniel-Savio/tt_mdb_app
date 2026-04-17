import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'


type  GlobalStore = {
  isConnecting: boolean
  isReading: boolean
  isConnected: boolean
  readingRate: number
  offlineDevice: string
  offlineFirmware: string
  setOfflineDevice: (value: string) => void
  setOfflineFirmware: (value: string) => void
  setConnecting: (value: boolean) => void
  setReading: (value: boolean) => void
  setConnected: (value: boolean) => void
  setReadingRate: (value: number) => void
}

export const useGlobal = create<GlobalStore>()(
  persist(
    (set) => ({
      isConnecting: false,
      isReading: false,
      isConnected: false,
      readingRate: 5000,
      offlineDevice: "",
      offlineFirmware: "",
      setConnecting: (value: boolean) => set({ isConnecting: value }),
      setReading: (value: boolean) => set({ isReading: value }),
      setConnected: (value: boolean) => set({ isConnected: value }),
      setReadingRate: (value: number) => set({ readingRate: value }),
      setOfflineDevice: (value: string) => set({ offlineDevice: value }),
      setOfflineFirmware: (value: string) => set({ offlineFirmware: value })

    }),
    {
      name: 'global-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => sessionStorage), // (optional) by default, 'localStorage' is used
    },
  ),
)