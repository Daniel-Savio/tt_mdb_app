import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface ModbusConnection {
  device: string
  firmware: string
  host: string
  port: number
  slaveId: number
  timeout: number
  retries: number
  serialPort: string
  baudrate: number
  parity: 'none' | 'even' | 'odd'
  stopBits: number
  dataBits: number
  isTcp: boolean
}

interface ModbusStore {
  connection: ModbusConnection
  setDevice: (device: string) => void
  setFirmware: (firmware: string) => void
  setConnection: (connection: Partial<ModbusConnection>) => void
  resetConnection: () => void
}

const defaultConnection: ModbusConnection = {
  device: '',
  firmware: '',
  host: '',
  serialPort: '',
  port: 502,
  baudrate: 9600,
  parity: 'none',
  stopBits: 1,
  dataBits: 8,
  slaveId: 1,
  timeout: 5000,
  retries: 3,
  isTcp: true,
}

export const useModbusConnection = create<ModbusStore>()(
  persist(
    (set) => ({
      connection: defaultConnection,
      setDevice: (device: string) =>
        set((state) => ({
          connection: { ...state.connection, device },
        })),
      setFirmware: (firmware: string) =>
        set((state) => ({
          connection: { ...state.connection, firmware },
        })),
      setConnection: (updates: Partial<ModbusConnection>) =>
        set((state) => ({
          connection: { ...state.connection, ...updates },
        })),
      resetConnection: () =>
        set({ connection: defaultConnection }),
    }),
    {
      name: 'modbus-connection-storage',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)