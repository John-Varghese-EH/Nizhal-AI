import { app, BrowserWindow, ipcMain, shell, nativeTheme, globalShortcut, powerSaveBlocker } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { MultiWindowManager } from './src/electron/MultiWindowManager.js';
import { systemStatsService } from './src/electron/SystemStatsService.js';
import { createSystemBridge } from './src/electron/bridge.js';
import { PersonalityCore } from './src/core/PersonalityCore.js';
import { PersonaManager } from './src/core/PersonaManager.js';
import { MemoryService } from './src/core/MemoryService.js';
import { appStateService } from './src/core/AppStateService.js';
import { AIService } from './src/services/AIService.js';
import { NizhalAI } from './src/core/NizhalAI.js';
import { VoiceService } from './src/services/VoiceService.js';
import { UserAttachmentService } from './src/services/UserAttachmentService.js';
import { AdvancedVoiceService } from './src/services/AdvancedVoiceService.js';
import { SmartHomeService } from './src/services/SmartHomeService.js';
import { TranslationService } from './src/services/TranslationService.js';
import { AdvancedPersonalityCore } from './src/core/AdvancedPersonalityCore.js';
import { SecurityService } from './src/services/SecurityService.js';
import { CollaborationService } from './src/services/CollaborationService.js';
import { GestureRecognitionService } from './src/services/GestureRecognitionService.js';
import { HumorEngine } from './src/core/HumorEngine.js';
import { HelpfulAssistant } from './src/core/HelpfulAssistant.js';
import { SecurityAuditor } from './src/core/SecurityAuditor.js';
import { SettingsManager } from './src/core/SettingsManager.js';
// FREE SERVICES (Main Process Only)
import { desktopAutomation } from './src/services/DesktopAutomationService.js';
import { adbControl } from './src/services/ADBControlService.js';
import { networkUtils } from './src/services/NetworkUtilsService.js';
import { PERSONALITIES, getPersonality, getGreeting } from './src/core/PersonalityProfiles.js';
// LiveKit Integration
import { LiveKitService } from './src/services/LiveKitService.js';
import { AgentProcessManager } from './src/services/AgentProcessManager.js';
// Note: LocalVoice and EmotionDetector are renderer-only (use browser APIs)
import { envManager } from './src/core/EnvManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Global service references
let windowManager = null;
let systemBridge = null;
let personalityCore = null;
let personaManager = null;
let memoryService = null;
let aiService = null;
let nizhalAI = null;
let voiceService = null;
let userAttachmentService = null;
let advancedVoiceService = null;
let smartHomeService = null;
let translationService = null;
let advancedPersonalityCore = null;
let securityService = null;
let collaborationService = null;
let gestureRecognitionService = null;
let humorEngine = null;
let helpfulAssistant = null;
let securityAuditor = null;
let settingsManager = null;
// LiveKit services
let livekitService = null;
let agentManager = null;
// FREE services (singletons imported)
let currentPersonality = 'gf'; // Default personality

// Performance optimization
let powerSaveBlockerId = null;
let resourceMonitorInterval = null;
let isLowEndMode = false;

async function initializeServices() {
  // Initialize centralized state service first
  appStateService.initialize(ipcMain);

  // Detect low-end mode
  await detectLowEndMode();

  personalityCore = new PersonalityCore();
  memoryService = new MemoryService(app.getPath('userData'));
  await memoryService.initialize();

  personaManager = new PersonaManager(personalityCore);

  aiService = new AIService(personaManager, memoryService);
  await aiService.initialize();
  nizhalAI = new NizhalAI(aiService, personalityCore, appStateService);

  voiceService = new VoiceService();

  // Initialize user attachment service for personalization
  userAttachmentService = new UserAttachmentService(memoryService, personalityCore);
  await userAttachmentService.initialize();

  // Initialize advanced services
  advancedVoiceService = new AdvancedVoiceService(process.env.ELEVENLABS_API_KEY);
  smartHomeService = new SmartHomeService();
  translationService = new TranslationService(process.env.GOOGLE_TRANSLATE_API_KEY);
  advancedPersonalityCore = new AdvancedPersonalityCore();
  securityService = new SecurityService();
  collaborationService = new CollaborationService();
  gestureRecognitionService = new GestureRecognitionService();
  humorEngine = new HumorEngine();
  helpfulAssistant = new HelpfulAssistant();
  securityAuditor = new SecurityAuditor();
  settingsManager = new SettingsManager(app.getPath('userData'));
  
  // Initialize settings manager
  await settingsManager.initialize();
  
  // Apply settings to services
  await applySettingsToServices();

  // Start resource monitoring
  startResourceMonitoring();

  // FREE SERVICES INITIALIZATION
  // Note: LocalVoice is renderer-only (uses browser APIs)
  // It will be initialized in the renderer process, not here

  // ADB: Check if ADB is installed
  const adbInstalled = await adbControl.checkADBInstalled();
  if (adbInstalled) {
    console.log('[Main] ✅ ADB available for Android control');
  } else {
    console.log('[Main] ⚠️ ADB not found. Android control disabled.');
  }

  // Sync initial personality mode from state
  const savedPersonaId = appStateService.get('ai.activePersonaId') || 'gf';
  currentPersonality = savedPersonaId;
  // Voice personality will be set by renderer process

  // LIVEKIT INITIALIZATION
  livekitService = new LiveKitService();
  if (livekitService.isConfigured()) {
    console.log('[Main] ✅ LiveKit configured for real-time voice');
    agentManager = new AgentProcessManager(livekitService);
  } else {
    console.log('[Main] ⚠️ LiveKit not configured. Set LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET in .env');
  }

  console.log('[Main] 🎭 Active personality:', currentPersonality);
  console.log('[Main] ✅ FREE edition initialized (Main process services only)');
  console.log('[Main] 📢 Voice & Emotion detection available in renderer');
  console.log('[Main] 🚀 Performance mode:', isLowEndMode ? 'LOW-END' : 'STANDARD');
  console.log('[Main] 🎤 Advanced Voice Service initialized');
  console.log('[Main] 🏠 Smart Home Service initialized');
  console.log('[Main] 🌍 Translation Service initialized');
  console.log('[Main] 🧠 Advanced Personality Core initialized');
  console.log('[Main] 🔒 Security Service initialized');
  console.log('[Main] 🤝 Collaboration Service initialized');
  console.log('[Main] 👋 Gesture Recognition Service initialized');
  console.log('[Main] 😄 Humor Engine initialized');
  console.log('[Main] 🤖 Helpful Assistant initialized');
  console.log('[Main] 🛡️ Security Auditor initialized');
  console.log('[Main] ⚙️ Settings Manager initialized');

  // Environment IPC
  ipcMain.handle('env:getAll', () => envManager.getAll());
  ipcMain.handle('env:set', (_, key, value) => envManager.set(key, value));
  ipcMain.handle('env:delete', (_, key) => envManager.delete(key));
}

/**
 * Apply settings to all services
 */
async function applySettingsToServices() {
  try {
    // Apply voice settings
    if (voiceService && settingsManager) {
      const voiceSettings = settingsManager.getCategory('voice');
      if (voiceSettings.enabled) {
        voiceService.updateSettings(voiceSettings);
      }
    }
    
    // Apply humor settings
    if (humorEngine && settingsManager) {
      const humorSettings = settingsManager.getCategory('humor');
      humorEngine.updatePreferences(humorSettings);
    }
    
    // Apply assistant settings
    if (helpfulAssistant && settingsManager) {
      const assistantSettings = settingsManager.getCategory('assistant');
      helpfulAssistant.updatePreferences(assistantSettings);
    }
    
    // Apply security settings
    if (securityService && settingsManager) {
      const securitySettings = settingsManager.getCategory('security');
      securityService.setSecurityLevel(securitySettings.level);
    }
    
    // Apply translation settings
    if (translationService && settingsManager) {
      const translationSettings = settingsManager.getCategory('translation');
      translationService.updateSettings(translationSettings);
    }
    
    // Apply smart home settings
    if (smartHomeService && settingsManager) {
      const smartHomeSettings = settingsManager.getCategory('smartHome');
      if (smartHomeSettings.enabled) {
        smartHomeService.updateSettings(smartHomeSettings);
      }
    }
    
    // Apply collaboration settings
    if (collaborationService && settingsManager) {
      const collaborationSettings = settingsManager.getCategory('collaboration');
      collaborationService.updateSettings(collaborationSettings);
    }
    
    // Apply gesture settings
    if (gestureRecognitionService && settingsManager) {
      const gestureSettings = settingsManager.getCategory('gestures');
      if (gestureSettings.enabled) {
        gestureRecognitionService.updateSettings(gestureSettings);
      }
    }
    
    // Apply personality settings
    if (advancedPersonalityCore && settingsManager) {
      const personalitySettings = settingsManager.getCategory('personality');
      advancedPersonalityCore.updateSettings(personalitySettings);
    }
    
    console.log('[Main] ✓ Settings applied to all services');
  } catch (error) {
    console.error('[Main] Failed to apply settings to services:', error);
  }
}

// Performance optimization functions
async function detectLowEndMode() {
  try {
    const os = require('os');
    const totalMem = os.totalmem();
    const cpus = os.cpus();
    const numCores = cpus.length;
    
    // Consider low-end if less than 4GB RAM or less than 4 cores
    isLowEndMode = totalMem < 4 * 1024 * 1024 * 1024 || numCores < 4;
    
    console.log(`[Main] System: ${numCores} cores, ${(totalMem / 1024 / 1024 / 1024).toFixed(1)}GB RAM`);
    
    if (isLowEndMode) {
      console.log('[Main] 🐌 Low-end device detected - enabling optimizations');
      // Enable power save blocker to prevent system sleep during active use
      powerSaveBlockerId = powerSaveBlocker.start('prevent-app-suspension');
    }
  } catch (error) {
    console.warn('[Main] Failed to detect system specs:', error);
    isLowEndMode = false;
  }
}

function startResourceMonitoring() {
  if (isLowEndMode) {
    resourceMonitorInterval = setInterval(() => {
      const usage = process.memoryUsage();
      const memUsageMB = usage.rss / 1024 / 1024;
      
      // If memory usage exceeds 300MB on low-end, trigger cleanup
      if (memUsageMB > 300) {
        console.log(`[Main] High memory usage detected: ${memUsageMB.toFixed(1)}MB - triggering cleanup`);
        windowManager?.broadcast('system:memoryWarning', { usage: memUsageMB });
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }
    }, 30000); // Check every 30 seconds
  }
}

function setupSecurityPolicy() {
  // Set Content Security Policy headers via session
  app.on('ready', () => {
    const { session } = require('electron');

    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://storage.googleapis.com https://www.gstatic.com blob:; " +
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
            "font-src 'self' https://fonts.gstatic.com data:; " +
            "img-src 'self' blob: data: https: file:; " +
            "media-src 'self' blob: data: https:; " +
            "connect-src 'self' blob: data: http://localhost:* ws://localhost:* wss://localhost:* " +
            "https://*.googleapis.com https://*.gstatic.com https://storage.googleapis.com " +
            "https://www.gstatic.com https://*.elevenlabs.io https://*.razorpay.com " +
            "https://*.stripe.com https://api.open-meteo.com https://*.livekit.cloud " +
            "wss://*.livekit.cloud https://api.openai.com https://api.anthropic.com " +
            "http://localhost:11434; " +
            "worker-src 'self' blob:;"
          ]
        }
      });
    });
  });

  app.on('web-contents-created', (event, contents) => {
    contents.on('will-navigate', (event, navigationUrl) => {
      const parsedUrl = new URL(navigationUrl);
      if (parsedUrl.origin !== 'http://localhost:5173' && !parsedUrl.href.startsWith('file://')) {
        event.preventDefault();
      }
    });

    contents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('https://')) {
        shell.openExternal(url);
      }
      return { action: 'deny' };
    });
  });
}


// Register global productivity shortcuts
function registerGlobalShortcuts() {
  // PERSONALITY SWITCHING (NEW FREE EDITION)
  globalShortcut.register('CommandOrControl+1', () => {
    // Switch to GF personality
    switchPersonality('gf');
  });

  globalShortcut.register('CommandOrControl+2', () => {
    // Switch to BF personality
    switchPersonality('bf');
  });

  globalShortcut.register('CommandOrControl+3', () => {
    // Switch to JARVIS personality
    switchPersonality('jarvis');
  });

  // Productivity shortcuts
  globalShortcut.register('CommandOrControl+Shift+Z', () => {
    // Zen Mode
    windowManager.broadcast('hotkey:zen');
  });

  globalShortcut.register('CommandOrControl+Shift+T', () => {
    // Time Report
    windowManager.broadcast('hotkey:time');
  });

  globalShortcut.register('CommandOrControl+Shift+H', () => {
    // Health Check
    windowManager.broadcast('hotkey:health');
  });

  // Personality Mode Shortcuts (Ctrl+1 to Ctrl+5)
  globalShortcut.register('CommandOrControl+1', () => {
    currentPersonality = 'gf';
    appStateService.setPersonalityMode('gf');
    windowManager.broadcast('personality:changed', { mode: 'gf', source: 'hotkey' });
    // Sync LiveKit agent
    if (agentManager?.getStatus().isRunning) {
      agentManager.updatePersonality('gf');
    }
  });

  globalShortcut.register('CommandOrControl+2', () => {
    currentPersonality = 'bf';
    appStateService.setPersonalityMode('bf');
    windowManager.broadcast('personality:changed', { mode: 'bf', source: 'hotkey' });
    if (agentManager?.getStatus().isRunning) {
      agentManager.updatePersonality('bf');
    }
  });

  globalShortcut.register('CommandOrControl+3', () => {
    currentPersonality = 'jarvis';
    appStateService.setPersonalityMode('jarvis');
    windowManager.broadcast('personality:changed', { mode: 'jarvis', source: 'hotkey' });
    if (agentManager?.getStatus().isRunning) {
      agentManager.updatePersonality('jarvis');
    }
  });

  globalShortcut.register('CommandOrControl+4', () => {
    currentPersonality = 'lachu';
    appStateService.setPersonalityMode('lachu');
    windowManager.broadcast('personality:changed', { mode: 'lachu', source: 'hotkey' });
    if (agentManager?.getStatus().isRunning) {
      agentManager.updatePersonality('lachu');
    }
  });

  globalShortcut.register('CommandOrControl+5', () => {
    currentPersonality = 'auto';
    appStateService.setPersonalityMode('auto');
    windowManager.broadcast('personality:changed', { mode: 'auto', source: 'hotkey' });
    if (agentManager?.getStatus().isRunning) {
      agentManager.updatePersonality('auto');
    }
  });

  console.log('[Main] Global shortcuts registered (Productivity + Personality Modes)');
}

async function createWindows() {
  const preloadPath = path.join(__dirname, 'preload.js');

  // Initialize multi-window manager
  windowManager = new MultiWindowManager(isDev);

  // Create character overlay window
  await windowManager.createCharacterWindow(preloadPath);

  // Create chat window (hidden by default)
  await windowManager.createChatWindow(preloadPath);

  // Register windows for state synchronization
  if (windowManager.characterWindow) {
    appStateService.registerWindow(windowManager.characterWindow);
  }
  if (windowManager.chatWindow) {
    appStateService.registerWindow(windowManager.chatWindow);
  }

  // Create system tray
  const iconPath = path.join(__dirname, 'assets', 'icon.png');
  windowManager.createTray(iconPath);

  // Open dev tools in development
  if (isDev) {
    windowManager.chatWindow?.webContents.openDevTools({ mode: 'detach' });
  }

  systemBridge = createSystemBridge();

  // Register shortcuts
  registerGlobalShortcuts();
}

function setupIPC() {
  // Window controls for chat window
  ipcMain.handle('window:minimize', () => windowManager?.hideChatWindow());
  ipcMain.handle('window:maximize', () => {
    if (windowManager?.chatWindow && !windowManager.chatWindow.isDestroyed()) {
      if (windowManager.chatWindow.isMaximized()) {
        windowManager.chatWindow.unmaximize();
        windowManager.restoreCharacterPosition();
      } else {
        windowManager.chatWindow.maximize();
        windowManager.moveCharacterToTopLeft();
      }
      return windowManager.chatWindow.isMaximized();
    }
    return false;
  });
  ipcMain.handle('window:close', () => windowManager?.hideChatWindow());
  ipcMain.handle('window:showChat', () => windowManager?.showChatWindow());
  ipcMain.handle('window:hideChat', () => windowManager?.hideChatWindow());

  // Window state tracking for adaptive UI
  ipcMain.handle('window:getState', () => {
    if (windowManager?.chatWindow && !windowManager.chatWindow.isDestroyed()) {
      return {
        isMaximized: windowManager.chatWindow.isMaximized(),
        isMinimized: windowManager.chatWindow.isMinimized(),
        isVisible: windowManager.chatWindow.isVisible(),
        bounds: windowManager.chatWindow.getBounds()
      };
    }
    return null;
  });

  // Privacy mode toggle (stored in memory service)
  ipcMain.handle('privacy:getMode', () => memoryService?.getUserPreferences()?.privacyMode || false);
  ipcMain.handle('privacy:setMode', async (_, enabled) => {
    const prefs = await memoryService?.getUserPreferences() || {};
    prefs.privacyMode = enabled;
    await memoryService?.setUserPreferences(prefs);
    windowManager?.broadcast('privacy:changed', enabled);
    return enabled;
  });

  // Character window controls
  ipcMain.handle('character:show', () => windowManager?.showCharacterWindow());
  ipcMain.handle('character:hide', () => windowManager?.hideCharacterWindow());
  ipcMain.handle('character:toggleAlwaysOnTop', () => {
    const isOnTop = windowManager?.characterWindow?.isAlwaysOnTop() || false;
    windowManager?.setCharacterAlwaysOnTop(!isOnTop);
    return !isOnTop;
  });
  ipcMain.handle('character:snap', (_, corner) => windowManager?.snapCharacterToCorner(corner));
  ipcMain.handle('character:setClickThrough', (_, enable) => windowManager?.setCharacterClickThrough(enable));
  ipcMain.handle('character:setModel', (_, modelId) => {
    // Update state
    appStateService.set('vrm.modelId', modelId);
    // ALSO send direct message to ensure immediate response
    windowManager?.sendToCharacter('vrm:modelChanged', modelId);
    return modelId;
  });
  ipcMain.handle('window:moveCharacter', (_, deltaX, deltaY) => {
    const pos = windowManager?.getCharacterPosition();
    if (pos) {
      windowManager?.setCharacterPosition(pos.x + deltaX, pos.y + deltaY);
    }
  });
  ipcMain.handle('character:setSize', (_, width, height) => {
    windowManager?.setCharacterSize(width, height);
    return { width, height };
  });

  ipcMain.handle('character:setPosition', (_, x, y) => {
    windowManager?.setCharacterPosition(x, y);
    return { x, y };
  });

  ipcMain.handle('character:getPosition', () => {
    return windowManager?.getCharacterPosition() || { x: 0, y: 0, width: 0, height: 0 };
  });

  // Window detection control
  ipcMain.handle('window:toggleDetection', (_, enable) => {
    if (enable) {
      windowManager?.startWindowDetection();
    } else {
      windowManager?.stopWindowDetection();
    }
    return enable;
  });

  // Character position for gravity/physics
  ipcMain.handle('window:getCharacterPosition', () => {
    return windowManager?.getCharacterPosition() || { x: 0, y: 0 };
  });

  // Mouse tracking for cursor follow (returns dummy success - actual tracking is client-side)
  ipcMain.handle('mouse:startTracking', () => {
    // Mouse tracking is handled client-side via mousemove events
    // This is just a no-op to prevent IPC errors
    return true;
  });

  ipcMain.handle('mouse:stopTracking', () => {
    return true;
  });

  // Gravity physics controls
  let gravityEnabled = false;
  ipcMain.handle('character:toggleGravity', (_, enable) => {
    gravityEnabled = enable ?? !gravityEnabled;
    // Gravity is handled client-side, just track state
    windowManager?.sendToCharacter('gravity:state', gravityEnabled);
    return gravityEnabled;
  });
  ipcMain.handle('character:jump', () => {
    windowManager?.sendToCharacter('character:jump');
  });

  ipcMain.handle('character:toggleGame', (_, enable) => {
    windowManager?.sendToCharacter('game:toggle', enable);
    return enable;
  });

  // System controls
  ipcMain.handle('system:getVolume', () => systemBridge?.getVolume());
  ipcMain.handle('system:setVolume', (_, level) => systemBridge?.setVolume(level));
  ipcMain.handle('system:getBrightness', () => systemBridge?.getBrightness());
  ipcMain.handle('system:setBrightness', (_, level) => systemBridge?.setBrightness(level));
  ipcMain.handle('system:launchApp', (_, appPath) => systemBridge?.launchApp(appPath));
  ipcMain.handle('system:getSystemInfo', () => systemBridge?.getSystemInfo());

  // Persona controls - broadcast to both windows
  ipcMain.handle('persona:getActive', () => personaManager?.getActivePersona());
  ipcMain.handle('persona:setActive', (_, personaId) => {
    const result = personaManager?.setActivePersona(personaId);
    windowManager?.broadcast('avatar:persona', personaId);
    return result;
  });
  ipcMain.handle('persona:getAll', () => personaManager?.getAllPersonas());
  ipcMain.handle('persona:getState', () => personalityCore?.getState());
  ipcMain.handle('persona:updateMood', (_, mood) => {
    personalityCore?.setMood(mood);
    windowManager?.sendToCharacter('avatar:mood', mood);
  });

  // Memory
  ipcMain.handle('memory:getHistory', (_, limit) => memoryService?.getHistory(limit));
  ipcMain.handle('memory:search', (_, query) => memoryService?.search(query));
  ipcMain.handle('memory:addEntry', (_, entry) => memoryService?.addEntry(entry));
  ipcMain.handle('memory:getUserPreferences', () => memoryService?.getUserPreferences());
  ipcMain.handle('memory:setUserPreferences', (_, prefs) => memoryService?.setUserPreferences(prefs));

  // AI Chat - send state updates to character window
  ipcMain.handle('ai:chat', async (_, message) => {
    // Update character state: thinking
    windowManager?.sendToCharacter('avatar:state', { isThinking: true, isSpeaking: false });

    // Use NizhalAI for emotional processing
    const result = await nizhalAI?.process(message);
    const response = result.text;

    // Legacy integration (if needed for personalityCore metrics)
    personalityCore?.processInteraction(message, response);

    // Update character state: speaking
    windowManager?.sendToCharacter('avatar:state', { isThinking: false, isSpeaking: true });

    // Reset after delay (voice service will handle actual timing)
    setTimeout(() => {
      windowManager?.sendToCharacter('avatar:state', { isSpeaking: false });
    }, 3000);

    return response;
  });
  ipcMain.handle('ai:setProvider', (_, provider, config) => aiService?.setProvider(provider, config));
  ipcMain.handle('ai:getProviders', () => aiService?.getAvailableProviders());
  ipcMain.handle('ai:getProviderStatus', () => {
    if (aiService && typeof aiService.getProviderStatus === 'function') {
      return aiService.getProviderStatus();
    }
    console.error('[Main] ❌ Critical: aiService.getProviderStatus is missing.');
    return {
      currentProvider: 'none',
      ollamaAvailable: false,
      fallbackEnabled: false
    };
  });
  ipcMain.handle('ai:checkLocalAI', () => aiService?.checkOllamaAvailability());
  ipcMain.handle('ai:setProviderOrder', (_, order) => aiService?.setProviderOrder(order));
  ipcMain.handle('ai:setFallbackEnabled', (_, enabled) => aiService?.setFallbackEnabled(enabled));
  ipcMain.handle('ai:getModels', () => aiService?.getAvailableModels());
  ipcMain.handle('ai:setModel', (_, providerId, modelId) => aiService?.setModel(providerId, modelId));

  // New enhanced AI handlers
  ipcMain.handle('ai:refresh', () => aiService?.refreshProviders());
  ipcMain.handle('ai:test', (_, providerId) => aiService?.testProvider(providerId));
  ipcMain.handle('ai:clearContext', () => {
    aiService?.clearContext();
    return { success: true };
  });
  ipcMain.handle('ai:streamChat', async (_, message) => {
    // For streaming, we return the full response after completion
    // Real-time streaming would require a different IPC approach
    let fullResponse = '';
    try {
      await aiService?.streamChat(message, (chunk) => {
        fullResponse += chunk;
        // Optionally broadcast chunks to renderer
        windowManager?.broadcast('ai:chunk', chunk);
      });
      return { success: true, response: fullResponse };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('system:getStats', () => systemStatsService.getStats());

  // Enhanced Security: Ephemeral Tokens for Client-Side Gemini
  ipcMain.handle('ai:getEphemeralToken', async () => {
    // Return a proxy to the API key for local dev usage
    // In production, this would call an endpoint to get a short-lived token
    // For now, we'll return the key but log a warning
    // This allows the client to use the Google GenAI SDK directly
    if (!process.env.GEMINI_API_KEY) {
      return { success: false, error: 'GEMINI_API_KEY not found in .env' };
    }
    return { success: true, token: process.env.GEMINI_API_KEY };
  });

  // Voice
  ipcMain.handle('voice:speak', async (_, text, options) => {
    windowManager?.sendToCharacter('avatar:state', { isSpeaking: true });
    const result = await voiceService?.speak(text, options);
    windowManager?.sendToCharacter('avatar:state', { isSpeaking: false });
    return result;
  });
  ipcMain.handle('voice:stop', () => {
    windowManager?.sendToCharacter('avatar:state', { isSpeaking: false });
    return voiceService?.stop();
  });
  ipcMain.handle('voice:getVoices', () => voiceService?.getVoices());
  ipcMain.handle('voice:setVoice', (_, voiceId) => voiceService?.setVoice(voiceId));

  // Payment
  ipcMain.handle('payment:checkout', async (_, productId, gateway) => {
    return await paymentService?.initiateCheckout(productId, gateway, windowManager?.chatWindow);
  });
  ipcMain.handle('payment:verify', (_, paymentId, gateway) => paymentService?.verifyPayment(paymentId, gateway));

  // License
  ipcMain.handle('license:check', (_, personaId) => licenseService?.isUnlocked(personaId));
  ipcMain.handle('license:unlock', (_, personaId, licenseKey) => licenseService?.unlock(personaId, licenseKey));
  ipcMain.handle('license:getUnlocked', () => licenseService?.getUnlockedPersonas());

  // Marketplace
  ipcMain.handle('marketplace:getPersonas', () => personaMarketplace?.fetchAvailablePersonas());
  ipcMain.handle('marketplace:purchase', (_, personaId, gateway) => personaMarketplace?.purchasePersona(personaId, gateway, windowManager?.chatWindow));
  ipcMain.handle('marketplace:download', (_, personaId) => personaMarketplace?.downloadPersona(personaId));

  // Onboarding
  ipcMain.handle('onboarding:complete', async (_, data) => {
    // Save onboarding data to preferences
    const prefs = await memoryService?.getUserPreferences() || {};
    prefs.onboardingComplete = true;
    prefs.onboardingData = data;
    await memoryService?.setUserPreferences(prefs);
    return true;
  });

  // Avatar speak (for proactive notifications)
  ipcMain.handle('avatar:speak', (_, message) => {
    windowManager?.sendToCharacter('avatar:speak', message);
    return true;
  });

  // LiveKit - Voice Connection
  ipcMain.handle('livekit:connect', async (_, userName, roomName) => {
    if (!livekitService?.isConfigured()) {
      return { success: false, error: 'LiveKit not configured' };
    }

    try {
      // Get token for specific room or auto-generated one
      const tokenData = await livekitService.getUserRoomToken(userName, currentPersonality, roomName);

      // Start agent if not running
      if (agentManager && !agentManager.getStatus().isRunning) {
        await agentManager.start(currentPersonality, tokenData.roomName);
      }

      return { success: true, ...tokenData };
    } catch (error) {
      console.error('[LiveKit] Connection failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('livekit:disconnect', async () => {
    // Just return success, room will auto-cleanup
    // Keep agent running for next connection
    return { success: true };
  });

  ipcMain.handle('livekit:getStatus', () => {
    return {
      configured: livekitService?.isConfigured() || false,
      agent: agentManager?.getStatus() || null
    };
  });

  // LiveKit - Agent Management
  ipcMain.handle('livekit:startAgent', async (_, personality, roomName) => {
    if (!agentManager) {
      return { success: false, error: 'Agent manager not initialized' };
    }
    return await agentManager.start(personality || currentPersonality, roomName);
  });

  ipcMain.handle('livekit:stopAgent', async () => {
    if (!agentManager) return { success: true };
    return await agentManager.stop();
  });

  ipcMain.handle('livekit:restartAgent', async (_, personality) => {
    if (!agentManager) {
      return { success: false, error: 'Agent manager not initialized' };
    }
    return await agentManager.restart(personality || currentPersonality);
  });

  ipcMain.handle('livekit:updatePersonality', async (_, newPersonality) => {
    currentPersonality = newPersonality;
    if (agentManager) {
      return await agentManager.updatePersonality(newPersonality);
    }
    return { success: true };
  });

  // Android Control (ADB)
  ipcMain.handle('adb:check', () => adbControl.checkADBInstalled());
  ipcMain.handle('adb:connect', (_, ip, port) => adbControl.connect(ip, port));
  ipcMain.handle('adb:disconnect', () => adbControl.disconnect());
  ipcMain.handle('adb:getDevices', () => adbControl.getDevices());
  ipcMain.handle('adb:tap', (_, x, y) => adbControl.tap(x, y));
  ipcMain.handle('adb:swipe', (_, x1, y1, x2, y2, d) => adbControl.swipe(x1, y1, x2, y2, d));
  ipcMain.handle('adb:type', (_, text) => adbControl.typeText(text));
  ipcMain.handle('adb:key', (_, code) => adbControl.sendKeyEvent(code));
  ipcMain.handle('adb:home', () => adbControl.pressHome());
  ipcMain.handle('adb:back', () => adbControl.pressBack());
  ipcMain.handle('adb:launch', (_, pkg) => adbControl.launchApp(pkg));
  ipcMain.handle('adb:close', (_, pkg) => adbControl.closeApp(pkg));
  ipcMain.handle('adb:screenshot', async () => {
    // Generate temp path
    const tmpPath = path.join(app.getPath('temp'), `adb-screen-${Date.now()}.png`);
    const result = await adbControl.takeScreenshot(tmpPath);
    if (result.success) {
      // Return file:// URL for renderer
      return { success: true, url: `file://${tmpPath.replace(/\\/g, '/')}` };
    }
    return result;
  });
  ipcMain.handle('adb:info', () => adbControl.getDeviceInfo());

  // App
  ipcMain.handle('app:getTheme', () => nativeTheme.shouldUseDarkColors ? 'dark' : 'light');
  ipcMain.handle('app:openExternal', (_, url) => shell.openExternal(url));
  ipcMain.handle('app:getVersion', () => app.getVersion());
  ipcMain.handle('navigate', (_, route) => windowManager?.sendToChat('navigate', route));

  // Performance optimization handlers
  ipcMain.handle('system:getPerformanceMode', () => ({
    isLowEnd: isLowEndMode,
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage()
  }));
  
  ipcMain.handle('system:triggerCleanup', () => {
    if (global.gc) {
      global.gc();
      return { success: true, message: 'Garbage collection triggered' };
    }
    return { success: false, message: 'GC not available' };
  });

  // User attachment service handlers
  ipcMain.handle('attachment:trackInteraction', (_, type, content, sentiment) => {
    userAttachmentService?.trackInteraction(type, content, sentiment);
  });

  ipcMain.handle('attachment:getPersonalizedGreeting', () => {
    return userAttachmentService?.getPersonalizedGreeting() || 'Hello!';
  });

  ipcMain.handle('attachment:getContextualSuggestions', (_, userInput) => {
    return userAttachmentService?.getContextualSuggestions(userInput) || [];
  });

  ipcMain.handle('attachment:getInsights', () => {
    return userAttachmentService?.getAttachmentInsights() || {};
  });

  ipcMain.handle('attachment:setPreference', (_, key, value) => {
    userAttachmentService?.setUserPreference(key, value);
  });

  ipcMain.handle('attachment:getPreference', (_, key, defaultValue) => {
    return userAttachmentService?.getUserPreference(key, defaultValue);
  });

  ipcMain.handle('attachment:addActivity', (_, activity) => {
    userAttachmentService?.addActivityToContext(activity);
  });

ipcMain.handle('attachment:personalizeResponse', (_, baseResponse, context) => {
  return userAttachmentService?.generatePersonalizedResponse(baseResponse, context) || baseResponse;
});

// Advanced Voice Service handlers
ipcMain.handle('voice:analyzeEmotion', async (_, audioBuffer) => {
  return await advancedVoiceService?.analyzeAudioEmotion(audioBuffer);
});

ipcMain.handle('voice:recordForCloning', async (_, duration) => {
  return await advancedVoiceService?.recordForVoiceCloning(duration);
});

ipcMain.handle('voice:createVoiceProfile', async (_, name, audioBuffer, options) => {
  return await advancedVoiceService?.createVoiceProfile(name, audioBuffer, options);
});

ipcMain.handle('voice:synthesizeWithClonedVoice', async (_, text, profileId, emotion) => {
  return await advancedVoiceService?.synthesizeWithClonedVoice(text, profileId, emotion);
});

ipcMain.handle('voice:getVoiceProfiles', () => {
  return advancedVoiceService?.getVoiceProfiles() || [];
});

// Smart Home Service handlers
ipcMain.handle('smarthome:connectProvider', async (_, providerId, config) => {
  return await smartHomeService?.connectProvider(providerId, config);
});

ipcMain.handle('smarthome:discoverDevices', async (_, providerId) => {
  return await smartHomeService?.discoverDevices(providerId);
});

ipcMain.handle('smarthome:controlDevice', async (_, deviceId, action, value) => {
  return await smartHomeService?.controlDevice(deviceId, action, value);
});

ipcMain.handle('smarthome:getAllDevices', () => {
  return smartHomeService?.getAllDevices() || [];
});

ipcMain.handle('smarthome:createScene', async (_, name, deviceStates) => {
  return await smartHomeService?.createScene(name, deviceStates);
});

ipcMain.handle('smarthome:activateScene', async (_, sceneId) => {
  return await smartHomeService?.activateScene(sceneId);
});

// Translation Service handlers
ipcMain.handle('translation:translate', async (_, text, targetLanguage, sourceLanguage) => {
  return await translationService?.translate(text, targetLanguage, sourceLanguage);
});

ipcMain.handle('translation:detectLanguage', async (_, text) => {
  return await translationService?.detectLanguage(text);
});

ipcMain.handle('translation:getSupportedLanguages', () => {
  return translationService?.getSupportedLanguages() || [];
});

ipcMain.handle('translation:setTargetLanguage', (_, language) => {
  translationService?.setTargetLanguage(language);
});

// Advanced Personality Core handlers
ipcMain.handle('personality:processInteraction', (_, input, context) => {
  return advancedPersonalityCore?.processInteraction(input, context);
});

ipcMain.handle('personality:getCurrentMood', () => {
  return advancedPersonalityCore?.getCurrentMood();
});

ipcMain.handle('personality:getEmotionalState', () => {
  return advancedPersonalityCore?.getEmotionalState();
});

ipcMain.handle('personality:setTraits', (_, traits) => {
  advancedPersonalityCore?.setTraits(traits);
});

ipcMain.handle('personality:getPersonalityProfile', () => {
  return advancedPersonalityCore?.getPersonalityProfile();
});

// Security Service handlers
ipcMain.handle('security:authenticate', async (_, credentials, options) => {
  return await securityService?.authenticateUser(credentials, options);
});

ipcMain.handle('security:encryptData', async (_, data) => {
  return await securityService?.encryptData(data);
});

ipcMain.handle('security:decryptData', async (_, encryptedData) => {
  return await securityService?.decryptData(encryptedData);
});

ipcMain.handle('security:setSecurityLevel', (_, level) => {
  securityService?.setSecurityLevel(level);
});

ipcMain.handle('security:getSecurityStatus', () => {
  return securityService?.getSecurityStatus();
});

ipcMain.handle('security:getThreatReport', () => {
  return securityService?.getThreatReport();
});

// Collaboration Service handlers
ipcMain.handle('collaboration:startScreenSharing', async (_, options) => {
  return await collaborationService?.startScreenSharing(options);
});

ipcMain.handle('collaboration:stopScreenSharing', async () => {
  return await collaborationService?.stopScreenSharing();
});

ipcMain.handle('collaboration:joinSession', async (_, sessionId, options) => {
  return await collaborationService?.joinSession(sessionId, options);
});

ipcMain.handle('collaboration:startWhiteboard', async () => {
  return await collaborationService?.startWhiteboard();
});

ipcMain.handle('collaboration:startVoiceChat', async () => {
  return await collaborationService?.startVoiceChat();
});

ipcMain.handle('collaboration:shareFile', async (_, file) => {
  return await collaborationService?.shareFile(file);
});

// Gesture Recognition Service handlers
ipcMain.handle('gesture:startTracking', async (_, videoElement, canvasElement) => {
  return await gestureRecognitionService?.startTracking(videoElement, canvasElement);
});

ipcMain.handle('gesture:stopTracking', async () => {
  return await gestureRecognitionService?.stopTracking();
});

ipcMain.handle('gesture:getCurrentState', () => {
  return gestureRecognitionService?.getCurrentState();
});

ipcMain.handle('gesture:getGestureHistory', (_, limit) => {
return gestureRecognitionService?.getGestureHistory(limit);
});

ipcMain.handle('gesture:getStatistics', () => {
return gestureRecognitionService?.getGestureStatistics();
});

// Humor Engine handlers
ipcMain.handle('humor:generateHumor', (_, context, userInput) => {
return humorEngine?.generateHumor(context, userInput);
});

ipcMain.handle('humor:updatePreferences', (_, preferences) => {
humorEngine?.updatePreferences(preferences);
});

ipcMain.handle('humor:getStatistics', () => {
return humorEngine?.getStatistics();
});

ipcMain.handle('humor:getSuggestions', (_, context) => {
return humorEngine?.getHumorSuggestions(context);
});

// Helpful Assistant handlers
ipcMain.handle('assistant:processRequest', async (_, request, context) => {
return await helpfulAssistant?.processRequest(request, context);
});

ipcMain.handle('assistant:updatePreferences', (_, preferences) => {
helpfulAssistant?.updatePreferences(preferences);
});

ipcMain.handle('assistant:getStatistics', () => {
return helpfulAssistant?.getStatistics();
});

// Security Auditor handlers
ipcMain.handle('security:audit', async () => {
return await securityAuditor?.conductSecurityAudit();
});

ipcMain.handle('security:fixVulnerabilities', async () => {
return await securityAuditor?.fixVulnerabilities();
});

ipcMain.handle('security:getDashboard', () => {
    return securityAuditor?.getSecurityDashboard();
  });

  // Settings Manager handlers
  ipcMain.handle('settings:get', (_, category, key) => {
    return settingsManager?.get(category, key);
  });

  ipcMain.handle('settings:getCategory', (_, category) => {
    return settingsManager?.getCategory(category);
  });

  ipcMain.handle('settings:set', async (_, category, key, value) => {
    await settingsManager?.set(category, key, value);
    await applySettingsToServices(); // Reapply settings after change
  });

  ipcMain.handle('settings:setCategory', async (_, category, settings) => {
    await settingsManager?.setCategory(category, settings);
    await applySettingsToServices(); // Reapply settings after change
  });

  ipcMain.handle('settings:getSchema', () => {
    return settingsManager?.getSettingsSchema();
  });

  ipcMain.handle('settings:getAll', () => {
    return settingsManager?.getAllSettings();
  });

  ipcMain.handle('settings:export', () => {
    return settingsManager?.exportSettings();
  });

  ipcMain.handle('settings:import', async (_, data) => {
    await settingsManager?.importSettings(data);
    await applySettingsToServices(); // Reapply settings after import
  });

  ipcMain.handle('settings:reset', async (_, category, key) => {
    await settingsManager?.reset(category, key);
    await applySettingsToServices(); // Reapply settings after reset
  });

  ipcMain.handle('settings:resetCategory', async (_, category) => {
    await settingsManager?.resetCategory(category);
    await applySettingsToServices(); // Reapply settings after reset
  });

  ipcMain.handle('settings:resetAll', async () => {
    await settingsManager?.resetAll();
    await applySettingsToServices(); // Reapply settings after reset
  });

  ipcMain.handle('settings:search', (_, query) => {
    return settingsManager?.searchSettings(query);
  });

  ipcMain.handle('settings:getSummary', () => {
    return settingsManager?.getSettingsSummary();
  });

  ipcMain.handle('settings:addListener', (_, category, key) => {
    // Return a listener ID for the renderer to track
    const listenerId = `${category}_${key}_${Date.now()}`;
    settingsManager?.addListener(category, key, (newValue, oldValue) => {
      // Notify renderer of setting change
      windowManager?.sendToChat('setting-changed', {
        category,
        key,
        newValue,
        oldValue,
        listenerId
      });
    });
    return listenerId;
  });
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
app.quit();
} else {
app.on('second-instance', (event, commandLine, workingDirectory) => {
// Focus chat window on second instance
windowManager?.showChatWindow();
    // Focus chat window on second instance
    windowManager?.showChatWindow();

    // Handle deep linking
    const url = commandLine.find(arg => arg.startsWith('nizhal://'));
    if (url) {
      console.log('Received deep link:', url);
      windowManager?.sendToChat('deep-link', url);
    }
  });

  app.whenReady().then(async () => {
    try {
      console.log('[Main] App ready. Setting up security...');
      setupSecurityPolicy();

      console.log('[Main] Initializing services...');
      await initializeServices();
      console.log('[Main] Services initialized.');

      console.log('[Main] Setting up IPC...');
      setupIPC(); // Setup IPC before creating windows to prevent race conditions
      console.log('[Main] IPC registered.');

      console.log('[Main] Creating windows...');
      await createWindows();
      console.log('[Main] Windows created.');

      // Register Alt key toggle for character window click-through
      // Note: Electron can't capture raw Alt key, so we use Alt+Space as trigger
      // and a polling mechanism for raw Alt detection
      let isAltInteractionEnabled = false;

      // Use Alt+Space to toggle interaction mode
      globalShortcut.register('Alt+Space', () => {
        isAltInteractionEnabled = !isAltInteractionEnabled;
        windowManager?.setCharacterClickThrough(!isAltInteractionEnabled);
        windowManager?.sendToCharacter('character:interactionToggle', isAltInteractionEnabled);
        console.log(`[Main] Alt+Space - Click-through: ${!isAltInteractionEnabled}`);
      });

      // Alternative: Use Ctrl+Alt for toggle (easier to press)
      globalShortcut.register('CommandOrControl+Alt+I', () => {
        isAltInteractionEnabled = !isAltInteractionEnabled;
        windowManager?.setCharacterClickThrough(!isAltInteractionEnabled);
        windowManager?.sendToCharacter('character:interactionToggle', isAltInteractionEnabled);
        console.log(`[Main] Ctrl+Alt+I - Click-through: ${!isAltInteractionEnabled}`);
      });

      if (process.defaultApp) {
        if (process.argv.length >= 2) {
          app.setAsDefaultProtocolClient('nizhal', process.execPath, [path.resolve(process.argv[1])]);
        }
      } else {
        app.setAsDefaultProtocolClient('nizhal');
      }

      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          createWindow();
        }
      });
    } catch (error) {
      console.error('[Main] Critical Initialization Error:', error);
    }
  });
}

// Unregister shortcuts and cleanup on quit
app.on('will-quit', async () => {
  // Stop resource monitoring
  if (resourceMonitorInterval) {
    clearInterval(resourceMonitorInterval);
  }
  
  // Release power save blocker
  if (powerSaveBlockerId !== null) {
    powerSaveBlocker.stop(powerSaveBlockerId);
  }
  
  // Stop AI agent
  if (agentManager) {
    await agentManager.stop();
  }
  // Cleanup LiveKit rooms
  if (livekitService) {
    await livekitService.cleanup();
  }
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
