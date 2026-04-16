use crate::maps::{csv_to_vec, get_map_path, DeviceData};
use serde::{Deserialize, Serialize};
use tauri::Emitter;
use std::net::SocketAddr;
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

    /// Returns only the public registers of the device
    pub async fn read_device_public_only(
        &mut self,  app: tauri::AppHandle
    ) -> Result<Vec<DeviceData>, Box<dyn std::error::Error + Send + Sync>> {
        let map_path = get_map_path(&self.device, &self.firmware)?;
        let map_vec = csv_to_vec(&map_path)?;
        
        let public_mappings: Vec<_> = map_vec.into_iter()
            .filter(|m| m.nivel_de_acesso.as_deref() == Some("Público"))
            .collect();

        let mut results = Vec::with_capacity(public_mappings.len());
        let mut index = 0;

        for mapping in public_mappings {
            let value = if let (Some(tipo), Some(addr)) =
                (mapping.tipo_modbus.as_deref(), mapping.registrador_modbus)
            {
                app.emit("reading_progress", index).unwrap_or(());
                index += 1;
                match tipo {
                    "Holding register" => {
                        match self.client.read_holding_registers(addr, 1).await {
                            Ok(Ok(vec)) => Some(vec[0] as f64),
                            _ => None,
                        }
                    }
                    "Input register" => {
                        match self.client.read_input_registers(addr, 1).await {
                            Ok(Ok(vec)) => Some(vec[0] as f64),
                            _ => None,
                        }
                    }
                    "Coil" => {
                        match self.client.read_coils(addr, 1).await {
                            Ok(Ok(vec)) => Some(if vec[0] { 1.0 } else { 0.0 }),
                            _ => None,
                        }
                    }
                    "Discrete input" => {
                        match self.client.read_discrete_inputs(addr, 1).await {
                            Ok(Ok(vec)) => Some(if vec[0] { 1.0 } else { 0.0 }),
                            _ => None,
                        }
                    }
                    _ => None,
                }
            } else {
                None
            };
            results.push(DeviceData {
                mapping,
                value,
            });
        }

        Ok(results)
    }

    //     pub fn read_device_map(
    //     &mut self,
    // ) -> Result<Vec<CsvMapping>, Box<dyn std::error::Error + Send + Sync>> {
    //     let map_path = get_map_path(&self.device, &self.firmware)?;
    //     let map_vec = csv_to_vec(&map_path)?;
    //     Ok(map_vec)
    // }
}
