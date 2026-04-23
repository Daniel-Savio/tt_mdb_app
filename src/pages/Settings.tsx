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
  const [currentValue, setCurrentValue] = useState("");
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
    if (selectedReading) {
      const isSelect = !!selectedReading["Conversão pt"];
      let initial = "";
      if (isSelect) {
        const options = selectedReading["Conversão pt"]?.split("\\") || [];
        // Tenta pegar pelo índice (comum em CSVs de Modbus) ou o valor literal
        const idx = parseInt(selectedReading["Valor default"] || "0");
        initial = options[idx]?.trim() || selectedReading["Valor default"] || "";
      } else {
        initial = selectedReading["Valor default"] || "";
      }
      setCurrentValue(initial);
    }
  }, [selectedReading]);

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

  const isDefault = useMemo(() => {
    if (!selectedReading) return false;
    const isSelect = !!selectedReading["Conversão pt"];
    if (isSelect) {
      const options = selectedReading["Conversão pt"]?.split("\\") || [];
      const idx = parseInt(selectedReading["Valor default"] || "0");
      const defStr = options[idx]?.trim() || selectedReading["Valor default"] || "";
      return currentValue === defStr;
    }
    return currentValue === selectedReading["Valor default"];
  }, [currentValue, selectedReading]);

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
            <div className="space-y-4" key={selectedReading.UUID}>
              <section className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">{lang === "pt-br" ? "Descrição" : "Description"}</label>
                  <p className="text-sm font-medium">{lang === "pt-br" ? selectedReading["Descrição pt"] : selectedReading["Descrição en"]}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{lang === "pt-br" ? "Caminho Display" : "Display Path"}</label>
                  <p className="text-sm italic text-primary">{selectedReading["Display pt"]}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{lang === "pt-br" ? "Valor Padrão" : "Default Value"}</label>
                  {!selectedReading["Conversão pt"] ? (<p className="text-sm italic text-blue-400">{Number(selectedReading["Valor default"]) / Number(selectedReading["Divisor"] || 1) || ""}</p>) : (<p className="text-sm italic text-blue-400">{selectedReading["Valor default"]}</p>)}
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
              <div className="flex flex-col gap-2 justify-center text-center items-center mt-5">
                <h1 className="text-lg bold">{lang === "pt-br" ? "Valor" : "Value"} / {selectedReading ? (
              <span className="text-xs text-muted-foreground">{Number(selectedReading["Limite inferior"])/Number(selectedReading["Divisor"])} - {Number(selectedReading["Limite superior"])/Number(selectedReading["Divisor"])}</span>
            ) : (
              <span className="text-xs text-muted-foreground">{lang === "pt-br" ? "Nenhum ponto selecionado" : "No point selected"}</span>
             )
          }</h1>
                {selectedReading["Conversão pt"]?(
                  <div className="flex flex-col gap-1">
                    <Select onValueChange={(val)=> setCurrentValue(val)} value={currentValue}>
                      <SelectTrigger className={` w-60 flex gap-4 text-sm cursor-pointer transition-colors ${isDefault ? "border-blue-400 text-blue-400" : ""}`}>
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
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <InputGroup>
                      <InputGroupInput 
                        defaultValue={Number(currentValue) / Number(selectedReading["Divisor"]) || ""}
                        value={currentValue} 
                        onChange={(e) => setCurrentValue(e.target.value)}
                        className={` w-60 m-auto transition-colors ${isDefault ? "border-blue-400 text-blue-400 focus-visible:ring-blue-400" : ""}`}
                      />
                      <InputGroupAddon align={"inline-end"} className="text-xs text-muted-foreground">
                        {selectedReading["Unidade pt"] ? selectedReading["Unidade pt"] : lang === "pt-br" ? "sem unidade" : "no unit"}
                      </InputGroupAddon>
                    </InputGroup>
                  </div>
                )}
                
                {isDefault && (
                  <span className="text-sm font-medium text-blue-400 animate-in fade-in slide-in-from-top-1">
                    {lang === "pt-br" ? "* Valor igual ao padrão de fábrica" : "* Value matches factory default"}
                  </span>
                )}
              </div>

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
