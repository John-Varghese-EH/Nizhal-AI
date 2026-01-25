# Technical Documentation
## Nizhal AI - Desktop Companion

**Version:** 1.0.0  
**Last Updated:** January 22, 2026  
**Engineering Lead:** Nizhal AI Team  

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Core Systems](#core-systems)
5. [API Reference](#api-reference)
6. [Build & Deployment](#build--deployment)
7. [Performance](#performance)
8. [Security](#security)
9. [Testing Strategy](#testing-strategy)
10. [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture Overview

### System Architecture Diagram

```mermaid
graph TB
    subgraph "Electron Main Process"
        Main[main.js]
        WindowMgr[MultiWindowManager]
        Bridge[SystemBridge]
        
        Main --> WindowMgr
        Main --> Bridge
    end
    
    subgraph "Core Services"
        Personality[PersonalityCore]
        PersonaMgr[PersonaManager]
        Memory[MemoryService]
        AppState[AppStateService]
        NizhalAI[NizhalAI]
        
        PersonaMgr --> Personality
        NizhalAI --> Personality
        NizhalAI --> AppState
    end
    
    subgraph "AI & Voice"
        AIService[AIService]
        VoiceService[VoiceService]
        
        AIService --> PersonaMgr
        AIService --> Memory
    end
    
    subgraph "Marketplace"
        Payment[PaymentService]
        License[LicenseService]
        Marketplace[PersonaMarketplace]
        
        Marketplace --> License
        Marketplace --> Payment
    end
    
    subgraph "Renderer Processes"
        CharWindow[Character Window<br/>Transparent Overlay]
        ChatWindow[Chat Window<br/>Main UI]
    end
    
    Main --> Personality
    Main --> PersonaMgr
    Main --> Memory
    Main --> AIService
    Main --> VoiceService
    Main --> Marketplace
    
    Main -.IPC.-> CharWindow
    Main -.IPC.-> ChatWindow
    
    CharWindow --> VRM[VRM Avatar]
    CharWindow --> Orb[Companion Orb]
    CharWindow --> HUD[Jarvis HUD]
```

### Multi-Process Architecture

Nizhal AI uses Electron's multi-process architecture:

**Main Process** (`main.js`)
- Window management
- IPC communication
- Service initialization
- System-level operations

**Renderer Processes**
1. **Character Window**: Transparent overlay with 3D/visual rendering
2. **Chat Window**: Standard windowed interface with React UI

**Preload Script** (`preload.js`)
- Secure context bridge
- IPC exposure to renderer
- API validation

---

## 🛠️ Technology Stack

### Core Framework
- **Electron 33.x**: Desktop application framework
- **Node.js 20+**: JavaScript runtime
- **Vite 6.x**: Build tool and dev server

### Frontend
- **React 18.3**: UI library
- **React Router 7.x**: Navigation
- **Tailwind CSS 3.4**: Utility-first styling
- **Framer Motion 11.x**: Animation library

### 3D Graphics
- **Three.js 0.172**: 3D rendering engine
- **@react-three/fiber 8.17**: React renderer for Three.js
- **@react-three/drei 10.7**: Helper components
- **@pixiv/three-vrm 3.4**: VRM model support

### AI & ML
- **Ollama**: Local AI inference (default)
- **@google/generative-ai 0.21**: Gemini API client
- **OpenAI SDK**: GPT models (optional)
- **Anthropic SDK**: Claude models (optional)

### Voice & Audio
- **Web Speech API**: Browser-native TTS/STT
- **ElevenLabs API**: Premium voice synthesis
- **loudness**: System volume control

### Payments & Licensing
- **Stripe 17.x**: International payments
- **Razorpay 2.9**: Indian market payments
- **crypto (Node.js)**: License encryption

### Utilities
- **electron-store 10.x**: Persistent data storage
- **uuid 11.x**: Unique identifier generation
- **dotenv 17.x**: Environment variables
- **html-to-image 1.11**: Screenshot capture

---

## 📁 Project Structure

```
nizhal-ai/
├── main.js                          # Electron main process entry
├── preload.js                       # Secure IPC bridge
├── package.json                     # Dependencies & scripts
├── vite.config.js                   # Build configuration
├── tailwind.config.js               # Styling system
│
├── src/
│   ├── core/                        # Core business logic
│   │   ├── PersonalityCore.js       # Emotional state machine
│   │   ├── PersonaManager.js        # Persona templates & switching
│   │   ├── MemoryService.js         # JSON-RAG memory system
│   │   ├── AppStateService.js       # Centralized state sync
│   │   └── NizhalAI.js              # Main AI orchestrator
│   │
│   ├── electron/                    # Electron-specific code
│   │   ├── MultiWindowManager.js    # Dual-window management
│   │   ├── bridge.js                # System control bridge
│   │   └── windowDetection.js       # Active window tracking
│   │
│   ├── services/                    # External integrations
│   │   ├── AIService.js             # Multi-provider AI
│   │   ├── VoiceService.js          # TTS/STT
│   │   ├── PaymentService.js        # Stripe + Razorpay
│   │   ├── LicenseService.js        # Encrypted licenses
│   │   └── PersonaMarketplace.js    # Persona store
│   │
│   └── renderer/                    # React UI components
│       ├── App.jsx                  # Main app component
│       ├── main.jsx                 # React entry point
│       │
│       ├── components/
│       │   ├── chat/
│       │   │   ├── ChatView.jsx
│       │   │   ├── MessageBubble.jsx
│       │   │   └── InputBox.jsx
│       │   │
│       │   ├── settings/
│       │   │   ├── SettingsView.jsx
│       │   │   ├── AISettings.jsx
│       │   │   └── PersonaSettings.jsx
│       │   │
│       │   ├── marketplace/
│       │   │   ├── Marketplace.jsx
│       │   │   └── PersonaCard.jsx
│       │   │
│       │   └── avatar/
│       │       ├── Model3DAvatar.jsx     # VRM renderer
│       │       ├── CompanionOrb.jsx      # Orb visualization
│       │       └── JarvisHUD.jsx         # Holographic HUD
│       │
│       ├── characterWindow/
│       │   ├── CharacterApp.jsx
│       │   ├── BootSequence.jsx
│       │   └── InteractionLayer.jsx
│       │
│       └── styles/
│           └── globals.css               # Global styles
│
├── public/                          # Static assets
│   ├── personas/                    # Persona avatars
│   ├── models/                      # VRM files
│   └── sounds/                      # Audio assets
│
├── assets/                          # Build assets
│   ├── icon.png
│   ├── icon.ico
│   └── icon.icns
│
├── build/                           # Build configuration
│   └── entitlements.mac.plist
│
├── dist/                            # Vite build output
├── dist-electron/                   # Electron build output
│
└── docs/                            # Documentation
    ├── PRD.md
    ├── Design-Doc.md
    └── Tech-Doc.md                  # This file
```

---

## 🧠 Core Systems

### 1. PersonalityCore

**Purpose**: Manages emotional state, mood, and relationship dynamics.

**Key Features**:
- Affection, Trust, Professionalism metrics (0-100)
- Energy system with decay/recovery
- Mood transitions (Happy, Neutral, Concerned, etc.)
- Sentiment analysis for interactions

**API**:
```javascript
const personality = new PersonalityCore(initialState);

// Get current state
const state = personality.getState();
// { affection: 50, trust: 30, professionalism: 70, mood: 'neutral', energy: 100 }

// Process interaction
personality.processInteraction(userMessage, aiResponse);

// Manual mood change
personality.setMood(Mood.HAPPY);

// Serialize/deserialize
const saved = personality.serialize();
const restored = PersonalityCore.deserialize(saved);
```

**Decay Mechanism**:
- Every 60 seconds, checks time since last interaction
- If inactive > 24h, affection decreases
- Energy drains during active use, recovers when idle

---

### 2. PersonaManager

**Purpose**: Manages persona templates and switching.

**Persona Structure**:
```javascript
{
  id: 'kavya',
  name: 'Kavya',
  displayName: 'Kavya',
  type: 'friend',
  gender: 'female',
  language: 'manglish',
  
  personality: {
    formality: 'casual',
    energy: 'warm',
    traits: ['caring', 'friendly', 'supportive']
  },
  
  systemPrompt: `You are Kavya, a caring friend from Kerala...`,
  
  voice: {
    provider: 'web',
    voiceId: 'Google हिन्दी',
    pitch: 1.1,
    rate: 1.0
  },
  
  visual: {
    defaultMode: 'orb',
    colors: { primary: '#ec4899', secondary: '#f97316' }
  },
  
  locked: false,
  price: 0
}
```

**API**:
```javascript
const manager = new PersonaManager(personalityCore);

// Get active persona
const active = manager.getActivePersona();

// Switch persona
manager.setActivePersona('naruto');

// Get system prompt for AI
const prompt = manager.getSystemPrompt();
```

---

### 3. MemoryService

**Purpose**: JSON-based RAG system for conversation history and context.

**Storage Structure**:
```javascript
// userData/memory/conversations.json
{
  "sessions": [
    {
      "id": "uuid-1",
      "timestamp": 1706000000000,
      "messages": [
        { "role": "user", "content": "Hello", "timestamp": 1706000000000 },
        { "role": "assistant", "content": "Hi!", "timestamp": 1706000001000 }
      ],
      "persona": "kavya",
      "mood": "happy"
    }
  ],
  "userPreferences": {
    "privacyMode": false,
    "theme": "dark",
    "favoritePersona": "kavya"
  }
}
```

**API**:
```javascript
const memory = new MemoryService(userDataPath);
await memory.initialize();

// Add conversation entry
await memory.addEntry({
  role: 'user',
  content: 'How are you?',
  metadata: { persona: 'kavya', mood: 'happy' }
});

// Get recent history
const history = await memory.getHistory(20); // Last 20 messages

// Semantic search (basic keyword matching)
const results = await memory.search('birthday');

// User preferences
const prefs = await memory.getUserPreferences();
await memory.setUserPreferences({ privacyMode: true });
```

---

### 4. AIService

**Purpose**: Multi-provider AI inference with automatic fallback.

**Provider Priority**:
1. Ollama (local, privacy-first)
2. Gemini (cloud, low-end devices)
3. OpenAI (optional)
4. Anthropic (optional)

**Provider Selection Logic**:
```javascript
async selectBestProvider() {
  if (this.provider === 'auto') {
    // Check Ollama availability
    if (await this.checkOllamaAvailability()) return 'ollama';
    
    // Check API keys
    if (this.geminiApiKey) return 'gemini';
    if (this.openaiApiKey) return 'openai';
    
    return 'ollama'; // Default (will show error if unavailable)
  }
  return this.provider;
}
```

**API**:
```javascript
const ai = new AIService(personaManager, memoryService);
await ai.initialize();

// Chat (auto-selects provider)
const response = await ai.chat('Hello!');

// Manual provider setting
ai.setProvider('gemini', { apiKey: 'your-key' });

// Set specific model
ai.setModel('ollama', 'llama3');

// Get available providers
const providers = ai.getAvailableProviders();
```

**Context Building**:
```javascript
// System prompt (from persona)
const systemPrompt = this.personaManager.getSystemPrompt();

// Recent conversation history (last 10 messages)
const context = await this.memoryService.getHistory(10);

// Persona state
const state = this.personaManager.personalityCore.getState();
const contextAddition = `Current mood: ${state.mood}, Energy: ${state.energy}%`;
```

---

### 5. VoiceService

**Purpose**: Text-to-Speech and Speech-to-Text.

**Providers**:
- **Web Speech API**: Free, built-in
- **ElevenLabs**: Premium, natural voices

**API**:
```javascript
const voice = new VoiceService();

// Speak text
await voice.speak('Hello!', {
  provider: 'web',
  voice: 'Google US English',
  rate: 1.0,
  pitch: 1.0
});

// Stop speaking
voice.stop();

// Get available voices
const voices = voice.getVoices();
// [{ id: 'Google US English', name: 'Google US English', lang: 'en-US' }]
```

---

### 6. MultiWindowManager

**Purpose**: Manages dual-window architecture.

**Windows**:
1. **Character Window**: Transparent, frameless, always-on-top (optional)
2. **Chat Window**: Standard window with controls

**API**:
```javascript
const manager = new MultiWindowManager(isDev);

// Create windows
await manager.createCharacterWindow(preloadPath);
await manager.createChatWindow(preloadPath);

// Show/hide
manager.showChatWindow();
manager.hideChatWindow();

// Broadcast to all windows
manager.broadcast('avatar:mood', 'happy');

// Send to specific window
manager.sendToCharacter('vrm:modelChanged', modelId);
manager.sendToChat('navigate', '/settings');

// Position controls
manager.snapCharacterToCorner('bottomRight');
manager.setCharacterPosition(100, 100);
manager.setCharacterClickThrough(true);
```

**Window Detection**:
```javascript
// Start monitoring active windows
manager.startWindowDetection();

// Get current active window
const activeWindow = manager.getActiveWindow();
// { title: 'VS Code', executable: 'Code.exe' }
```

---

## 🔌 API Reference

### IPC Communication

All IPC channels are defined in `main.js` and exposed via `preload.js`.

#### Window Controls
```javascript
// From renderer
await window.api.window.minimize();
await window.api.window.maximize();
await window.api.window.close();
await window.api.window.showChat();
await window.api.window.hideChat();
```

#### Persona Management
```javascript
// Get active persona
const persona = await window.api.persona.getActive();

// Set active persona
await window.api.persona.setActive('naruto');

// Get all personas
const personas = await window.api.persona.getAll();

// Get emotional state
const state = await window.api.persona.getState();
```

#### AI Chat
```javascript
// Send message
const response = await window.api.ai.chat('Hello!');

// Set provider
await window.api.ai.setProvider('ollama', { model: 'llama3' });

// Get provider status
const status = await window.api.ai.getProviderStatus();
// { active: 'ollama', available: ['ollama', 'gemini'], status: 'ready' }
```

#### Voice
```javascript
// Speak text
await window.api.voice.speak('Hello!', { 
  voice: 'Google US English',
  rate: 1.0,
  pitch: 1.0
});

// Stop speaking
await window.api.voice.stop();

// Get voices
const voices = await window.api.voice.getVoices();
```

#### Character Window
```javascript
// Show/hide
await window.api.character.show();
await window.api.character.hide();

// Toggle always-on-top
await window.api.character.toggleAlwaysOnTop();

// Snap to corner
await window.api.character.snap('topRight');

// Set click-through
await window.api.character.setClickThrough(true);

// Set VRM model
await window.api.character.setModel('hatsune_miku.vrm');
```

#### System Controls
```javascript
// Volume
const volume = await window.api.system.getVolume();
await window.api.system.setVolume(50); // 0-100

// Brightness (Windows/macOS)
const brightness = await window.api.system.getBrightness();
await window.api.system.setBrightness(70);

// Launch app
await window.api.system.launchApp('C:\\Program Files\\App\\app.exe');

// System info
const info = await window.api.system.getSystemInfo();
// { platform: 'win32', arch: 'x64', cpus: 8, memory: 16GB }
```

#### Marketplace
```javascript
// Get available personas
const personas = await window.api.marketplace.getPersonas();

// Purchase persona
const result = await window.api.marketplace.purchase('naruto', 'stripe');

// Check license
const isUnlocked = await window.api.license.check('naruto');

// Unlock with key
await window.api.license.unlock('naruto', 'LICENSE-KEY-HERE');
```

---

## 🚀 Build & Deployment

### Development Setup

```bash
# Clone repository
git clone https://github.com/John-Varghese-EH/Nizhal-AI.git
cd nizhal-ai

# Install dependencies
npm install

# Start Ollama (separate terminal)
ollama serve

# Pull AI model
ollama pull llama3

# Start development server
npm run dev
```

**Environment Variables** (`.env`):
```env
# AI Providers
VITE_GEMINI_API_KEY=your-gemini-key
VITE_OPENAI_API_KEY=your-openai-key
VITE_ANTHROPIC_API_KEY=your-anthropic-key

# Voice
VITE_ELEVENLABS_API_KEY=your-elevenlabs-key

# Payments
VITE_STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=secret...

# License Encryption
LICENSE_ENCRYPTION_KEY=random-32-char-string
```

---

### Build for Production

#### Windows
```bash
npm run build:win  # Creates NSIS installer + portable
# Output: dist-electron/Nizhal-AI-Setup-1.0.0.exe
```

#### macOS
```bash
npm run build:mac  # Creates DMG + ZIP
# Output: dist-electron/Nizhal-AI-1.0.0-Mac.dmg
```

#### Linux
```bash
npm run build:linux  # Creates AppImage, deb, rpm
# Output: dist-electron/Nizhal-AI-1.0.0-Linux.AppImage
```

---

### Electron Builder Configuration

Key settings in `package.json`:

```json
{
  "build": {
    "appId": "com.nizhal.ai",
    "productName": "Nizhal AI",
    "directories": { "output": "dist-electron" },
    "files": [
      "main.js",
      "preload.js",
      "src/electron/**/*",
      "src/core/**/*",
      "src/services/**/*",
      "dist/**/*"
    ],
    "protocols": {
      "name": "Nizhal AI",
      "schemes": ["nizhal"]
    }
  }
}
```

**Deep Linking**: `nizhal://marketplace/persona/naruto`

---

## ⚡ Performance

### Target Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Cold Start Time | < 3s | ~2.5s |
| Chat Response (Local) | < 2s | ~1.5s |
| Chat Response (Cloud) | < 3s | ~2.0s |
| Memory Usage (Orb) | < 200MB | ~150MB |
| Memory Usage (VRM) | < 400MB | ~350MB |
| FPS (Animations) | 60 FPS | 60 FPS |
| Bundle Size | < 100MB | ~85MB |

---

### Optimization Techniques

#### 1. React Performance
```javascript
// Use React.memo for expensive components
const MessageBubble = React.memo(({ message }) => {
  return <div>{message.content}</div>;
});

// Use useMemo for computed values
const sortedMessages = useMemo(
  () => messages.sort((a, b) => a.timestamp - b.timestamp),
  [messages]
);

// Use useCallback for event handlers
const handleSend = useCallback(async () => {
  await sendMessage(input);
}, [input]);
```

#### 2. Three.js Optimization
```javascript
// Limit VRM model polygon count (< 30k)
// Use LOD (Level of Detail) for distant objects
// Dispose unused textures/geometries
useEffect(() => {
  return () => {
    geometry.dispose();
    material.dispose();
    texture.dispose();
  };
}, []);
```

#### 3. IPC Optimization
```javascript
// Batch state updates
const updates = [];
updates.push({ key: 'mood', value: 'happy' });
updates.push({ key: 'energy', value: 80 });
window.api.state.batchUpdate(updates);

// Debounce frequent events
const debouncedResize = debounce(() => {
  window.api.character.setSize(width, height);
}, 300);
```

#### 4. Memory Management
```javascript
// Clear old messages (keep last 50)
if (messages.length > 50) {
  messages = messages.slice(-50);
}

// Use WeakMap for caching
const cache = new WeakMap();
```

---

## 🔒 Security

### Electron Security Best Practices

#### 1. Context Isolation
```javascript
// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Safe, validated API
  chat: (message) => ipcRenderer.invoke('ai:chat', message)
  // NO direct ipcRenderer exposure!
});
```

#### 2. Content Security Policy
```javascript
// main.js
session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
  callback({
    responseHeaders: {
      ...details.responseHeaders,
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "connect-src 'self' https://api.openai.com https://generativelanguage.googleapis.com"
      ]
    }
  });
});
```

#### 3. Node Integration Disabled
```javascript
// Character window
characterWindow = new BrowserWindow({
  webPreferences: {
    nodeIntegration: false,        // CRITICAL
    contextIsolation: true,        // CRITICAL
    sandbox: true,                 // Extra protection
    preload: preloadPath
  }
});
```

#### 4. License Encryption
```javascript
// LicenseService.js
const crypto = require('crypto');

function encrypt(text, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}
```

---

## 🧪 Testing Strategy

### Unit Tests (Future Implementation)

```javascript
// Example: PersonalityCore tests
describe('PersonalityCore', () => {
  test('should initialize with default state', () => {
    const core = new PersonalityCore();
    expect(core.getState().affection).toBe(50);
  });

  test('should process positive interaction', () => {
    const core = new PersonalityCore();
    core.processInteraction('thank you!', 'You\'re welcome!');
    expect(core.getState().affection).toBeGreaterThan(50);
  });
});
```

### Integration Tests

```javascript
// Example: AIService integration
describe('AIService', () => {
  test('should fallback to cloud if Ollama unavailable', async () => {
    const ai = new AIService(personaManager, memoryService);
    await ai.initialize();
    
    // Mock Ollama unavailable
    ai.ollamaAvailable = false;
    
    const response = await ai.chat('Hello');
    expect(ai.currentProvider).toBe('gemini');
  });
});
```

### Manual Testing Checklist

- [ ] Persona switching works without restart
- [ ] VRM models load correctly
- [ ] Voice synthesis works (Web Speech + ElevenLabs)
- [ ] Memory persists across sessions
- [ ] Window snapping functions correctly
- [ ] Click-through toggle works
- [ ] Payment flow completes (test mode)
- [ ] License validation works
- [ ] Global shortcuts trigger correctly
- [ ] Privacy mode disables tracking

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Ollama Connection Failed
```
Error: connect ECONNREFUSED 127.0.0.1:11434
```
**Solution**: Ensure Ollama is running (`ollama serve` in terminal)

---

#### 2. VRM Model Won't Load
```
Error: GLTFLoader: Unknown extension "VRM"
```
**Solution**: Check VRM version (supports 0.0 and 1.0). Use VRoid Hub models.

---

#### 3. Blank Character Window
**Solution**: Check DevTools (F12). Common causes:
- React error in CharacterApp.jsx
- Three.js context loss (GPU driver issue)
- Missing preload script

---

#### 4. High Memory Usage
**Cause**: VRM model with high polygon count or many textures

**Solution**:
```javascript
// Reduce model quality
// Dispose unused resources
// Use lower-poly models (< 30k triangons)
```

---

#### 5. License Validation Fails
**Check**:
- LICENSE_ENCRYPTION_KEY matches between builds
- License key format is correct
- userData directory is writable

---

### Debug Mode

Enable verbose logging:

```javascript
// main.js
const DEBUG = true;

if (DEBUG) {
  console.log('[Main] Service initialized:', serviceName);
}

// DevTools auto-open
if (isDev || DEBUG) {
  chatWindow.webContents.openDevTools({ mode: 'detach' });
}
```

---

## 📊 Monitoring & Telemetry (Future)

### Planned Metrics

- **Crash Reports**: Electron's crashReporter
- **Performance Tracking**: Custom event logging
- **Usage Analytics**: Opt-in only, privacy-respecting

```javascript
// Example telemetry (requires user consent)
async function trackEvent(category, action, label) {
  const prefs = await memoryService.getUserPreferences();
  if (!prefs.telemetryEnabled) return;
  
  // Send to analytics service
  await fetch('https://analytics.nizhal.ai/event', {
    method: 'POST',
    body: JSON.stringify({ category, action, label })
  });
}
```

---

## 🔧 Development Tools

### Recommended VSCode Extensions
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Tailwind CSS IntelliSense**: Styling autocomplete
- **Error Lens**: Inline error display

### Debugging Electron

**Main Process**:
```bash
# Launch with Node debugger
node --inspect=5858 node_modules/electron/cli.js .
```

**Renderer Process**:
- Use built-in Chrome DevTools (F12)

---

## 📚 Additional Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [Three.js Documentation](https://threejs.org/docs/)
- [VRM Specification](https://vrm-consortium.org/)
- [Ollama Documentation](https://ollama.com/docs)
- [Gemini API Reference](https://ai.google.dev/docs)

---

## ✅ Production Readiness Checklist

- [ ] All API keys stored securely (env vars, not hardcoded)
- [ ] Error boundaries in React components
- [ ] Graceful degradation (offline mode)
- [ ] Build succeeds on all platforms (Win, Mac, Linux)
- [ ] Code signing certificates configured
- [ ] Auto-update mechanism tested
- [ ] Memory leaks checked (Chrome DevTools Profiler)
- [ ] Security audit completed (npm audit)
- [ ] GDPR/privacy compliance verified
- [ ] User documentation finalized

---

**Maintained by**: Nizhal AI Engineering Team  
**Last Review**: January 22, 2026  
**Next Review**: Before v1.0 Release
