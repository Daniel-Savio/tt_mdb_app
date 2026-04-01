import { useForm } from "react-hook-form";
import { invoke } from "@tauri-apps/api/core";
import { useModbusConnection } from "@/store/useModbusConnection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/store/useLanguage";
import { useEffect } from "react";
import { EthernetPort } from "lucide-react";

interface ModbusFormData {
    host: string;
    port: number;
    slaveId: number;
    timeout: number;
    retries: number;
}

export function TCPConnectionForm() {
    const lang = useLanguage((state) => state.language);
    const { connection, setConnection } = useModbusConnection();

    useEffect(() => {
        setConnection({ isTcp: true });
    }, []);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
    } = useForm<ModbusFormData>({
        defaultValues: {
            host: connection.host,
            port: connection.port,
            slaveId: connection.slaveId,
            timeout: connection.timeout,
            retries: connection.retries,
        },
    });



    const handleIPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        // Allow only numbers and dots
        value = value.replace(/[^0-9.]/g, "");
        // Prevent more than 3 dots
        const dots = value.match(/\./g);
        if (dots && dots.length > 3) {
            const parts = value.split(".");
            value = parts.slice(0, 4).join(".");
        }
        // Validate each octet
        const parts = value.split(".");
        const sanitizedParts = parts.map((part) => {
            if (part.length > 3) part = part.slice(0, 3);
            if (parseInt(part) > 255) return "255";
            return part;
        });
        value = sanitizedParts.join(".");
        setValue("host", value, { shouldValidate: true });
    };

    const onSubmit = (data: ModbusFormData) => {
        const fullData = { ...connection, ...data, isTcp: true };
        setConnection(fullData);
        invoke("create_connection", { info: JSON.stringify(fullData) }).then((response) => {
            console.log("Connection info sent to Rust:", response);
        })
        .catch((error) => {
            console.error("Error sending connection info to Rust:", error);
        });
        
    };

    return (
        <div>
            <h3 className="text-lg font-bold flex justify-between">{lang === "pt-br" ? "Conexão Modbus TCP" : "Modbus TCP Connection"}  <EthernetPort /></h3>
             <Separator className="mb-4 bg-linear-to-r from-primary to-bg" />
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 justify-center">
                <section className="flex flex-wrap gap-4 justify-center">
                    <div>
                        <Label htmlFor="host">{lang === "pt-br" ? "Host (IP)" : "Host (IP)"}</Label>
                        <Input
                            className=""
                            id="host"
                            type="text"
                            placeholder="192.168.0.1"
                            {...register("host", {
                                required: lang === "pt-br" ? "IP é obrigatório" : "IP is required",
                                pattern: {
                                    value: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
                                    message: lang === "pt-br" ? "IP inválido" : "Invalid IP address"
                                },
                                onChange: handleIPChange
                            })}
                        />
                        {errors.host && <p className="text-red-500 text-xs mt-1">{errors.host.message}</p>}
                    </div>

                    <div>
                        <Label htmlFor="port">{lang === "pt-br" ? "Porta" : "Port"}</Label>
                        <Input
                            id="port"
                            type="number"
                            {...register("port", {
                                required: lang === "pt-br" ? "Porta é obrigatória" : "Port is required",
                                min: { value: 1, message: lang === "pt-br" ? "Porta deve ser maior que 0" : "Port must be greater than 0" },
                                max: { value: 65535, message: lang === "pt-br" ? "Porta deve ser menor que 65536" : "Port must be less than 65536" },
                                valueAsNumber: true
                            })}
                        />
                        {errors.port && <p className="text-red-500">{errors.port.message}</p>}
                    </div>
                  
                </section>
                <section className="flex flex-wrap gap-4 justify-center">

                    <div>
                        <Label htmlFor="slaveId">{lang === "pt-br" ? "ID do Escravo" : "Slave ID"}</Label>
                        <Input
                            id="slaveId"
                            type="number"
                            {...register("slaveId", {
                                required: lang === "pt-br" ? "ID do escravo é obrigatório" : "Slave ID is required",
                                min: { value: 1, message: lang === "pt-br" ? "ID deve ser maior que 0" : "ID must be greater than 0" },
                                max: { value: 247, message: lang === "pt-br" ? "ID deve ser menor que 248" : "ID must be less than 248" },
                                valueAsNumber: true
                            })}
                        />
                        {errors.slaveId && <p className="text-red-500">{errors.slaveId.message}</p>}
                    </div>

                    <div>
                        <Label htmlFor="timeout">{lang === "pt-br" ? "Timeout (ms)" : "Timeout (ms)"}</Label>
                        <Input
                            id="timeout"
                            type="number"
                            {...register("timeout", {
                                required: lang === "pt-br" ? "Timeout é obrigatório" : "Timeout is required",
                                min: { value: 100, message: lang === "pt-br" ? "Timeout deve ser pelo menos 100ms" : "Timeout must be at least 100ms" },
                                valueAsNumber: true
                            })}
                        />
                        {errors.timeout && <p className="text-red-500">{errors.timeout.message}</p>}
                    </div>

                    <div>
                        <Label htmlFor="retries">{lang === "pt-br" ? "Tentativas" : "Retries"}</Label>
                        <Input
                            id="retries"
                            type="number"
                            {...register("retries", {
                                required: lang === "pt-br" ? "Tentativas é obrigatório" : "Retries is required",
                                min: { value: 0, message: lang === "pt-br" ? "Tentativas deve ser 0 ou mais" : "Retries must be 0 or more" },
                                valueAsNumber: true
                            })}
                        />
                        {errors.retries && <p className="text-red-500">{errors.retries.message}</p>}
                    </div>
                </section>


                <Button type="submit">{lang === "pt-br" ? "Conectar" : "Connect"}</Button>
            </form>
        </div>
    );
}