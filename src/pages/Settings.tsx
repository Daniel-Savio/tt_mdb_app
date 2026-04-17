import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupInput, InputGroupAddon } from "@/components/ui/input-group";
import { Sheet } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useModbusConnection } from "@/store/useModbusConnection";
import { useLanguage } from "@/store/useLanguage";
import { useQuery } from '@tanstack/react-query'
import { useState, useEffect, useMemo, use } from "react";
import { toast } from "sonner";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { useGlobal } from "@/store/useGlobal";
import { RawJsonReading } from "./Readings";

export function Settings() {
  const lang = useLanguage().language;
  const { isReading, isConnected, setConnected, setReading, readingRate, setReadingRate, offlineDevice, offlineFirmware, setOfflineDevice, setOfflineFirmware } = useGlobal();
  const [timestamp, setTimestamp] = useState<Date | null>()
  const [progress, setProgress] = useState(0);
  const [isWriting, setIsWriting] = useState(false);
  const { connection } = useModbusConnection()

  const { data, isLoading, error } = useQuery({
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
  }, [])



  console.log(data)

  return (
    <section className="flex flex-col items-center justify-center h-full">
      <header className="flex flex-row items-center justify-between w-full mb-1">
        {isConnected ? (<h1 className="text-lg font-bold">{lang === "pt-br" ? "Parâmetros:" : "Settings:"} {connection.device} - {connection.firmware}</h1>) : (<h1 className="text-lg font-bold">{lang === "pt-br" ? "Parâmetros:" : "Settings:"} {offlineDevice} - {connection.firmware}</h1>)}
        <span className={`text-sm ${isConnected ? "text-green-400" : "text-red-400"}`}>{isConnected ? "on-line" : "off-line"}</span>
      </header>

      {isLoading && (<span className="flex items-center justify-center">loading... <Sheet /></span>)}

    </section>
  );
}
