import { ColumnDef } from "@tanstack/react-table"


export type CsvReadings = {
  modo: string
  tratamento: string
  tabela_modbus: string
  tipo_modbus: string
  registrador_modbus: number
  limites: string
  opcional: string
  nivel_de_acesso: string
  descricao: string
  valor: string

}
 
export const getColumns = (lang: string): ColumnDef<CsvReadings>[] => [
  {
    accessorKey: "descricao",
    header: lang === "pt-br" ? "Descrição" : "Description",
  },
  {
    accessorKey: "modo",
    header: lang === "pt-br" ? "Modo" : "Mode",
  },
  {
    accessorKey: "tratamento",
    header: lang === "pt-br" ? "Tratamento" : "Treatment",
  },
  {
    accessorKey: "tabela_modbus",
    header: lang === "pt-br" ? "Tabela Modbus" : "Modbus Table",
  },
  {
    accessorKey: "tipo_modbus",
    header: lang === "pt-br" ? "Tipo Modbus" : "Modbus Type", 
  },
  {
    accessorKey: "registrador_modbus",
    header: lang === "pt-br" ? "Registrador Modbus" : "Modbus Register",
  },
  {
    accessorKey: "limites",
    header: lang === "pt-br" ? "Limites" : "Limits",
  },

  {
    accessorKey: "opcional",
    header: lang === "pt-br" ? "Opcional" : "Optional",
  },
  {
    accessorKey: "nivel_de_acesso",
    header: lang === "pt-br" ? "Nível de acesso" : "Access Level",
  },
  {
    accessorKey: "valor",
    header: lang === "pt-br" ? "Valor" : "Value",
  },

]