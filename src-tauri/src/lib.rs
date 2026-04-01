pub mod maps;
use core::str;
use modbus::tcp;
use modbus::{Client, Config};
use std::path::Path;
use std::time::Duration;

use maps::build_custom_tree;
use serde::{Deserialize, Serialize};

// enum IPCMessage {
//     error(bool),
//     message(String),
// }

#[derive(Serialize)]
struct GetMapsResponse {
    maps: String,
    err: bool,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct ModbusConnection {
    device: String,
    firmware: String,
    host: String,
    port: u16,
    slave_id: u8,
    timeout: u64,
    retries: u32,
    serial_port: String,
    baudrate: u32,
    parity: String,
    stop_bits: u8,
    data_bits: u8,
    is_tcp: bool,
}

#[tauri::command]
fn get_maps() -> GetMapsResponse {
    let paths = [
        "src-tauri/src/maps_folder/",
        "src/maps_folder/",
        "./maps_folder/",
    ];
    let mut path = Path::new(paths[0]);

    for p in paths {
        let candidate = Path::new(p);
        if candidate.exists() {
            path = candidate;
            break;
        }
    }

    if !path.exists() {
        return GetMapsResponse {
            maps: String::from("Erro: O directório {} não existe nos locais testados."),
            err: true,
        };
    }
    match build_custom_tree(path, 0) {
        Ok(tree) => {
            let json_output = serde_json::to_string_pretty(&tree).unwrap();

            return GetMapsResponse {
                maps: json_output,
                err: false,
            };
        }
        Err(e) => {
            return GetMapsResponse {
                maps: String::from("Error building tree"),
                err: true,
            };
        }
    }
}

#[tauri::command]
fn create_connection(info: String) {
    let connection_info: ModbusConnection = match serde_json::from_str(&info) {
        Ok(info) => info,
        Err(e) => {
            eprintln!("Error parsing connection info: {}", e);
            return;
        }
    };

    if connection_info.is_tcp {
        let _config = Config {
            tcp_port: connection_info.port,
            tcp_read_timeout: Some(Duration::new(connection_info.timeout as u64, 0)),
            tcp_write_timeout: Some(Duration::new(connection_info.timeout as u64, 0)),
            tcp_connect_timeout: Some(Duration::new(connection_info.timeout as u64, 0)),
            modbus_uid: connection_info.slave_id,
        };


    let mut client = match tcp::Transport::new_with_cfg(&connection_info.host, _config) {
        Ok(client) => client,
        Err(e) => {
            eprintln!(
                "Failed to connect to Modbus device: {}:{}\nError: {}",
                connection_info.host, connection_info.port, e
            );
            return;
        }
    };

    let response = client.read_holding_registers(0, 1);

    let data = match response {
        Ok(response) => response[0],
        Err(e) => {
            eprintln!("Failed to read holding registers: {}", e);
            return;
        }
    };
    println!("Data: {:b}", data);
    }


}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Procura o diretório em caminhos relativos possíveis

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, get_maps, create_connection])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
