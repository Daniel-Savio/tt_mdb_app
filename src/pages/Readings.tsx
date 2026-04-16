import { Button } from "@/components/ui/button";
import { useQuery } from '@tanstack/react-query'
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useGlobal } from "@/store/useGlobal";
import { useLanguage } from "@/store/useLanguage";
import { Clock, Database, ListRestart, Loader } from "lucide-react";
import {getColumns, CsvReadings} from "@/tables/readings-table/readings-columns";
import { DataTable } from "@/tables/readings-table/readings-table";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { useEffect, useState, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { set } from "react-hook-form";
import { listen } from "@tauri-apps/api/event";

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

  function startReading(checked: boolean) {
    console.log("Auto Reading:", checked);
    setReading(checked);
  }
  const { isConnecting, isReading, isConnected, setReading, readingRate, setReadingRate } = useGlobal();
  const lang = useLanguage().language;
  const columns = getColumns(lang);
  const [table_data, set_table_data] = useState<CsvReadings[]>()
  const [progress, setProgress] = useState(0);

  const { data, isPending, error, refetch, isFetching } = useQuery({
    queryKey: ['csvData'],
    queryFn: async () => {
      const csvData: string = await invoke("start_reading")
      return JSON.parse(csvData) as RawJsonReading[];
    },
    staleTime: Infinity,
    refetchInterval: isReading ? readingRate : false,
  }) 

  const tableData = useMemo(() => {
    if (!data) return [];
    
    return data.map((row) => {
      const divisor = parseFloat(row["Divisor"] || "1") || 1;
      const value = ((row["value"] || 0) / divisor).toFixed(2).toString();
      const measurement_unity = row["Unidade pt"] || "";

      return {
        modo: row["Modo"] || "",
        tratamento: row["Tratamento"] || "",
        tabela_modbus: row["Tabela (Modbus)"] || "",
        tipo_modbus: row["Tipo (Modbus)"] || "",
        registrador_modbus: row["Registrador (Modbus)"] || 0,
        limites: (row["Limite inferior"] || "") + " - " + (row["Limite superior"] || ""),
        opcional: row["Opcional"] || "",
        nivel_de_acesso: row["Nível de acesso"] || "",
        descricao: lang === "pt-br" ? row["Descrição pt"] || "" : row["Descrição en"] || "",
        valor: value + " " + measurement_unity
      };
    });
  }, [data, lang]);

  useEffect(() => {
    // Escuta o evento "progress" vindo do Rust
    const unlistenProgress = listen('reading_progress', (event) => {
      setProgress(event.payload as number);
    });

    // Escuta o evento para parar leitura (ex: perda de comunicação)
    const unlistenStop = listen('reading-stop', () => {
      setReading(false);
      toast.error(lang === "pt-br" ? "Comunicação perdida" : "Communication lost");
    });

    // Limpa os listeners ao desmontar
    return () => {
      unlistenProgress.then((f) => f());
      unlistenStop.then((f) => f());
    };
  }, [lang, setReading]);
  
  return (
    <section className="flex flex-col items-center justify-center h-full">
      <header className="flex flex-row items-center justify-between w-full mb-1">

        <h1 className="text-lg font-bold">{lang === "pt-br" ? "Leituras" : "Readings"}</h1>

        <div className="flex gap-4  items-end justify-center">
          <Button disabled={!isConnected || isReading || isFetching} size={"lg"} variant="outline" onClick={() => {refetch()}}>
            <ListRestart className="font-bold size-5" />
          </Button>

          <div className="">
            <Label>{lang === "pt-br" ? "Leitura automática" : "Auto Reading"}</Label>
            <span className="flex gap-4 items-center">
              <InputGroup className="gap-2">
                <InputGroupInput 
                  className="max-w-20" 
                  disabled={!isConnected || isReading} 
                  value={readingRate} 
                  onChange={(e) => setReadingRate(parseInt(e.target.value) || 0)}
                />
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

      {(isPending || isFetching) && (
        <div className="flex gap-4 items-center justify-center mt-10">
          <Database/>
          <span className="flex gap-2 text-center items-center justify-center">{lang == "pt-br" ? "Lendo dados" : "Reading data"} {progress}</span>
          <Loader className="animate-spin" />
        </div>
      )}

      {data && isConnected && (
            <div className={`mt-2`}>
              <DataTable columns={columns} data={tableData} />
            </div>
       
      ) 
    }
     
    </section>
  );
}
