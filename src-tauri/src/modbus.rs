use crate::maps::{csv_to_vec, get_map_path, DeviceData};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use tauri::Emitter;
use tokio_modbus::{client::Context, prelude::*};
use tokio_serial::SerialStream;

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ModbusConnection {
    pub host: String,
    pub port: u16,
    pub slave_id: u8,
    pub timeout: u64,
    pub retries: u32,
    pub serial_port: String,
    pub baudrate: u32,
    pub parity: String,
    pub stop_bits: u8,
    pub data_bits: u8,
    pub is_tcp: bool,
}

pub struct ModbusClient {
    pub connection_info: ModbusConnection,
    pub client: Context,
    pub device: String,
    pub firmware: String,
}

impl ModbusClient {
    pub async fn new(
        connection_info: ModbusConnection,
        device: String,
        firmware: String,
    ) -> Result<Self, Box<dyn std::error::Error + Send + Sync>> {
        let client = if connection_info.is_tcp {
            let socket_addr = SocketAddr::new(connection_info.host.parse()?, connection_info.port);
            tcp::connect_slave(socket_addr, Slave(connection_info.slave_id)).await?
        } else {
            println!("{}", connection_info.parity);
            let builder = tokio_serial::new(&connection_info.serial_port, connection_info.baudrate)
                .parity(match connection_info.parity.as_str() {
                    "none" => tokio_serial::Parity::None,
                    "even" => tokio_serial::Parity::Even,
                    "odd" => tokio_serial::Parity::Odd,
                    _ => return Err("Invalid parity".into()),
                })
                .stop_bits(match connection_info.stop_bits {
                    1 => tokio_serial::StopBits::One,
                    2 => tokio_serial::StopBits::Two,
                    _ => return Err("Invalid stop bits".into()),
                })
                .data_bits(match connection_info.data_bits {
                    5 => tokio_serial::DataBits::Five,
                    6 => tokio_serial::DataBits::Six,
                    7 => tokio_serial::DataBits::Seven,
                    8 => tokio_serial::DataBits::Eight,
                    _ => return Err("Invalid data bits".into()),
                });

            let serial_port = match SerialStream::open(&builder) {
                Ok(port) => port,
                Err(e) => {
                    println!("Error opening serial port: {}", e);
                    return Err(Box::new(e));
                }
            };

            rtu::attach_slave(serial_port, Slave(connection_info.slave_id))
        };

        Ok(ModbusClient {
            connection_info: connection_info,
            client: client,
            device: device,
            firmware: firmware,
        })
    }

    pub async fn read_device(
        &mut self,
    ) -> Result<Vec<DeviceData>, Box<dyn std::error::Error + Send + Sync>> {
        let map_path = get_map_path(&self.device, &self.firmware)?;
        let map_vec = csv_to_vec(&map_path)?;
        let mut result = Vec::new();

        for mapping in map_vec {
            let value = if let (Some(tipo), Some(addr)) =
                (mapping.tipo_modbus.as_deref(), mapping.registrador_modbus)
            {
                match tipo {
                    "Holding register" => {
                        let outer_result = self.client.read_holding_registers(addr, 1).await;
                        match outer_result {
                            Ok(inner_result) => match inner_result {
                                Ok(vec) => Some(vec[0] as f64),
                                Err(e) => None,
                            },
                            Err(e) => None,
                        }
                    }
                    "Input register" => {
                        let outer_result = self.client.read_input_registers(addr, 1).await;
                        match outer_result {
                            Ok(inner_result) => match inner_result {
                                Ok(vec) => Some(vec[0] as f64),
                                Err(e) => None,
                            },
                            Err(e) => None,
                        }
                    }
                    "Coil" => {
                        let outer_result = self.client.read_coils(addr, 1).await;
                        match outer_result {
                            Ok(inner_result) => match inner_result {
                                Ok(vec) => Some(if vec[0] { 1.0 } else { 0.0 }),
                                Err(e) => {
                                    println!("{}", e);
                                    None
                                }
                            },
                            Err(e) => {
                                println!("{}", e);
                                None
                            }
                        }
                    }
                    "Discrete input" => {
                        let outer_result = self.client.read_discrete_inputs(addr, 1).await;
                        match outer_result {
                            Ok(inner_result) => match inner_result {
                                Ok(vec) => Some(if vec[0] { 1.0 } else { 0.0 }),
                                Err(e) => {
                                    println!("{}", e);
                                    None
                                }
                            },
                            Err(e) => {
                                println!("{}", e);
                                None
                            }
                        }
                    }
                    _ => {
                        println!("Unrecognized tipo: {}", tipo);
                        None
                    }
                }
            } else {
                None
            };

            result.push(DeviceData {
                mapping: mapping.clone(),
                value,
            });
        }

        Ok(result)
    }

    /// Reads a single Modbus register based on its type and optional treatment (bitmask).
    pub async fn read_single_register(
        &mut self,
        tipo_modbus: &str,
        addr: u16,
        tratamento: Option<&str>,
    ) -> Result<Option<f64>, Box<dyn std::error::Error + Send + Sync>> {
        match tipo_modbus {
            "Holding register" => {
                let is_bitmask = tratamento.map_or(false, |t| t.starts_with("0x"));

                if is_bitmask {
                    let tratamento_str = tratamento.unwrap();
                    let bit_index = Self::get_bit_index(tratamento_str).unwrap();

                    match self.client.read_holding_registers(addr, 1).await {
                        Ok(Ok(vec)) => {
                            let register_value = vec[0] as u16;
                            let bit = (register_value >> bit_index) & 1;
                            Ok(Some(bit as f64)) // Wrap in Ok(Some(...))
                        }
                        Ok(Err(_)) => Ok(None),
                        Err(e) => Err(Box::new(e)),
                    }
                } else {
                    match self.client.read_holding_registers(addr, 1).await {
                        Ok(Ok(vec)) => Ok(Some(vec[0] as f64)),
                        Ok(Err(_)) => Ok(None),
                        Err(e) => Err(Box::new(e)),
                    }
                }
            }
            "Input register" => match self.client.read_input_registers(addr, 1).await {
                Ok(Ok(vec)) => Ok(Some(vec[0] as f64)),
                Ok(Err(_)) => Ok(None),
                Err(e) => Err(Box::new(e)),
            },
            "Coil" => match self.client.read_coils(addr, 1).await {
                Ok(Ok(vec)) => Ok(Some(if vec[0] { 1.0 } else { 0.0 })),
                Ok(Err(_)) => Ok(None),
                Err(e) => Err(Box::new(e)),
            },
            "Discrete input" => match self.client.read_discrete_inputs(addr, 1).await {
                Ok(Ok(vec)) => Ok(Some(if vec[0] { 1.0 } else { 0.0 })),
                Ok(Err(_)) => Ok(None),
                Err(e) => Err(Box::new(e)),
            },
            _ => Ok(None), // Unknown type
        }
    }

    /// Recebe uma string hexadecimal 0x e retorna a posição do bit ativo em 1
    pub fn get_bit_index(hex_str: &str) -> Result<u32, &'static str> {
        // 1. Clean the string and remove the prefix
        let trimmed = hex_str.trim();
        let without_prefix = trimmed
            .strip_prefix("0x")
            .or_else(|| trimmed.strip_prefix("0X"))
            .unwrap_or(trimmed);

        // 2. Parse into a 16-bit unsigned integer (u16)
        let value = match u16::from_str_radix(without_prefix, 16) {
            Ok(v) => v,
            Err(_) => return Err("Failed to parse the hexadecimal string"),
        };

        // 3. Safety check: Ensure exactly one bit is set
        // This prevents errors if someone passes "0x0000" or "0x0003" (which has two bits set)
        if value.count_ones() != 1 {
            return Err("The value must contain exactly one set bit");
        }

        // 4. Return the index using trailing_zeros()
        Ok(value.trailing_zeros())
    }

    /// Returns only the public registers of the device
    pub async fn read_device_public_only(
        &mut self,
        app: tauri::AppHandle,
    ) -> Result<Vec<DeviceData>, Box<dyn std::error::Error + Send + Sync>> {
        let map_path = get_map_path(&self.device, &self.firmware)?;
        let map_vec = csv_to_vec(&map_path)?;

        let public_mappings: Vec<_> = map_vec
            .into_iter()
            .filter(|m| m.nivel_de_acesso.as_deref() == Some("Público"))
            .collect();

        let mut results = Vec::with_capacity(public_mappings.len());
        let mut progress_index = 0;

        for mapping in public_mappings {
            let (tipo, addr) = match (mapping.tipo_modbus.as_deref(), mapping.registrador_modbus) {
                (Some(t), Some(a)) => (t, a),
                _ => {
                    results.push(DeviceData {
                        mapping,
                        value: None,
                    });
                    continue;
                }
            };

            let _ = app.emit("reading_progress", progress_index);
            progress_index += 1;

            // The massive block is now replaced by this single, elegant line:
            let value = self
                .read_single_register(tipo, addr, mapping.tratamento.as_deref())
                .await?;

            results.push(DeviceData { mapping, value });
        }

        Ok(results)
    }
}
