import { Button } from "@/components/ui/button";
import { useQuery } from '@tanstack/react-query'
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useGlobal } from "@/store/useGlobal";
import { useLanguage } from "@/store/useLanguage";
import { Clock, ListRestart } from "lucide-react";
import {columns} from "@/tables/readings-table/readings-columns";
import { DataTable } from "@/tables/readings-table/readings-table";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";


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

  const { data, isPending, error } = useQuery({
    queryKey: ['csvData'],
    queryFn: () => {
      invoke("start_reading").then((data) => {
        console.log(data)
      }).catch(e => {toast.error(e.message)})
    },
  })  


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

      {/* <DataTable columns={columns} data={[]} /> */}
    </section>
  );
}
