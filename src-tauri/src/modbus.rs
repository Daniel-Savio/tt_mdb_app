use serde::{Deserialize, Serialize};
use tokio_modbus::{client::Context, prelude::*};
use std::net::SocketAddr;
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
    pub async fn new(connection_info: ModbusConnection) -> Result<Self, Box<dyn std::error::Error>> {
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


            let serial_port = match SerialStream::open(&builder){
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
            device: String::new(),
            firmware: String::new(),
        })
    }

}