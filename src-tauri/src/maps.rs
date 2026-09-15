use encoding_rs::WINDOWS_1252; //Essa outra porcaria aqui é para poder decodificar o CSV de latin1 para UTF-8
use encoding_rs_io::DecodeReaderBytesBuilder;
use polars::prelude::*;
use serde::Deserialize;
use serde::Serialize;
use serde_json::{json, Map, Value};
use std::fs;
use std::fs::File;
use std::io;
use std::io::Cursor;
use std::io::Read;
use std::path::Path;
use std::path::PathBuf;

#[derive(Debug, Deserialize, Serialize, Clone)]
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

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct DeviceData {
    #[serde(flatten)]
    pub mapping: CsvMapping,
    pub value: Option<f64>,
}

pub fn build_custom_tree(path: &Path, level: usize) -> io::Result<Option<Value>> {
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
            if let Some(child) = build_custom_tree(&entry.path(), level + 1)? {
                children.push(child);
            }
        }

        // Se esta pasta não tiver nenhum filho válido, omitimos ela totalmente
        if children.is_empty() {
            return Ok(None);
        }

        // Define o nome da chave baseado na profundidade
        let key_name = match level {
            0 => "IEDs",
            1 => "Firmware",
            _ => "children", // Caso existam níveis mais profundos
        };

        map.insert(key_name.to_string(), Value::Array(children));
    } else {
        // Se for um arquivo, usamos a chave "File"
        map.insert("File".to_string(), json!(true));
    }
    //println!("{:#?}", map);
    Ok(Some(Value::Object(map)))
}

/// Garante que o nome inserido seja compatível com código independente da letra ou separador
fn normalize_name(s: &str) -> String {
    s.chars()
        .filter(|c| c.is_alphanumeric())
        .flat_map(|c| c.to_lowercase())
        .collect()
}

/// Recebe um nome como referência e retorna o o nome da pasta salva em disco
fn find_dir_case_insensitive(parent: &Path, target: &str) -> Option<PathBuf> {
    let target_norm = normalize_name(target);
    let entries = fs::read_dir(parent).ok()?;
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                if normalize_name(name) == target_norm {
                    return Some(path);
                }
            }
        }
    }
    None
}

///Recives a deviec name and firmware number and returns its folder path
pub fn get_map_path(maps_path: &Path, device: &str, firmware: &str) -> Result<PathBuf, String> {
    let device_dir = find_dir_case_insensitive(maps_path, device)
        .ok_or_else(|| format!("Map Not Found (device: {})", device))?;
    let firmware_dir = find_dir_case_insensitive(&device_dir, firmware)
        .ok_or_else(|| format!("Map Not Found (firmware: {})", firmware))?;

    println!("Found folders for device: {}", firmware_dir.display());
    let entries = fs::read_dir(&firmware_dir).map_err(|e| e.to_string())?;
    for entry in entries.flatten() {
        if entry.path().is_file() {
            return Ok(entry.path());
        }
    }
    Err("No file found in map directory".to_string())
}

/// Recivies a path to the csv file then returns a vector of this csv
///
pub fn csv_to_vec(
    path: &Path,
) -> Result<Vec<CsvMapping>, Box<dyn std::error::Error + Send + Sync>> {
    let file = File::open(&path).expect("File not found");

    let mut utf8_file = DecodeReaderBytesBuilder::new()
        .encoding(Some(encoding_rs::WINDOWS_1252))
        .build(file);

    let mut content = String::new();
    utf8_file.read_to_string(&mut content)?;

    // Alguns mapas usam ';' como separador e outros (ex: mapas mais antigos) usam ',';
    // detectamos pelo cabeçalho em vez de fixar um único delimitador.
    let header_line = content.lines().next().unwrap_or("");
    let delimiter = if header_line.matches(',').count() > header_line.matches(';').count() {
        b','
    } else {
        b';'
    };

    let mut rdr = csv::ReaderBuilder::new()
        .delimiter(delimiter)
        .from_reader(content.as_bytes());

    let mappings: Vec<CsvMapping> = rdr.deserialize().collect::<Result<_, _>>()?;

    Ok(mappings)
}

/// Recebe o nome e o firmware e retorna todos os parametros públicos com o valor default do mapa do equipamento
pub fn get_public_parameters(
    maps_path: &Path,
    device: &str,
    firmware: &str,
) -> Result<Vec<DeviceData>, Box<dyn std::error::Error + Send + Sync>> {
    let map_path = get_map_path(maps_path, &device, &firmware)?;
    let map_vec = csv_to_vec(&map_path)?;

    let public_parameters_mappings: Vec<_> = map_vec
        .into_iter()
        .filter(|m| {
            m.nivel_de_acesso.as_deref() == Some("Público") && m.modo.as_deref() == Some("RW")
        })
        .collect();

    let mut results = Vec::with_capacity(public_parameters_mappings.len());
    for mapping in public_parameters_mappings {
        let parsed_value = mapping
            .valor_default
            .as_ref()
            .and_then(|v| v.parse::<f64>().ok());

        results.push(DeviceData {
            mapping,
            value: parsed_value,
        });
    }

    Ok(results)
}

pub fn return_client_csv(
    map_path: &PathBuf,
    lang: &String,
) -> Result<DataFrame, Box<dyn std::error::Error + Send + Sync>> {
    // Nomes das colunas do CSV original que mudam conforme o idioma escolhido
    let coluna_descricao = format!("Descrição {lang}");
    let coluna_unidade = format!("Unidade {lang}");
    let coluna_conversao = format!("Conversão {lang}");

    let raw_bytes_csv =
        std::fs::read(map_path).unwrap_or_else(|_e| panic!("WTF is worng with your path?"));
    let (decoded, _encoding_usado, has_errors) = WINDOWS_1252.decode(&raw_bytes_csv);

    if has_errors {
        panic!("Erro ao decodificar o CSV de latin1 para UTF-8");
    }
    let cursor = Cursor::new(decoded.as_bytes());

    //Aqui a variável csv passa a ser um DataFrame
    let csv = CsvReadOptions::default()
        .with_has_header(true)
        .with_parse_options(CsvParseOptions::default().with_separator(b';'))
        .into_reader_with_file_handle(cursor)
        .finish()?; // <- isso que faltava

    // Filtrando o CSV para obter apenas os registros públicos
    let public_csv = csv
        .clone()
        .lazy()
        .filter(col("Nível de acesso").eq(lit("Público"))) // Envolver com um lit para o plars saber que é um valor literal dentro da coluna Nível de acesso
        .select([
            col(coluna_descricao.as_str()).alias("Descrição"),
            col("Tratamento"),
            concat_str(
                [col("Limite inferior"), col("Limite superior")],
                "...",
                true,
            )
            .alias("Range"),
            // Se "Unidade {idioma}" estiver vazia (null), usa o valor de "Conversão {idioma}" no lugar
            col(coluna_unidade.as_str())
                .fill_null(col(coluna_conversao.as_str()))
                .alias("Unidade"),
            col("Opcional").fill_null(lit("STD")).alias("Opcional"),
            col("Tipo (Modbus)"),
            col("Registrador (Modbus)"),
            col("Tipo (DNP3)"),
            col("Índice (DNP3)"),
            col("IEC 61850"),
        ])
        .collect()?; // Isso transforma um lazyframe em um DataFrame de fato

    Ok(public_csv)
}
