mod commands;

use commands::{ai, env_mgmt, livekit, memory, persona, settings, system, window_mgmt};
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Load .env from project root if available
    let _ = dotenv::dotenv();

    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_single_instance::init(|app, _args, _cwd| {
                // Focus main window when second instance is launched
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }),
        )
        .manage(system::AppState::new())
        .invoke_handler(tauri::generate_handler![
            // AI commands
            ai::chat,
            ai::stream_chat,
            ai::get_providers,
            ai::set_provider,
            ai::get_provider_status,
            ai::get_models,
            ai::set_model,
            ai::get_ephemeral_token,
            ai::clear_context,
            // Settings commands
            settings::get_settings,
            settings::save_settings,
            settings::get_setting,
            settings::set_setting,
            settings::get_all_settings,
            settings::reset_settings,
            settings::export_settings,
            settings::import_settings,
            // System commands
            system::get_system_info,
            system::get_system_stats,
            system::get_performance_mode,
            system::open_external_url,
            system::get_app_version,
            system::get_app_theme,
            // Persona commands
            persona::get_active_persona,
            persona::set_active_persona,
            persona::get_all_personas,
            persona::get_persona_state,
            persona::update_mood,
            persona::get_personality_config,
            // Memory commands
            memory::get_history,
            memory::search_memory,
            memory::add_entry,
            memory::get_user_preferences,
            memory::set_user_preferences,
            memory::get_privacy_mode,
            memory::set_privacy_mode,
            // Window management
            window_mgmt::minimize_window,
            window_mgmt::maximize_window,
            window_mgmt::close_window,
            window_mgmt::show_chat_window,
            window_mgmt::hide_chat_window,
            window_mgmt::get_window_state,
            window_mgmt::create_character_window,
            window_mgmt::show_character_window,
            window_mgmt::hide_character_window,
            window_mgmt::set_character_position,
            window_mgmt::set_character_size,
            window_mgmt::snap_character,
            window_mgmt::get_character_position,
            window_mgmt::toggle_character_always_on_top,
            window_mgmt::set_character_click_through,
            // Environment management
            env_mgmt::get_all_env,
            env_mgmt::set_env,
            env_mgmt::delete_env,
            // LiveKit commands
            livekit::livekit_connect,
            livekit::livekit_disconnect,
            livekit::livekit_get_status,
            livekit::livekit_start_agent,
            livekit::livekit_stop_agent,
        ])
        .setup(|app| {
            // Initialize global shortcuts
            #[cfg(desktop)]
            {
                use tauri::Manager;
                use tauri_plugin_global_shortcut::{
                    Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState,
                };

                let shortcut_show =
                    Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyN);

                let handle = app.handle().clone();
                app.handle().plugin(
                    tauri_plugin_global_shortcut::Builder::new()
                        .with_handler(move |_app, shortcut, event| {
                            if event.state() == ShortcutState::Pressed {
                                if shortcut == &shortcut_show {
                                    if let Some(window) = handle.get_webview_window("main") {
                                        let _ = window.show();
                                        let _ = window.set_focus();
                                    }
                                }
                            }
                        })
                        .build(),
                )?;
                #[cfg(windows)]
                window_mgmt::start_window_polling(app.handle().clone());

                app.global_shortcut().register(shortcut_show)?;
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Nizhal AI");
}
