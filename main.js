import { app, BrowserWindow, ipcMain, shell, nativeTheme } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { MultiWindowManager } from './src/electron/MultiWindowManager.js';
import { createSystemBridge } from './src/electron/bridge.js';
import { PersonalityCore } from './src/core/PersonalityCore.js';
import { PersonaManager } from './src/core/PersonaManager.js';
import { MemoryService } from './src/core/MemoryService.js';
import { AIService } from './src/services/AIService.js';
import { VoiceService } from './src/services/VoiceService.js';
import { PaymentService } from './src/services/PaymentService.js';
import { LicenseService } from './src/services/LicenseService.js';
import { PersonaMarketplace } from './src/services/PersonaMarketplace.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Window manager for dual-window architecture
let windowManager = null;
let systemBridge = null;
let personalityCore = null;
let personaManager = null;
let memoryService = null;
let aiService = null;
let voiceService = null;
let paymentService = null;
let licenseService = null;
let personaMarketplace = null;

async function initializeServices() {
  personalityCore = new PersonalityCore();
  memoryService = new MemoryService(app.getPath('userData'));
  await memoryService.initialize();

  personaManager = new PersonaManager(personalityCore);
  licenseService = new LicenseService(app.getPath('userData'));
  await licenseService.initialize();

  aiService = new AIService(personaManager, memoryService);
  voiceService = new VoiceService();
  paymentService = new PaymentService();
  personaMarketplace = new PersonaMarketplace(licenseService, paymentService);
}

function setupSecurityPolicy() {
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

async function createWindows() {
  const preloadPath = path.join(__dirname, 'preload.js');

  // Initialize multi-window manager
  windowManager = new MultiWindowManager(isDev);

  // Create character overlay window
  await windowManager.createCharacterWindow(preloadPath);

  // Create chat window (hidden by default)
  await windowManager.createChatWindow(preloadPath);

  // Create system tray
  const iconPath = path.join(__dirname, 'assets', 'icon.png');
  windowManager.createTray(iconPath);

  // Open dev tools in development
  if (isDev) {
    windowManager.chatWindow?.webContents.openDevTools({ mode: 'detach' });
  }

  systemBridge = createSystemBridge();
}

function setupIPC() {
  // Window controls for chat window
  ipcMain.handle('window:minimize', () => windowManager?.hideChatWindow());
  ipcMain.handle('window:maximize', () => { }); // Not needed for frameless
  ipcMain.handle('window:close', () => windowManager?.hideChatWindow());
  ipcMain.handle('window:showChat', () => windowManager?.showChatWindow());
  ipcMain.handle('window:hideChat', () => windowManager?.hideChatWindow());

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
    // Send model change to character window
    windowManager?.sendToCharacter('character:modelChanged', modelId);
    return modelId;
  });
  ipcMain.handle('window:moveCharacter', (_, deltaX, deltaY) => {
    const pos = windowManager?.getCharacterPosition();
    if (pos) {
      windowManager?.setCharacterPosition(pos.x + deltaX, pos.y + deltaY);
    }
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

    const response = await aiService?.chat(message);
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
  ipcMain.handle('ai:getProviderStatus', () => aiService?.getProviderStatus());
  ipcMain.handle('ai:checkLocalAI', () => aiService?.checkOllamaAvailability());
  ipcMain.handle('ai:setProviderOrder', (_, order) => aiService?.setProviderOrder(order));
  ipcMain.handle('ai:setFallbackEnabled', (_, enabled) => aiService?.setFallbackEnabled(enabled));
  ipcMain.handle('ai:getModels', () => aiService?.getAvailableModels());

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

  // App
  ipcMain.handle('app:getTheme', () => nativeTheme.shouldUseDarkColors ? 'dark' : 'light');
  ipcMain.handle('app:openExternal', (_, url) => shell.openExternal(url));
  ipcMain.handle('app:getVersion', () => app.getVersion());
  ipcMain.handle('navigate', (_, route) => windowManager?.sendToChat('navigate', route));
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
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
