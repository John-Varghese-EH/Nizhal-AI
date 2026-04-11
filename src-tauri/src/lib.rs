mod commands;

use commands::{ai, env_mgmt, livekit, memory, persona, settings, system, window_mgmt};
use tauri::{Manager, Emitter};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Load .env from project root if available
    let _ = dotenv::dotenv();

    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init());

    // Desktop-only plugins (not available on mobile)
    #[cfg(desktop)]
    {
        builder = builder.plugin(
            tauri_plugin_single_instance::init(|app, _args, _cwd| {
                // Focus main window when second instance is launched
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }),
        );
    }

    builder
        .manage(system::AppState::new())
        .invoke_handler(tauri::generate_handler![
            // AI commands (cross-platform)
            ai::chat,
            ai::stream_chat,
            ai::get_providers,
            ai::set_provider,
            ai::get_provider_status,
            ai::get_models,
            ai::set_model,
            ai::get_ephemeral_token,
            ai::clear_context,
            // Settings commands (cross-platform)
            settings::get_settings,
            settings::save_settings,
            settings::get_setting,
            settings::set_setting,
            settings::get_all_settings,
            settings::reset_settings,
            settings::export_settings,
            settings::import_settings,
            // System commands (cross-platform)
            system::get_system_info,
            system::get_system_stats,
            system::get_performance_mode,
            system::open_external_url,
            system::get_app_version,
            system::get_app_theme,
            // Persona commands (cross-platform)
            persona::get_active_persona,
            persona::set_active_persona,
            persona::get_all_personas,
            persona::get_persona_state,
            persona::update_mood,
            persona::get_personality_config,
            // Memory commands (cross-platform)
            memory::get_history,
            memory::search_memory,
            memory::add_entry,
            memory::get_user_preferences,
            memory::set_user_preferences,
            memory::get_privacy_mode,
            memory::set_privacy_mode,
            // Window management (desktop-implemented, mobile stubs)
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
            window_mgmt::get_available_monitors,
            window_mgmt::set_character_monitor,
            // Platform detection (cross-platform)
            window_mgmt::get_platform_info,
            window_mgmt::is_mobile_platform,
            window_mgmt::get_device_tier,
            // Environment management (cross-platform)
            env_mgmt::get_all_env,
            env_mgmt::set_env,
            env_mgmt::delete_env,
            // LiveKit commands (cross-platform)
            livekit::livekit_connect,
            livekit::livekit_disconnect,
            livekit::livekit_get_status,
            livekit::livekit_start_agent,
            livekit::livekit_stop_agent,
        ])
        .setup(|app| {
            // Desktop-only initialization
            #[cfg(desktop)]
            {
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

                // Windows-only: Start Win32 window polling for 3D collision
                #[cfg(windows)]
                window_mgmt::start_window_polling(app.handle().clone());

                app.global_shortcut().register(shortcut_show)?;

                // Build system tray menu
                {
                    use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
                    use tauri::tray::TrayIconBuilder;

                    let app_handle = app.handle();

                    let show_item = MenuItem::with_id(app_handle, "show", "Show Main Window", true, None::<&str>)?;
                    let hide_item = MenuItem::with_id(app_handle, "hide", "Hide Main Window", true, None::<&str>)?;
                    let separator1 = PredefinedMenuItem::separator(app_handle)?;
                    let show_char = MenuItem::with_id(app_handle, "show_character", "Show Screen Mate", true, None::<&str>)?;
                    let hide_char = MenuItem::with_id(app_handle, "hide_character", "Hide Screen Mate", true, None::<&str>)?;
                    let reset_char_pos = MenuItem::with_id(app_handle, "reset_character_position", "Reset Mate Position", true, None::<&str>)?;
                    let separator2 = PredefinedMenuItem::separator(app_handle)?;
                    let settings_item = MenuItem::with_id(app_handle, "settings", "Settings", true, None::<&str>)?;
                    let separator3 = PredefinedMenuItem::separator(app_handle)?;
                    let quit_item = MenuItem::with_id(app_handle, "quit", "Quit Nizhal AI", true, None::<&str>)?;

                    let menu = Menu::with_items(app_handle, &[
                        &show_item,
                        &hide_item,
                        &separator1,
                        &show_char,
                        &hide_char,
                        &reset_char_pos,
                        &separator2,
                        &settings_item,
                        &separator3,
                        &quit_item,
                    ])?;

                    let handle_for_tray = app.handle().clone();
                    TrayIconBuilder::new()
                        .icon(app.default_window_icon().unwrap().clone())
                        .menu(&menu)
                        .on_menu_event(move |_app, event| {
                            match event.id().as_ref() {
                                "show" => {
                                    if let Some(window) = handle_for_tray.get_webview_window("main") {
                                        let _ = window.show();
                                        let _ = window.set_focus();
                                    }
                                }
                                "hide" => {
                                    if let Some(window) = handle_for_tray.get_webview_window("main") {
                                        let _ = window.hide();
                                    }
                                }
                                "show_character" => {
                                    if let Some(window) = handle_for_tray.get_webview_window("character") {
                                        let _ = window.show();
                                    }
                                }
                                "hide_character" => {
                                    if let Some(window) = handle_for_tray.get_webview_window("character") {
                                        let _ = window.hide();
                                    }
                                }
                                "reset_character_position" => {
                                    if let Some(window) = handle_for_tray.get_webview_window("character") {
                                        // Try to send an event to the frontend or directly center the window
                                        let _ = window.center();
                                        // Also ask the webview to reset local scaling/position state
                                        let _ = window.emit("reset-character-transform", ());
                                    }
                                }
                                "settings" => {
                                    if let Some(window) = handle_for_tray.get_webview_window("main") {
                                        let _ = window.show();
                                        let _ = window.set_focus();
                                        let _ = window.emit("navigate-to-settings", ());
                                    }
                                }
                                "quit" => {
                                    std::process::exit(0);
                                }
                                _ => {}
                            }
                        })
                        .build(app)?;
                }
            }

            // Mobile-specific initialization
            #[cfg(mobile)]
            {
                log::info!("Nizhal AI starting in mobile mode");
                // Mobile overlay service will be initialized from the frontend
                // via PlatformBridge.js → native Kotlin/Swift bridge
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Nizhal AI");
}
