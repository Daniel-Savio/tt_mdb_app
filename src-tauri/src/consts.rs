use std::path::PathBuf;
use tauri::{AppHandle, Manager};

//Serve só para globalizar o caminho para a pasta de folders
pub fn maps_path(app: &AppHandle) -> PathBuf {
    app.path()
        .resource_dir()
        .unwrap()
        .join("src")
        .join("maps_folder")
}
