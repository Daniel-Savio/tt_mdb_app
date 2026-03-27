import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'



export const useMaps = create()(
  persist(
    (set) => ({
      ieds: {},
      setIeds: (ieds: any) => set({ ieds: ieds }),
    }),
    {
      name: 'maps-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => sessionStorage), // (optional) by default, 'localStorage' is used
    },
  ),
)