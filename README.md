# Nizhal AI

<div align="center">

![Nizhal AI Logo](/assets/icon.png)

# Nizhal AI - Your Desktop Companion

**Nizhal** (നിഴൽ) means "shadow" - and like a faithful shadow, 
this adorable AI companion stays by your side on your desktop!

[![License](https://img.shields.io/badge/license-Source%20Available-yellow.svg)](/LICENSE)
[![Electron](https://img.shields.io/badge/electron-33.x-47848F.svg)](https://electronjs.org)
[![React](https://img.shields.io/badge/react-18.x-61DAFB.svg)](https://reactjs.org)
[![VRM](https://img.shields.io/badge/VRM-0.0%20%26%201.0-EE5E20.svg)](https://vrm-consortium.org/en/)

</div>

🎭 **Choose Your Friend** - Kawaii orbs, anime heroes, or sleek HUD vibes  
💕 **Grows With You** - Emotional intelligence that remembers & adapts  
🗣️ **Speaks Your Vibe** - Manglish, Tanglish, Hinglish & more!  
✨ **Stunning Visuals** - VRM avatars, glassmorphism, mood-reactive effects  

> *Because everyone deserves a cute AI friend who gets them. ❤️* 

*Emotional Intelligence • Persona Marketplace • Small Problem Solver*

> [!NOTE]
> **🚧 Work in Progress:**  
> Nizhal AI is still evolving! Help make it better and faster-contributions, feedback, and ideas are warmly welcome.  
> *Star the repo and join the project!*

---

## ✨ Features

### 🎭 Multi-Persona System
- **Jarvis** - Technical, protective, formal AI assistant
- **Kavya** - Caring female friend (Authentic Kerala Manglish)
- **Arjun** - Reliable male friend (Authentic Kerala Manglish)
- **Naruto** - The energetic Ninja
- **Goku** - The Saiyan Warrior
- **Elsa** - The Snow Queen
- **Nanban** - Tamil friend with Tanglish (Tamil-English)
- **Sneha** - Telugu friend with Tenglish (Telugu-English)
- **Dost** - Hindi friend with Hinglish (Hindi-English)

### 🧠 Emotional Intelligence (Advanced Logic)
- **Affection, Trust, Professionalism** tracking
- **Mood system**: Happy, Neutral, Concerned, Protective, Playful, Thoughtful
- Dynamic personality that evolves with your interactions

### 💎 Premium Visuals
- **Jarvis HUD** – Three.js animated holographic interface
- **Companion Orb** – Mood-reactive morphing orb visualization
- Glassmorphism UI with Framer Motion animations

### 🛒 Persona Marketplace
- Purchase premium personas and voice packs
- License validation and management

### 🤖 AI & Voice
- **Local(Privacy)**: Ollama local inference
- **Cloud(low-end devices)**: Gemini, OpenAI, 
- **Voice**: Web Speech API + ElevenLabs premium voices

### 🔧 System Control (Jarvis Mode)
- Volume and brightness control
- Application launcher
- Always-on-top transparent overlay with click-through mode

## 🚀 Complete Setup Guide (For Students)

### Prerequisites

Before you begin, install these tools:

#### 1. Install Node.js (v20+)

**Windows:**
```bash
# Download and install from nodejs.org, OR use winget:
winget install OpenJS.NodeJS.LTS
```

**macOS:**
```bash
brew install node
```

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Verify installation:
```bash
node --version  # Should show v20.x.x or higher
npm --version   # Should show 10.x.x or higher
```

---

#### 2. Install Ollama (For Free Local AI)

Ollama lets you run AI models locally for FREE. This is the default inference engine.

**Windows:**
```bash
# Download from https://ollama.com/download/windows
# Or use winget:
winget install Ollama.Ollama
```

**macOS:**
```bash
brew install ollama
```

**Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Start Ollama and download a model:**
```bash
# Start the Ollama service
ollama serve

# In a NEW terminal, pull the recommended model:
ollama pull llama3        # General purpose (8B parameters)
# OR for faster responses on low-end hardware:
ollama pull mistral       # 7B parameters, faster
```

> ⚠️ **Important**: Ollama must be running (`ollama serve`) before starting Nizhal AI.

---

#### 3. Clone & Run Nizhal AI

```bash
# Clone the repository
git clone https://github.com/John-Varghese-EH/Nizhal-AI.git
cd nizhal-ai

# Install dependencies
npm install

# Start in development mode
npm run dev
```

The app will launch as a transparent overlay on your desktop!

---

### Troubleshooting

| Problem | Solution |
|---------|----------|
| "Ollama not responding" | Ensure `ollama serve` is running in a separate terminal |
| "Module not found" | Run `npm install` again |
| Blank window | Check DevTools (F12) for errors |
| Slow responses | Try `ollama pull mistral` for a smaller model |

---

## 📁 Project Structure

```
nizhal-ai/
├── main.js                    # Electron main process
├── preload.js                 # Secure context bridge
├── src/
│   ├── electron/
│   │   ├── windowManager.js   # Click-through, transparency
│   │   └── bridge.js          # System controls
│   ├── core/
│   │   ├── PersonalityCore.js # Emotional state machine
│   │   ├── PersonaManager.js  # Persona templates & switching
│   │   └── MemoryService.js   # JSON-RAG memory system
│   ├── services/
│   │   ├── AIService.js       # Ollama + Gemini inference
│   │   ├── VoiceService.js    # TTS (WebSpeech + ElevenLabs)
│   │   ├── PaymentService.js  # Razorpay + Stripe
│   │   ├── LicenseService.js  # Encrypted license management
│   │   └── PersonaMarketplace.js
│   └── renderer/
│       ├── App.jsx            # Main React app
│       ├── components/
│       │   ├── ChatView.jsx
│       │   ├── Marketplace.jsx
│       │   ├── SettingsView.jsx
│       │   └── skins/
│       │       ├── JarvisHUD.jsx   # Three.js HUD
│       │       └── CompanionOrb.jsx
│       └── styles/
│           └── globals.css
├── package.json
├── vite.config.js
├── tailwind.config.js
└── DEPLOYMENT.md
```

---

## ⚙️ Configuration

### API Keys

Configure in Settings → API Keys:

| Service | Purpose | Required |
|---------|---------|----------|
| Gemini API | Cloud AI inference | Optional |
| ElevenLabs | Premium voice synthesis | Optional |

## Free Hatsune Miku Support

Want to try with a free model?  
[Download Hatsune Miku VRM](https://booth.pm/en/items/3226395)

## 🛠️ Development

```bash
# Development with hot reload
npm run dev

# Lint code
npm run lint

# Build for current platform
npm run build

# Build for specific platforms
npm run build:win
npm run build:mac
npm run build:linux
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## 📄 License

This project is licensed - see the [LICENSE](LICENSE) file for details.

---

## 💝 Support

[![Buy me a Coffee](https://img.shields.io/badge/Buy_Me_A_Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/CyberTrinity)
[![Patreon](https://img.shields.io/badge/Patreon-F96854?style=for-the-badge&logo=patreon&logoColor=white)](https://patreon.com/CyberTrinity)
[![Sponsor](https://img.shields.io/badge/sponsor-30363D?style=for-the-badge&logo=GitHub-Sponsors&logoColor=#white)](https://github.com/sponsors/John-Varghese-EH)

---

<div align="center">
<strong>Built with ❤️ by [J0X](https://github.com/John-Varghese-EH/) for the AI companion community</strong>
</div>
