import { useForm } from "react-hook-form";
import { useModbusConnection } from "@/store/useModbusConnection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { InputGroup, InputGroupAddon, InputGroupButton } from "@/components/ui/input-group";
import { useLanguage } from "@/store/useLanguage";
import { useEffect, useState } from "react";
import { Cable } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface SerialFormData {
    serialPort: string;
    baudrate: number;
    parity: 'none' | 'even' | 'odd';
    stopBits: number;
    dataBits: number;
    slaveId: number;
    timeout: number;
    retries: number;
}

export function SerialConnectionForm() {
    const lang = useLanguage((state) => state.language);
    const { connection, setConnection } = useModbusConnection();
    const [availablePorts, setAvailablePorts] = useState<string[]>([]);

    useEffect(() => {
        setConnection({ isTcp: false });
    }, []);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
    } = useForm<SerialFormData>({
        defaultValues: {
            serialPort: connection.serialPort,
            baudrate: connection.baudrate,
            parity: connection.parity,
            stopBits: connection.stopBits,
            dataBits: connection.dataBits,
            slaveId: connection.slaveId,
            timeout: connection.timeout,
            retries: connection.retries,
        },
    });

    const onSubmit = (data: SerialFormData) => {
        setConnection({ ...data, isTcp: false });
    };

    const scanPorts = async () => {
        // Placeholder for Tauri serial port listing
        // In a real app, you'd call a Tauri command here
        setAvailablePorts(["COM1", "COM2", "/dev/ttyUSB0"]);
    };

    return (
        <div>
            <h3 className="text-lg font-bold  flex justify-between">
                {lang === "pt-br" ? "Conexão Modbus Serial (RTU)" : "Modbus Serial Connection (RTU)"}
                <Cable/>
            </h3>
            <Separator className="mb-4 bg-linear-to-r from-primary to-bg" />

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 justify-center">
                <section className="flex flex-wrap gap-4 justify-center">
                    <div className="flex flex-col gap-1.5 ">
                        <Label htmlFor="serialPort">{lang === "pt-br" ? "Porta Serial" : "Serial Port"}</Label>

                        <InputGroup className="">
                            <Select
                                defaultValue={connection.serialPort}
                                onValueChange={(v) => setValue("serialPort", v)}
                                
                            >
                                <SelectTrigger className="w-50 rounded-none bg-card border-none">
                                    <SelectValue placeholder="Serial Port" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availablePorts.map((port) => (
                                        <SelectItem key={port} value={port}>
                                            {port}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputGroupAddon align={"inline-end"}>

                                <InputGroupButton type="button"  className="text-primary"  onClick={scanPorts}>
                                    {lang === "pt-br" ? "Escanear" : "Scan"}
                                </InputGroupButton>
                            </InputGroupAddon>

                        </InputGroup>

                    </div>


                </section>

                <section className="flex flex-wrap gap-4 justify-around">
                    <div className="flex flex-col gap-1.5 ">
                        <Label>{lang === "pt-br" ? "Baudrate" : "Baudrate"}</Label>
                        <Select
                            defaultValue={"9600"}
                            onValueChange={(v) => setValue("baudrate", parseInt(v))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Baudrate" />
                            </SelectTrigger>
                            <SelectContent>
                                {[9600, 14400, 19200, 38400, 57600, 115200].map((b) => (
                                    <SelectItem key={b} value={b.toString()}>{b}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-1.5 justify-around">
                        <Label>{lang === "pt-br" ? "Data Bits" : "Data Bits"}</Label>
                        <Select
                            defaultValue={"8"}
                            onValueChange={(v) => setValue("dataBits", parseInt(v))}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7">7</SelectItem>
                                <SelectItem value="8">8</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col gap-1.5 justify-around">
                        <Label>{lang === "pt-br" ? "Paridade" : "Parity"}</Label>
                        <Select
                            defaultValue={"none"}
                            onValueChange={(v) => setValue("parity", v as any)}
                        >
                            <SelectTrigger className="">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                <SelectItem value="even">Even</SelectItem>
                                <SelectItem value="odd">Odd</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>



                    <div className="flex flex-col gap-1.5 ">
                        <Label>{lang === "pt-br" ? "Stop Bits" : "Stop Bits"}</Label>
                        <Select
                            defaultValue={"1"}
                            onValueChange={(v) => setValue("stopBits", parseInt(v))}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">1</SelectItem>
                                <SelectItem value="2">2</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </section>

                <section className="flex flex-wrap gap-4 justify-around border-t pt-4 mt-2">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="slaveId">{lang === "pt-br" ? "ID do Escravo" : "Slave ID"}</Label>
                        <Input
                            id="slaveId"
                            type="number"
                            className="w-20"
                            {...register("slaveId", { required: true, min: 1, max: 247 })}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="timeout">{lang === "pt-br" ? "Timeout (ms)" : "Timeout (ms)"}</Label>
                        <Input
                            id="timeout"
                            type="number"
                            className="w-24"
                            {...register("timeout", { required: true, min: 100 })}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="retries">{lang === "pt-br" ? "Tentativas" : "Retries"}</Label>
                        <Input
                            id="retries"
                            type="number"
                            className="w-20"
                            {...register("retries", { required: true, min: 0 })}
                        />
                    </div>
                </section>

                <Button type="submit" className="mt-4">
                    {lang === "pt-br" ? "Conectar" : "Connect"}
                </Button>
            </form>
        </div>
    );
}