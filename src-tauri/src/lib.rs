pub mod maps;
pub mod modbus;
use crate::modbus::ModbusClient;
use maps::build_custom_tree;
use maps::MAPS_FOLDER;
use modbus::ModbusConnection;
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, State};
use crate::maps::{CsvMapping};



#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
struct ConnectionData {
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
    device: String,
    firmware: String,
}

#[derive(Serialize)]
struct GetMapsResponse {
    maps: String,
    err: bool,
}

struct AppState {
    client: Mutex<Option<ModbusClient>>,
}

#[tauri::command]
fn get_maps() -> GetMapsResponse {
    let path = Path::new(MAPS_FOLDER);

    match build_custom_tree(path, 0) {
        Ok(Some(tree)) => {
            let json_output = serde_json::to_string_pretty(&tree).unwrap();

            return GetMapsResponse {
                maps: json_output,
                err: false,
            };
        }
        Ok(None) => {
            return GetMapsResponse {
                maps: String::from("No maps found"),
                err: true,
            };
        }
        Err(_e) => {
            return GetMapsResponse {
                maps: String::from("Error building tree"),
                err: true,
            };
        }
    }
}

#[tauri::command]
async fn create_connection(info: String, app: AppHandle, state: State<'_, AppState>) -> Result<(), String> {
    let connection_info: ConnectionData = match serde_json::from_str(&info) {
        Ok(info) => info,
        Err(e) => {
            eprintln!("Error parsing connection info: {}", e);
            return Err("Error parsing connection info".to_string());
        }
    };
    let device_name = connection_info.device.clone();
    let firmware = connection_info.firmware.clone();

    let connection_info = ModbusConnection {
        host: connection_info.host,
        port: connection_info.port,
        slave_id: connection_info.slave_id,
        timeout: connection_info.timeout,
        retries: connection_info.retries,
        serial_port: connection_info.serial_port,
        baudrate: connection_info.baudrate,
        parity: connection_info.parity,
        stop_bits: connection_info.stop_bits,
        data_bits: connection_info.data_bits,
        is_tcp: connection_info.is_tcp,
    };
    app.emit("connection-trying", true).unwrap();
    
    
    if let Ok(mut client) = ModbusClient::new(connection_info, device_name.clone(), firmware.clone()).await {
        println!("Successfully created Modbus client for device: {}-{}", device_name, firmware);
        *state.client.lock().unwrap() = Some(client);
        app.emit("connection-success", "Successfully connected to device").unwrap();
        Ok(())
    } else {
        app.emit("connection-error", "Failed to create Modbus client").unwrap();
        Err("Failed to create Modbus client".to_string())
    }
    

    
}

#[tauri::command]
fn start_reading(state: State<'_, AppState>) -> Result<String, String> {
    let mut client_guard = state.client.lock().unwrap();
    if let Some(ref mut client) = *client_guard {
        match client.read_device() {
            Ok(data) => {
                let serialized = serde_json::to_string(&data)
                    .map_err(|e| format!("Falha ao serializar: {}", e))?;
                Ok(serialized)
            }
            Err(e) => Err(format!("Erro ao ler dispositivo: {}", e)),
        }
    } else {
        Err("Cliente Modbus não conectado".to_string())
    }
}

#[tauri::command]
fn get_serial_ports() -> Vec<String> {
    match tokio_serial::available_ports() {
        Ok(ports) => ports.into_iter().map(|p| p.port_name).collect(),
        Err(e) => {
            eprintln!("Error listing USB ports: {}", e);
            vec![]
        }
    }
}

#[tauri::command]
fn stop_reading(app: AppHandle) {
    app.emit("reading-stop", true).unwrap();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Procura o diretório em caminhos relativos possíveis

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState { client: Mutex::new(None) })
        .invoke_handler(tauri::generate_handler![get_maps, create_connection, get_serial_ports, start_reading, stop_reading])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
