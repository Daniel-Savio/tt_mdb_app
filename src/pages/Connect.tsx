import { useState, useEffect } from "react";
import { useGlobal } from "@/store/useGlobal";
import { listen } from '@tauri-apps/api/event';
import { useLanguage } from "@/store/useLanguage";
import { useMaps } from "@/store/useMaps";
import { useModbusConnection } from "@/store/useModbusConnection";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu"
import { InputGroupButton, } from "@/components/ui/input-group"
import { Cable, EthernetPort, FileWarning } from "lucide-react"
import { TCPConnectionForm } from "@/forms/TCPConnectionForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ChevronDown, Check } from "lucide-react";
import { SerialConnectionForm } from "@/forms/SerialConnectionForm";
import { toast } from "sonner";



export function Connect() {
  const { setConnecting, isConnecting, setConnected, isConnected, setReading, isReading, offlineDevice, setOfflineDevice, offlineFirmware, setOfflineFirmware} = useGlobal();
  const lang = useLanguage((state) => state.language);
  const { connection, setDevice, setFirmware } = useModbusConnection();
  const [availableFirmwares, setAvailableFirmwares] = useState<string[]>([]);
  const iedsJson = useMaps((state: any) => state.ieds);

  function get_maps() {
    if (!iedsJson || !iedsJson.IEDs) return [];
    return iedsJson.IEDs.map((ied: any) => ({
      name: ied.name.toUpperCase().replace(/_/g, " "),
    }));
  }

  const handleDeviceSelect = (iedName: string) => {
    setDevice(iedName);
    setOfflineDevice(iedName);
    setFirmware("");

    const ied = iedsJson.IEDs.find(
      (i: any) => i.name.toUpperCase().replace(/_/g, " ") === iedName
    );

    if (ied) {
      if (!ied.Firmware || ied.Firmware.length === 0) {
        setAvailableFirmwares([]);
        toast.error(
          lang === "pt-br"
            ? "Nenhum firmware disponível para o IED selecionado."
            : "No firmware available for the selected IED."
        );
      } else {
        const firmwares = ied.Firmware.map((fw: any) =>
          fw.name.toUpperCase().replace(/_/g, ".")
        );
        setAvailableFirmwares(firmwares);
      }
    }
  };


  useEffect(() => {
    listen('connection-trying', (e:any) => {
      console.log("Trying connection...", e.payload)
      setConnecting(e.payload);
      toast.loading(lang === "pt-br" ? "Tentando conectar..." : "Trying to connect...", { id: 'connection-status' });
    });

    listen('connection-success', (e: any) => {
      console.log(e.payload)
      toast.success(e.payload, { id: 'connection-status' });
      setConnecting(false);
      setConnected(true);

    });

    listen('connection-error', (e: any) => {
      console.log(e.payload)
      toast.error(e.payload, { id: 'connection-status' });
      setConnecting(false);
      setConnected(false);
      setReading(false);
    });
    
    if (isConnecting) {
      toast.loading(lang === "pt-br" ? "Tentando conectar..." : "Trying to connect...", { id: 'connection-status' });
    } else{
      toast.dismiss('connection-status');
    }

  }, [connection.device, connection.firmware]);

  return (
    <div className="flex flex-col items-center w-fulljustify-center h-full">
      <h2 className="text-2xl font-bold mb-4">{}{lang === "pt-br" ? "Conexão" : "Connection"}</h2>
      <section className="w-fit flex flex-col justify-center gap-4">

        {/* IED e Firmware */}
        <div className="flex  gap-4 justify-center ">
          {/*! IED !*/}
          <DropdownMenu>

            <DropdownMenuTrigger disabled={isConnecting || isReading || isConnected} asChild className="w-48 bg-card p-4 text-lg hover:border-primary">
              <InputGroupButton variant="ghost" className="cursor-pointer">
                {connection.device ? (<p className="text-primary font-bold flex gap-2 items-center"><Check />{connection.device}</p>) : (lang === "pt-br" ? <p>Selecione o IED...</p> : <p>Select IED...</p>)}
                <ChevronDown className="ml-2" />
              </InputGroupButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="">
              <DropdownMenuGroup>
                {iedsJson.IEDs ? get_maps().map((ied: any) => (
                  <DropdownMenuItem key={ied.name} onClick={() => handleDeviceSelect(ied.name)}>{ied.name}</DropdownMenuItem>
                )) : <DropdownMenuItem disabled>{lang === "pt-br" ? "Nenhum IED disponível" : "No IEDs available"}</DropdownMenuItem>}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Separator orientation="vertical" />

          {/*! Firmware !*/}
          <DropdownMenu>
            <DropdownMenuTrigger disabled={isConnecting || isReading || isConnected} asChild className="w-48 bg-card text-lg p-4 hover:border-primary">
              <InputGroupButton variant="ghost" className="cursor-pointer">
                {connection.firmware ? (<p className="text-primary flex gap-2 items-center"><Check />{connection.firmware}</p>) : (lang === "pt-br" ? <p>Firmware...</p> : <p>Firmware...</p>)}
                <ChevronDown className="ml-2" />
              </InputGroupButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="">
              <DropdownMenuGroup>
                {connection.device && availableFirmwares.length > 0 ? availableFirmwares.map((fw: string) => (
                  <DropdownMenuItem key={fw} onClick={() => { setFirmware(fw); setOfflineFirmware(fw); }}>{fw}</DropdownMenuItem>
                )) : <DropdownMenuItem disabled>{lang === "pt-br" ? (connection.device ? "Nenhum firmware" : "Selecione um IED primeiro") : (connection.device ? "No firmware" : "Select an IED first")}</DropdownMenuItem>}

              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Separator className="w-full"></Separator>

        {/* Connections */}
        <Tabs defaultValue="tcp">
          <TabsList className="gap-2">
            <TabsTrigger aria-disabled={isConnecting || isReading || isConnected} className={ `gap-2 ${isConnecting || isReading || isConnected ? "opacity-50 cursor-not-allowed" : ""}`} value="tcp">
              <EthernetPort />
              TCP/IP
            </TabsTrigger>

            <TabsTrigger aria-disabled={isConnecting || isReading || isConnected} className={ `gap-2 ${isConnecting || isReading || isConnected ? "opacity-50 cursor-not-allowed" : ""}`} value="serial">
              <Cable />
              Serial
            </TabsTrigger>


          </TabsList>
          {!connection.device || !connection.firmware ?
            <div className="mt-4 bg-card p-2 w-full rounded-md" >
              <p className="text-muted-foreground">
                <FileWarning className="inline mr-2 mb-1 text-amber-400" />
                {lang === "pt-br" ? "Por favor, selecione um IED e um firmware para habilitar as conexões." : "Please select an IED and a firmware to enable the connections."}
              </p>
            </div> :

            (<>
              <TabsContent value="tcp" className="mt-4 bg-card p-4 w-full rounded-md">
                
                <TCPConnectionForm/>
              </TabsContent>
              <TabsContent value="serial" className="mt-4 bg-card p-4 min-w-150 w-full rounded-md">
                <SerialConnectionForm />
              </TabsContent>
            </>)
          }


        </Tabs>




      </section>
    </div>
  );
}


