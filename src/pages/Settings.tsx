import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupInput, InputGroupAddon } from "@/components/ui/input-group";
import { Sheet, Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useModbusConnection } from "@/store/useModbusConnection";
import { useLanguage } from "@/store/useLanguage";
import { useQuery } from '@tanstack/react-query'
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { useGlobal } from "@/store/useGlobal";
import { RawJsonReading } from "./Readings";
import { CascadeView } from "@/components/CascadeView";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function Settings() {
  const lang = useLanguage().language;
  const { isReading, isConnected, setConnected, setReading, readingRate, setReadingRate, offlineDevice, offlineFirmware, setOfflineDevice, setOfflineFirmware } = useGlobal();
  const [selectedReading, setSelectedReading] = useState<RawJsonReading | null>(null);
  const { connection } = useModbusConnection()

  const { data, isLoading } = useQuery({
    queryKey: ['parameters_data'],
    queryFn: async () => {
      //Sem comunicação
      if (!isConnected) {
        connection.device ? setOfflineDevice(connection.device) : setOfflineDevice("")
        connection.firmware ? setOfflineFirmware(connection.firmware) : setOfflineFirmware("")
        let raw_data: string = await invoke("public_parameters", { device: offlineDevice, firmware: offlineFirmware })
        let jsonData = JSON.parse(raw_data) as RawJsonReading[];
        return jsonData
      }
      //Com comunicação
      else {
        let raw_data: string = await invoke("public_parameters", { device: connection.device, firmware: connection.firmware })
        let jsonData = JSON.parse(raw_data) as RawJsonReading[];
        return jsonData
      }
    }
  })

  useEffect(() => {
    const unlistenStop = listen('reading-stop', () => {
      setReading(false);
      setConnected(false);
      toast.error(lang === "pt-br" ? "Comunicação perdida" : "Communication lost");
    });

    return () => {
      unlistenStop.then((f) => f());
    };
  }, [data])

  return (
    <section className="flex flex-col w-full h-full p-4">
      <header className="flex flex-row items-center justify-between w-full mb-4">
        {isConnected ? (
          <h1 className="text-xl font-bold">{lang === "pt-br" ? "Parâmetros:" : "Settings:"} {connection.device} - {connection.firmware}</h1>
        ) : (
          <h1 className="text-xl font-bold">{lang === "pt-br" ? "Parâmetros:" : "Settings:"} {offlineDevice} - {connection.firmware}</h1>
        )}
        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${isConnected ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
          {isConnected ? "on-line" : "off-line"}
        </span>
      </header>

      <div className="flex flex-row gap-6 h-[calc(100%-60px)]">
        <div className="flex-1 flex flex-col min-w-0">
          <h2 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">
            {lang === "pt-br" ? "Estrutura de Parâmetros" : "Settings Structure"}
          </h2>
          {isLoading ? (
            <div className="flex items-center justify-center flex-1 border rounded-md">
              <span className="flex items-center gap-2">
                {lang === "pt-br" ? "carregando..." : "loading..."} <Sheet className="animate-spin" />
              </span>
            </div>
          ) : (
            <CascadeView
              data={data || []}
              onSelect={(item) => setSelectedReading(item)}
            />
          )}
        </div>

        <div className="w-2/3 flex flex-col border rounded-md bg-card p-4 overflow-auto">
          <h2 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Info className="h-4 w-4" />
            {lang === "pt-br" ? "Detalhes do Ponto" : "Point Details"}
          </h2>

          {selectedReading ? (
            <div className="space-y-4">
              <section className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">{lang === "pt-br" ? "Descrição" : "Description"}</label>
                  <p className="text-sm font-medium">{lang === "pt-br" ? selectedReading["Descrição pt"] : selectedReading["Descrição en"]}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{lang === "pt-br" ? "Caminho Display" : "Display Path"}</label>
                  <p className="text-sm italic text-primary">{selectedReading["Display pt"]}</p>
                </div>
              </section>
              <Separator />
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">{lang === "pt-br" ? "Registrador" : "Register"}</label>
                  <p className="text-sm font-mono">{selectedReading["Registrador (Modbus)"]}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{lang === "pt-br" ? "Tratamento/Bit" : "Treatment/Bit"}</label>
                  <p className="text-sm font-mono">{selectedReading["Tratamento"]}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Type</label>
                  <p className="text-sm font-mono">{selectedReading["Tipo (Modbus)"]}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{lang === "pt-br" ? "Opcional do Equipamento" : "Optional of the Equipment"}</label>
                  <p className="text-sm font-mono">{selectedReading["Opcional"] ? selectedReading["Opcional"] : "Default"}</p>
                </div>
              </div>
              <Separator />
              {selectedReading["Conversão pt"]?(
                <>
                  <Select onValueChange={()=> {}} defaultValue={selectedReading["Conversão pt"]?.split("\\")[selectedReading["Valor default"]?.split("\\").indexOf(selectedReading["Valor default"]) || 0] || ""}>
                    <SelectTrigger className="w-fit flex gap-4 text-sm cursor-pointer">
                      <SelectValue className="text-sm"></SelectValue>
                    </SelectTrigger>
                    <SelectContent className="text-xs w-fit">
                      <SelectGroup>
                        {selectedReading["Conversão pt"]?.split("\\").map((option) => (
                          <SelectItem key={option} value={option.trim()}>{option.trim()}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </>
              ) : (
                <>
                 <Input defaultValue={selectedReading["Valor default"] || ""}></Input>
                </>
              )}

            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground text-center">
              {lang === "pt-br" ? "Selecione um ponto na árvore para ver os detalhes" : "Select a point in the tree to view details"}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
