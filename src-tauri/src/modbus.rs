use crate::maps::{csv_to_vec, get_map_path, CsvMapping};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use tokio_modbus::{client::Context, prelude::*};
use tokio_serial::SerialStream;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DeviceData {
    #[serde(rename = "UUID")]
    pub uuid: String,

    #[serde(rename = "Teste automático")]
    pub teste_automatico: Option<i32>,

    #[serde(rename = "Modo")]
    pub modo: Option<String>,

    #[serde(rename = "Tratamento")]
    pub tratamento: Option<String>,

    #[serde(rename = "Tabela (Modbus)")]
    pub tabela_modbus: Option<String>,

    #[serde(rename = "Tipo (Modbus)")]
    pub tipo_modbus: Option<String>,

    #[serde(rename = "Registrador (Modbus)")]
    pub registrador_modbus: Option<u16>,

    #[serde(rename = "Tipo (DNP3)")]
    pub tipo_dnp3: Option<String>,

    #[serde(rename = "Índice (DNP3)")]
    pub indice_dnp3: Option<u32>,

    #[serde(rename = "Limite inferior")]
    pub limite_inferior: Option<String>,

    #[serde(rename = "Limite superior")]
    pub limite_superior: Option<String>,

    #[serde(rename = "Valor default")]
    pub valor_default: Option<String>,

    #[serde(rename = "Divisor")]
    pub divisor: Option<String>, // Kept as String to avoid parsing errors on empty or mixed formats

    #[serde(rename = "Unidade pt")]
    pub unidade_pt: Option<String>,

    #[serde(rename = "Unidade en")]
    pub unidade_en: Option<String>,

    #[serde(rename = "Unidade es")]
    pub unidade_es: Option<String>,

    #[serde(rename = "Conversão pt")]
    pub conversao_pt: Option<String>,

    #[serde(rename = "Conversão en")]
    pub conversao_en: Option<String>,

    #[serde(rename = "Conversão es")]
    pub conversao_es: Option<String>,

    #[serde(rename = "Opcional")]
    pub opcional: Option<String>,

    #[serde(rename = "Condicional")]
    pub condicional: Option<String>,

    #[serde(rename = "Nível de acesso")]
    pub nivel_de_acesso: Option<String>,

    #[serde(rename = "Descrição pt")]
    pub descricao_pt: Option<String>,

    #[serde(rename = "Descrição en")]
    pub descricao_en: Option<String>,

    #[serde(rename = "Descrição es")]
    pub descricao_es: Option<String>,

    #[serde(rename = "Display pt")]
    pub display_pt: Option<String>,

    #[serde(rename = "Display en")]
    pub display_en: Option<String>,

    #[serde(rename = "Display es")]
    pub display_es: Option<String>,

    #[serde(rename = "Observações")]
    pub observacoes: Option<String>,

    #[serde(rename = "Funcionalidade pt")]
    pub funcionalidade_pt: Option<String>,

    #[serde(rename = "Funcionalidade en")]
    pub funcionalidade_en: Option<String>,

    #[serde(rename = "Funcionalidade es")]
    pub funcionalidade_es: Option<String>,

    #[serde(rename = "Grupo pt")]
    pub grupo_pt: Option<String>,

    #[serde(rename = "Grupo en")]
    pub grupo_en: Option<String>,

    #[serde(rename = "Grupo es")]
    pub grupo_es: Option<String>,

    #[serde(rename = "Classificação")]
    pub classificacao: Option<String>,

    #[serde(rename = "Gráfico rápido")]
    pub grafico_rapido: Option<String>,

    #[serde(rename = "Histórico de dados")]
    pub historico_de_dados: Option<String>,

    #[serde(rename = "IEC 61850")]
    pub iec_61850: Option<String>,

    #[serde(rename = "Link")]
    pub link: Option<String>,

    #[serde(rename = "CDC")]
    pub cdc: Option<String>,

    pub value: Option<f64>,
}

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

    pub fn read_device(
        &mut self,
    ) -> Result<Vec<CsvMapping>, Box<dyn std::error::Error + Send + Sync>> {
        let map_path = get_map_path(&self.device, &self.firmware)?;
        let map_vec = csv_to_vec(&map_path)?;
        Ok(map_vec)
    }
}
