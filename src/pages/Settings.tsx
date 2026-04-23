import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupInput, InputGroupAddon } from "@/components/ui/input-group";
import { Sheet, Info, ListChecks, Download, Send } from "lucide-react";
import { useModbusConnection } from "@/store/useModbusConnection";
import { useLanguage } from "@/store/useLanguage";
import { useQuery } from '@tanstack/react-query'
import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { useGlobal } from "@/store/useGlobal";
import { RawJsonReading } from "./Readings";
import { CascadeView } from "@/components/CascadeView";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChangesDrawer } from "@/components/ChangesDrawer";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";

interface ModifiedPoint {
  original: RawJsonReading;
  newValue: string;
  status: 'pending' | 'success' | 'error';
  error?: string;
}

export function Settings() {
  const lang = useLanguage().language;
  const { isConnected, setConnected, setReading, offlineDevice, setOfflineDevice, setOfflineFirmware, offlineFirmware } = useGlobal();
  const [selectedReading, setSelectedReading] = useState<RawJsonReading | null>(null);
  const [currentValue, setCurrentValue] = useState("");
  const [modifiedPoints, setModifiedPoints] = useState<Record<string, ModifiedPoint>>({});
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
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

  const [isReadingValue, setIsReadingValue] = useState(false);

  useEffect(() => {
    const initializeValue = async () => {
      if (!selectedReading) return;

      // Se já houver uma modificação pendente para este ponto, usa o valor modificado
      if (modifiedPoints[selectedReading.UUID]) {
        setCurrentValue(modifiedPoints[selectedReading.UUID].newValue);
        return;
      }

      const divisor = parseFloat(selectedReading["Divisor"] || "1") || 1;
      const isSelect = !!selectedReading["Conversão pt"];

      // Se estiver conectado, tenta ler o valor real do dispositivo
      if (isConnected) {
        setIsReadingValue(true);
        try {
          const val = await invoke<number | null>("read_parameter", {
            tipoModbus: selectedReading["Tipo (Modbus)"],
            addr: selectedReading["Registrador (Modbus)"],
            tratamento: selectedReading["Tratamento"]
          });

          if (val !== null) {
            let actualValue = "";
            if (isSelect) {
              const options = selectedReading["Conversão pt"]?.split("\\") || [];
              const idx = Math.round(val);
              actualValue = options[idx]?.trim() || val.toString();
            } else {
              actualValue = (val / divisor).toString();
            }
            setCurrentValue(actualValue);
            setIsReadingValue(false);
            return;
          }
        } catch (err) {
          console.error("Failed to read parameter:", err);
        }
        setIsReadingValue(false);
      }

      // Fallback para valor default (se offline ou falha na leitura)
      let initial = "";
      if (isSelect) {
        const options = selectedReading["Conversão pt"]?.split("\\") || [];
        const idx = parseInt(selectedReading["Valor default"] || "0");
        initial = options[idx]?.trim() || selectedReading["Valor default"] || "";
      } else {
        const rawValue = parseFloat(selectedReading["Valor default"] || "0");
        initial = (rawValue / divisor).toString();
      }
      setCurrentValue(initial);
    };

    initializeValue();
  }, [selectedReading, isConnected]); // Removido modifiedPoints da dependência para evitar reset indesejado durante edição

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
    const divisor = parseFloat(selectedReading["Divisor"] || "1") || 1;
    const isSelect = !!selectedReading["Conversão pt"];
    
    if (isSelect) {
      const options = selectedReading["Conversão pt"]?.split("\\") || [];
      const idx = parseInt(selectedReading["Valor default"] || "0");
      const defStr = options[idx]?.trim() || selectedReading["Valor default"] || "";
      return currentValue === defStr;
    }
    
    const currentNum = parseFloat(currentValue || "0");
    const rawDefault = parseFloat(selectedReading["Valor default"] || "0");
    const dividedDefault = rawDefault / divisor;
    
    return currentNum === dividedDefault;
  }, [currentValue, selectedReading]);

  // Função centralizada para salvar automaticamente
  const autoSaveToDrawer = useCallback((value: string) => {
    if (!selectedReading) return;
    
    setModifiedPoints(prev => ({
      ...prev,
      [selectedReading.UUID]: {
        original: selectedReading,
        newValue: value,
        status: 'pending'
      }
    }));
  }, [selectedReading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(",", ".");
    
    if (val !== "" && val !== "-" && !/^-?\d*\.?\d*$/.test(val)) return;

    if (val !== "" && val !== "-") {
      const num = parseFloat(val);
      const divisor = Number(selectedReading?.["Divisor"] || 1);
      const max = Number(selectedReading?.["Limite superior"] || 0) / divisor;

      if (num > max) {
        val = max.toString();
      }
    }
    setCurrentValue(val);
    autoSaveToDrawer(val);
  };

  const handleSelectChange = (val: string) => {
    setCurrentValue(val);
    autoSaveToDrawer(val);
  };

  const removeFromDrawer = (uuid: string) => {
    setModifiedPoints(prev => {
      const newPoints = { ...prev };
      delete newPoints[uuid];
      return newPoints;
    });
  };

  const exportAllToJson = async () => {
    if (!data) return;

    const mergedData = data.map(point => {
      if (modifiedPoints[point.UUID]) {
        return {
          ...point,
          "Valor default": modifiedPoints[point.UUID].newValue
        };
      }
      return point;
    });

    try {
      const filePath = await save({
        filters: [{ name: 'JSON', extensions: ['json'] }],
        defaultPath: `parameters_${connection.device || offlineDevice}.json`
      });

      if (filePath) {
        await writeTextFile(filePath, JSON.stringify(mergedData, null, 2));
        toast.success(lang === "pt-br" ? "Arquivo exportado com sucesso" : "File exported successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error(lang === "pt-br" ? "Erro ao exportar arquivo" : "Error exporting file");
    }
  };

  const applyChanges = async () => {
    setIsApplying(true);
    const points = Object.values(modifiedPoints);
    
    for (const point of points) {
      if (point.status === 'success') continue;

      try {
        const divisor = Number(point.original["Divisor"] || 1);
        let finalValue: number;

        if (point.original["Conversão pt"]) {
            const options = point.original["Conversão pt"].split("\\").map(o => o.trim());
            const idx = options.indexOf(point.newValue.trim());
            finalValue = idx !== -1 ? idx : parseFloat(point.newValue);
        } else {
            finalValue = parseFloat(point.newValue) * divisor;
        }

        await invoke("write_parameter", {
          tipoModbus: point.original["Tipo (Modbus)"],
          addr: point.original["Registrador (Modbus)"],
          value: finalValue,
          tratamento: point.original["Tratamento"]
        });

        setModifiedPoints(prev => ({
          ...prev,
          [point.original.UUID]: { ...point, status: 'success' }
        }));
      } catch (err) {
        setModifiedPoints(prev => ({
          ...prev,
          [point.original.UUID]: { ...point, status: 'error', error: String(err) }
        }));
      }
    }
    setIsApplying(false);
  };

  const hasChanges = Object.keys(modifiedPoints).length > 0;

  return (
    <section className="flex flex-col w-full h-full p-4 relative overflow-hidden">
      <header className="flex flex-row items-center justify-between w-full mb-4">
        <div className="flex items-center gap-4">
            {isConnected ? (
            <h1 className="text-xl font-bold">{lang === "pt-br" ? "Parâmetros:" : "Settings:"} {connection.device} - {connection.firmware}</h1>
            ) : (
            <h1 className="text-xl font-bold">{lang === "pt-br" ? "Parâmetros:" : "Settings:"} {offlineDevice} - {connection.firmware}</h1>
            )}
            
            <div className="flex items-center gap-2 border-l pl-4 ml-2">
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 relative"
                    onClick={() => setIsDrawerOpen(true)}
                >
                    <ListChecks className="h-4 w-4" />
                    {lang === "pt-br" ? "Alterações" : "Changes"}
                    {hasChanges && (
                        <span className="absolute -top-2 -right-2 bg-primary text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-background font-bold">
                            {Object.keys(modifiedPoints).length}
                        </span>
                    )}
                </Button>

                <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={exportAllToJson}
                    disabled={!data}
                >
                    <Download className="h-4 w-4" />
                    {lang === "pt-br" ? "Exportar" : "Export"}
                </Button>

                <Button 
                    variant="default" 
                    size="sm" 
                    className="gap-2 shadow-md"
                    onClick={applyChanges}
                    disabled={!hasChanges || isApplying}
                >
                    <Send className={`h-4 w-4 ${isApplying ? "animate-pulse" : ""}`} />
                    {isApplying ? (lang === "pt-br" ? "Aplicando..." : "Applying...") : (lang === "pt-br" ? "Aplicar" : "Apply")}
                </Button>
            </div>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${isConnected ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
          {isConnected ? "on-line" : "off-line"}
        </span>
      </header>

      <div className="flex flex-row gap-6 h-[calc(100%-60px)]">
        <div className="flex-1 flex flex-col min-w-0">
          <h2 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">
            {lang === "pt-br" ? "Estrutura de Pastas" : "Folder Structure"}
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
              <div className="flex flex-col gap-4 justify-center text-center items-center mt-5">
                <h1 className="text-lg font-bold">
                    {lang === "pt-br" ? "Valor" : "Value"} / {selectedReading["Limite inferior"] ? (
                        <span className="text-xs text-muted-foreground">
                            {Number(selectedReading["Limite inferior"])/Number(selectedReading["Divisor"] || 1)} - {Number(selectedReading["Limite superior"])/Number(selectedReading["Divisor"] || 1)}
                        </span>
                    ) : (
                        <span className="text-xs text-muted-foreground">{lang === "pt-br" ? "Nenhum limite" : "No limits"}</span>
                    )}
                </h1>

                {isReadingValue ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
                    <Sheet className="h-4 w-4 animate-spin" />
                    {lang === "pt-br" ? "Lendo registrador..." : "Reading register..."}
                  </div>
                ) : (
                  <>
                    {selectedReading["Conversão pt"]?(
                      <div className="flex flex-col gap-1">
                        <Select onValueChange={handleSelectChange} value={currentValue}>
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
                      <div className="flex flex-col gap-1 w-60">
                        <InputGroup>
                          <InputGroupInput 
                            value={currentValue} 
                            onChange={handleInputChange}
                            className={`transition-colors ${isDefault ? "border-blue-400 text-blue-400 focus-visible:ring-blue-400" : ""}`}
                          />
                          <InputGroupAddon align={"inline-end"} className="text-xs text-muted-foreground">
                            {selectedReading["Unidade pt"] ? selectedReading["Unidade pt"] : lang === "pt-br" ? "sem unidade" : "no unit"}
                          </InputGroupAddon>
                        </InputGroup>
                      </div>
                    )}
                  </>
                )}
                
                {isDefault && (
                  <span className="text-sm font-medium text-blue-400 animate-in fade-in slide-in-from-top-1">
                    {lang === "pt-br" ? "* Valor igual ao padrão de fábrica" : "* Value matches factory default"}
                  </span>
                )}

                {modifiedPoints[selectedReading.UUID] && (
                  <div className="text-[10px] text-blue-500 font-bold uppercase tracking-widest mt-2">
                    {lang === "pt-br" ? "Alteração Pendente" : "Pending Change"}
                  </div>
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

      <ChangesDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        modifiedPoints={modifiedPoints}
        onRemove={removeFromDrawer}
        onExport={exportAllToJson}
        onApply={applyChanges}
        isApplying={isApplying}
      />
    </section>
  );
}
