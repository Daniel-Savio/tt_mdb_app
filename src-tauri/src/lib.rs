pub mod maps;
use core::str;
use std::path::Path;

use maps::build_custom_tree;
use serde::Serialize;

#[derive(Serialize)]
struct GetMapsResponse{
    maps: String,
    err: bool
}

#[tauri::command]
fn get_maps() -> GetMapsResponse{
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
            err: true
        };
    }
    match build_custom_tree(path, 0) {
        Ok(tree) => {
            let json_output = serde_json::to_string_pretty(&tree).unwrap();

            return GetMapsResponse {
                maps: json_output,
                err: false
            };
        }
        Err(e) => {

            return GetMapsResponse {
                maps: String::from("Error building tree"),
                err: true
            };
        }
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
        .invoke_handler(tauri::generate_handler![greet, get_maps])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
