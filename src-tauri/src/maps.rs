use serde_json::{json,Map, Value};
use encoding_rs_io::DecodeReaderBytesBuilder;
use std::fs;
use std::fs::File;
use std::io;
use std::path::Path;
use std::path::PathBuf;

pub const MAPS_FOLDER: &str = "src/maps_folder/";

use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct CsvMapping {
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
}

pub fn build_custom_tree(path: &Path, level: usize) -> io::Result<Value> {
    let name = path
        .file_name()
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

pub fn get_maps(device: &str, firmware: &str) -> Result<PathBuf, String> {
    let device_folder = device.to_lowercase().replace(" ", "_");
    let firmware_folder = firmware.to_lowercase().replace(".", "_");

    let path = Path::new(MAPS_FOLDER)
        .join(&device_folder)
        .join(&firmware_folder);
    if path.is_dir() {
        println!("Found folders for device: {}", &path.display());
        return Ok(path);
    } else {
        println!(
            "Maps not found for device: {}-{}",
            &device_folder, &firmware_folder
        );
        Err("Map Not Found".to_string())
    }
}


pub fn csv_to_vec(path: &Path) -> Result<Vec<CsvMapping>, Box<dyn std::error::Error + Send + Sync>> {
    let file = File::open(path)?;

    let utf8_file = DecodeReaderBytesBuilder::new()
        .encoding(Some(encoding_rs::WINDOWS_1252))
        .build(file);
    
    let mut rdr = csv::ReaderBuilder::new()
        .delimiter(b';')
        .from_reader(utf8_file);

    let mappings: Vec<CsvMapping> = rdr
        .deserialize()
        .collect::<Result<_, _>>()?;

    Ok(mappings)
}
