import { useState } from "react";
import { useLanguage } from "@/store/useLanguage";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu"
import { InputGroupButton, } from "@/components/ui/input-group"
import { Cable, EthernetPort } from "lucide-react"
import { TCPConnectionForm } from "@/forms/TCPConnectionForm";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { Separator } from "@/components/ui/separator"
import { ChevronDown } from "lucide-react";
import { SerialConnectionForm } from "@/forms/SerialConnectionForm";

export function Connect() {
  const lang = useLanguage((state) => state.language);
  const [device, setDevice] = useState<string>("");
  const [firmware, setFirmware] = useState<string>("");


  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h2 className="text-2xl font-bold mb-4">Connection</h2>
      <section className="w-fit flex flex-col justify-center gap-4">

        {/* IED e Firmware */}
        <div className="flex  gap-4 justify-center ">
          {/*! IED !*/}
          <DropdownMenu>

            <DropdownMenuTrigger asChild className="w-full">
              <InputGroupButton variant="ghost" className="cursor-pointer bg-card p-4 hover:border-primary">
                {device ? device : (lang === "pt-br" ? "Selecione o IED..." : "Select IED...")}
                <ChevronDown className="ml-2" />
              </InputGroupButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => { setDevice("Documentation") }}>Documentation</DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setDevice("Blog Posts") }}>Blog Posts</DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setDevice("Changelog") }}>Changelog</DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Separator orientation="vertical" />

          {/*! Firmware !*/}
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="w-full bg-card p-4 hover:border-primary">
              <InputGroupButton variant="ghost" className="cursor-pointer">
                {firmware ? firmware : (lang === "pt-br" ? "Selecione o Firmware..." : "Select Firmware...")}
                <ChevronDown className="ml-2" />
              </InputGroupButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => { setFirmware("Documentation") }}>Documentation</DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setFirmware("Blog Posts") }}>Blog Posts</DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setFirmware("Changelog") }}>Changelog</DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Separator className="w-full"></Separator>

        {/* Connections */}
        <Tabs defaultValue="tcp">
          <TabsList className="gap-2 ">
            <TabsTrigger value="tcp">
              <EthernetPort />
              TCP/IP
            </TabsTrigger>
              
            <TabsTrigger value="serial">
             <Cable />
              Serial
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tcp"  className="mt-4 bg-card p-2 w-full rounded-md">
            <TCPConnectionForm />

          </TabsContent>
          <TabsContent value="serial" className="mt-4 bg-card p-2 w-full rounded-md">
            <SerialConnectionForm />
          </TabsContent>
        </Tabs>




      </section>
    </div>
  );
}
