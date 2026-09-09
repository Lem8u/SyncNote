use tauri::{Emitter, Manager};
use tauri_plugin_deep_link::DeepLinkExt;

#[tauri::command]
fn open_external_url(url: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("rundll32")
            .args(["url.dll,FileProtocolHandler", &url])
            .spawn()
            .map_err(|e| e.to_string())?;
        Ok(())
    }
    #[cfg(not(target_os = "windows"))]
    {
        let _ = url;
        Ok(())
    }
}

#[cfg(target_os = "windows")]
fn ensure_syncnote_protocol_registered() {
    use std::env;
    use winreg::enums::HKEY_CURRENT_USER;
    use winreg::RegKey;

    if let Ok(exe_path) = env::current_exe() {
        let exe = exe_path.to_string_lossy().to_string();
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        if let Ok((key, _)) = hkcu.create_subkey("Software\\Classes\\syncnote") {
            let _ = key.set_value("", &"URL:SyncNote Protocol");
            let _ = key.set_value("URL Protocol", &"");
            if let Ok((cmd_key, _)) = key.create_subkey("shell\\open\\command") {
                let cmd = format!("\"{}\" \"%1\"", exe);
                let _ = cmd_key.set_value("", &cmd);
                println!("[DeepLink] Protocol registered in HKCU: {}", cmd);
            }
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            println!("[SingleInstance] Triggered with args: {:?}", argv);
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.unminimize();
                let _ = w.set_focus();
            }
            let _ = app.emit("deep-link://new-url", argv);
        }))
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            #[cfg(target_os = "windows")]
            {
                ensure_syncnote_protocol_registered();
            }
            #[cfg(desktop)]
            {
                let _ = app.deep_link().register("syncnote");
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![open_external_url])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
