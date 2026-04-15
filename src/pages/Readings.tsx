import { Button } from "@/components/ui/button";
import { useQuery } from '@tanstack/react-query'
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useGlobal } from "@/store/useGlobal";
import { useLanguage } from "@/store/useLanguage";
import { Clock, ListRestart, Loader } from "lucide-react";
import {getColumns, CsvReadings} from "@/tables/readings-table/readings-columns";
import { DataTable } from "@/tables/readings-table/readings-table";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface RawJsonReading {
  "UUID": string;
  "Teste automático"?: number;
  "Modo"?: string;
  "Tratamento"?: string;
  "Tabela (Modbus)"?: string;
  "Tipo (Modbus)"?: string;
  "Registrador (Modbus)"?: number;
  "Tipo (DNP3)"?: string;
  "Índice (DNP3)"?: number;
  "Limite inferior"?: string;
  "Limite superior"?: string;
  "Valor default"?: string;
  "Divisor"?: string;
  "Unidade pt"?: string;
  "Unidade en"?: string;
  "Unidade es"?: string;
  "Conversão pt"?: string;
  "Conversão en"?: string;
  "Conversão es"?: string;
  "Opcional"?: string;
  "Condicional"?: string;
  "Nível de acesso"?: string;
  "Descrição pt"?: string;
  "Descrição en"?: string;
  "Descrição es"?: string;
  "Display pt"?: string;
  "Display en"?: string;
  "Display es"?: string;
  "Observações"?: string;
  "Funcionalidade pt"?: string;
  "Funcionalidade en"?: string;
  "Funcionalidade es"?: string;
  "Grupo pt"?: string;
  "Grupo en"?: string;
  "Grupo es"?: string;
  "Classificação"?: string;
  "Gráfico rápido"?: string;
  "Histórico de dados"?: string;
  "IEC 61850"?: string;
  "Link"?: string;
  "CDC"?: string;
  value?: number; // Note: This one did not have a rename attribute in your Rust struct
}

export function Readings() {

  function refreshData() {
    console.log("Refreshing data...");
  }

  function startReading(checked: boolean) {
    console.log("Auto Reading:", checked);
    setReading(checked);
  }
  const { isConnecting, isReading, isConnected, setReading } = useGlobal();
  const lang = useLanguage().language;
  const columns = getColumns(lang);

  const { data, isPending, error } = useQuery({
    queryKey: ['csvData'],
    queryFn: async () => {
      const csvData: string = await invoke("start_reading")
      const raw_data: RawJsonReading[] = JSON.parse(csvData);
      let table_data: CsvReadings[] = [];
     
      raw_data.forEach((row)=>{
        table_data.push({
          modo: row["Modo"]!,
          tratamento: row["Tratamento"]!,
          tabela_modbus: row["Tabela (Modbus)"]!,
          tipo_modbus: row["Tipo (Modbus)"]!,
          registrador_modbus: row["Registrador (Modbus)"]!,
          limites: row["Limite inferior"]! + " - " + row["Limite superior"]!,
          opcional: row["Opcional"]!,
          nivel_de_acesso: row["Nível de acesso"]!,
          descricao: row[`${lang === "pt-br" ? "Descrição pt" : "Descrição en"}`]!,
          valor: (row["value"]!/ parseFloat(row["Divisor"]!)).toFixed(2).toString() + " " + row["Unidade pt"]!
        })
      })
      console.log(table_data)
      return table_data
    }
  })  

  useEffect(() => {
    if( typeof data === "string") {
      toast.warning("Erro")
    }
  }, [data])


  return (
    <section className="flex flex-col items-center justify-center h-full">
      <header className="flex flex-row items-center justify-between w-full mb-1">

        <h1 className="text-lg font-bold">{lang === "pt-br" ? "Leituras" : "Readings"}</h1>

        <div className="flex gap-4  items-end justify-center">
          <Button disabled={!isConnected || isReading} size={"lg"} variant="outline" onClick={() => refreshData()}>
            <ListRestart className="font-bold size-5" />
          </Button>

          <div className="">
            <Label>{lang === "pt-br" ? "Leitura automática" : "Auto Reading"}</Label>
            <span className="flex gap-4 items-center">
              <InputGroup className="gap-2">
                <InputGroupInput className="max-w-20" disabled={!isConnected || isReading} defaultValue={5000} />
                <InputGroupAddon >
                  <Clock />
                </InputGroupAddon>
                <InputGroupAddon align={"inline-end"} >
                  {lang === "pt-br" ? "Taxa - ms" : "Rate -ms"}
                </InputGroupAddon>
              </InputGroup>
              <Switch size="default" className="mx-auto" disabled={!isConnected} onCheckedChange={(checked) => { startReading(checked) }} checked={isReading} />
            </span>
          </div>
        </div>


      </header>

      <Separator orientation="horizontal" />

      {isPending && (
        <Loader className=" mt-10 animate-spin" />

      )}

      {data && (
            <div className="mt-2">

              <DataTable columns={columns} data={data} />
            </div>
       
      )}
     
    </section>
  );
}
