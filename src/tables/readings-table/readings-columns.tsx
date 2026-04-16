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
    accessorKey: "registrador_modbus",
    header: lang === "pt-br" ? "Registrador" : "Modbus",
  },
  {
    accessorKey: "tratamento",
    header: lang === "pt-br" ? "Tratamento" : "Treatment",
  },
  {
    accessorKey: "tabela_modbus",
    header: lang === "pt-br" ? "Tabela" : "Table",
  },
  {
    accessorKey: "tipo_modbus",
    header: lang === "pt-br" ? "Tipo" : "Type", 
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
    header: lang === "pt-br" ? "Acesso" : "Access",
  },
  {
    accessorKey: "valor",
    header: lang === "pt-br" ? "Valor" : "Value",
    cell: ({ cell, row }) => {
      return <div><strong>{row.original.valor}</strong></div>
    }
  },

]