use serde_json::{json, Value, Map};
use std::fs;
use std::path::Path;
use std::io;


pub fn build_custom_tree(path: &Path, level: usize) -> io::Result<Value> {
    let name = path.file_name()
        .and_then(|n| n.to_str())
        .unwrap_or(".")
        .to_string();

    let mut map = Map::new();
    map.insert("name".to_string(), json!(name));

    if path.is_dir() {
        let mut children = Vec::new();
        for entry in fs::read_dir(path)? {
            let entry = entry?;
            // Incrementamos o nível para decidir o nome da chave no próximo passo
            children.push(build_custom_tree(&entry.path(), level + 1)?);
        }

        // Define o nome da chave baseado na profundidade
        let key_name = match level {
            0 => "IEDs",
            1 => "Firmware",
            _ => "children", // Caso existam níveis mais profundos
        };

        if !children.is_empty() {
            map.insert(key_name.to_string(), Value::Array(children));
        }
    } else {
        // Se for um arquivo, usamos a chave "File"
        map.insert("File".to_string(), json!(true));
    }

    Ok(Value::Object(map))
}