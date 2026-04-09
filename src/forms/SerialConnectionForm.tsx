import { useForm, Controller } from "react-hook-form";
import { useModbusConnection } from "@/store/useModbusConnection";
import { invoke } from "@tauri-apps/api/core";
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
import { toast } from "sonner";
import { useGlobal } from "@/store/useGlobal";

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
    const { setConnecting, isConnecting, setConnected, isConnected, setReading, isReading } = useGlobal();
    const lang = useLanguage((state) => state.language);
    const { connection, setConnection } = useModbusConnection();
    const [availablePorts, setAvailablePorts] = useState<string[]>([]);

    function disconnect() {
        setConnected(false);
        invoke("stop_reading").then(() => {
            console.log("Stop reading signal sent to Rust");
            setReading(false);
            toast.info(
                lang === "pt-br"
                    ? "Desconectado com sucesso."
                    : "Disconnected successfully."
            );

        })

    }

    useEffect(() => {
        setConnection({ isTcp: false });
    }, []);

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<SerialFormData>({
        defaultValues: {
            serialPort: connection.serialPort,
            baudrate: connection.baudrate || 9600,
            parity: connection.parity || 'none',
            stopBits: connection.stopBits || 1,
            dataBits: connection.dataBits || 8,
            slaveId: connection.slaveId,
            timeout: connection.timeout,
            retries: connection.retries,
        },
    });

    const onSubmit = (data: SerialFormData) => {
        const fullData = { ...connection, ...data, isTcp: false };
        setConnection(fullData);
        console.log("Updated connection state:", fullData);

        invoke("create_connection", { info: JSON.stringify(fullData) })
            .then((response) => {
                console.log("Connection info sent to Rust:", response);
            })
            .catch((error) => {
                console.error("Error sending connection info to Rust:", error);
            });
    };

    const scanPorts = async () => {
        // Placeholder for Tauri serial port listing
        invoke('get_serial_ports')
            .then((ports: any) => {
                console.log("Available serial ports:", ports);
                setAvailablePorts(ports);
            })
            .catch((error) => {
                toast.error(lang === "pt-br" ? "Erro ao escanear portas seriais." : "Error scanning serial ports.");
                console.error("Error scanning serial ports:", error);
            });
    };

    return (
        <div>
            <h3 className="text-lg font-bold flex justify-between">
                {lang === "pt-br" ? "Conexão Modbus Serial (RTU)" : "Modbus Serial Connection (RTU)"}
                <Cable />
            </h3>
            <Separator className="mb-4 bg-linear-to-r from-primary to-bg" />

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 justify-center">
                <section className="flex flex-wrap gap-4 justify-center">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="serialPort">{lang === "pt-br" ? "Porta Serial" : "Serial Port"}</Label>
                        <InputGroup className="">
                            <Controller
                                disabled={isConnecting || isReading || isConnected}
                                name="serialPort"
                                control={control}
                                rules={{ required: true }}
                                render={({ field }) => (
                                    <Select
                                        disabled={isConnecting || isReading || isConnected}
                                        onValueChange={field.onChange}
                                        value={field.value}
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
                                )}
                            />
                            <InputGroupAddon align={"inline-end"}>
                                <InputGroupButton disabled={isConnecting || isReading || isConnected} type="button" className="text-primary" onClick={scanPorts}>
                                    {lang === "pt-br" ? "Escanear" : "Scan"}
                                </InputGroupButton>
                            </InputGroupAddon>
                        </InputGroup>
                    </div>
                </section>

                <section className="flex flex-wrap gap-4 justify-around">
                    <div className="flex flex-col gap-1.5">
                        <Label>{lang === "pt-br" ? "Baudrate" : "Baudrate"}</Label>
                        <Controller
                            name="baudrate"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    disabled={isConnecting || isReading || isConnected}
                                    onValueChange={(v) => field.onChange(parseInt(v))}
                                    value={field.value?.toString()}
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
                            )}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5 justify-around">
                        <Label>{lang === "pt-br" ? "Data Bits" : "Data Bits"}</Label>
                        <Controller
                            name="dataBits"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    onValueChange={(v) => field.onChange(parseInt(v))}
                                    value={field.value?.toString()}
                                    disabled={isConnecting || isReading || isConnected}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="7">7</SelectItem>
                                        <SelectItem value="8">8</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5 justify-around">
                        <Label>{lang === "pt-br" ? "Paridade" : "Parity"}</Label>
                        <Controller
                            name="parity"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    disabled={isConnecting || isReading || isConnected}
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
                            )}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label>{lang === "pt-br" ? "Stop Bits" : "Stop Bits"}</Label>
                        <Controller
                            name="stopBits"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    onValueChange={(v) => field.onChange(parseInt(v))}
                                    value={field.value?.toString()}
                                    disabled={isConnecting || isReading || isConnected}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">1</SelectItem>
                                        <SelectItem value="2">2</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                </section>

                <section className="flex flex-wrap gap-4 justify-around border-t pt-4 mt-2">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="slaveId">{lang === "pt-br" ? "ID do Escravo" : "Slave ID"}</Label>
                        <Input
                        disabled={isConnecting || isReading || isConnected}
                            id="slaveId"
                            type="number"
                            className="w-20"
                            {...register("slaveId", { required: true, min: 1, max: 247, valueAsNumber: true })}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="timeout">{lang === "pt-br" ? "Timeout (ms)" : "Timeout (ms)"}</Label>
                        
                        <Input
                            disabled={isConnecting || isReading || isConnected}
                            id="timeout"
                            type="number"
                            className="w-24"
                            {...register("timeout", { required: true, min: 100, valueAsNumber: true })}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="retries">{lang === "pt-br" ? "Tentativas" : "Retries"}</Label>
                        <Input
                            disabled={isConnecting || isReading || isConnected}
                            id="retries"
                            type="number"
                            className="w-20"
                            {...register("retries", { required: true, min: 0, valueAsNumber: true })}
                        />
                    </div>
                </section>

                

                {isConnected || isReading ? (
                    <Button onClick={(e) => { e.preventDefault(); disconnect() }} variant={"destructive"}>{lang === "pt-br" ? "Desconectar" : "Disconnect"}</Button>
                ) : (
                    <Button disabled={isConnecting || isReading || isConnected} type="submit">{lang === "pt-br" ? "Conectar" : "Connect"}</Button>
                )}
            </form>
        </div>
    );
}