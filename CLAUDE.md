# tt_mdb_app

Aplicação desktop (Tauri) com backend em **Rust** e frontend em **React + TypeScript**.

## Propósito

Comunicar com equipamentos via **Modbus**, com base no mapa de protocolos (CSV) de cada
equipamento, permitindo parametrizar esses IEDs (Intelligent Electronic Devices):

- **Diretamente**, comunicando com o equipamento em tempo real.
- **Off-line**, gerando um arquivo JSON de parametrização para aplicar posteriormente.

## Stack

- Backend: Rust (`src-tauri/`)
- Frontend: React 19 + TypeScript, Vite, TailwindCSS, shadcn/radix-ui, TanStack Query/Table, Zustand
