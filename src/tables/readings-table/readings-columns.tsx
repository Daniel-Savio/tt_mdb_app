import { ColumnDef } from "@tanstack/react-table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { useLanguage } from "@/store/useLanguage"

export type CsvReadings = {
  status: boolean
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
    accessorKey: "status",
    header: lang === "pt-br" ? "St" : "St",
    cell: ({ row }) => {
      return (

        <Tooltip>
          <TooltipTrigger>
            <div className={`${row.original.status ? "bg-green-500" : "bg-red-500"} w-3 h-3 rounded-full`} />
          </TooltipTrigger>
          <TooltipContent>
            { useLanguage().language === "pt-br" ? <p>Indica se o valor lido está dentro dos limites para cada ponto de leitura</p> : <p>Indicates if the value read is within the limits for each reading point</p>}
          </TooltipContent>
        </Tooltip>

      )
    }
  },
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
    cell: ({ row }) => {
      return <div><strong>{row.original.valor}</strong></div>
    }
  },

]