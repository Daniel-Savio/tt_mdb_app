use std::path::PathBuf;
use tauri::{AppHandle, Manager};

/// Serve só para globalizar o caminho para a pasta de folders.
/// Em modo dev, aponta direto para src-tauri/src/maps_folder (a pasta fonte),
/// para refletir alterações sem precisar reempacotar os resources.
/// Em produção, usa a pasta de resources empacotada com o app.
pub fn maps_path(app: &AppHandle) -> PathBuf {
    if cfg!(debug_assertions) {
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("src")
            .join("maps_folder")
    } else {
        app.path()
            .resource_dir()
            .unwrap()
            .join("src")
            .join("maps_folder")
    }
}
