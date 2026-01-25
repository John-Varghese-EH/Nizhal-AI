<div align="center">

  <img src="assets/icon.png" alt="Nizhal AI Logo" width="140" />

  # 👻 Nizhal AI

  ### Your Emotional AI Companion for Desktop

  **"More than just an assistant. A friend who lives on your screen."**

  [![License](https://img.shields.io/badge/license-MIT-yellow.svg)](LICENSE)
  [![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Mac%20%7C%20Linux-blue.svg)](https://electronjs.org)
  [![Status](https://img.shields.io/badge/status-Active%20Development-brightgreen.svg)]()
  [![Node](https://img.shields.io/badge/node-v20+-43853d.svg)](https://nodejs.org)
  [![Electron](https://img.shields.io/badge/electron-30+-9FEAF9.svg)](https://electronjs.org)
  [![Stars](https://img.shields.io/github/stars/John-Varghese-EH/Nizhal-AI?style=social)](https://github.com/John-Varghese-EH/Nizhal-AI)

  <br/>

  [⬇️ **Download**](https://github.com/John-Varghese-EH/Nizhal-AI/releases) •
  [📖 **Documentation**](#-quick-start) •
  [💬 **Discord**](#) •
  [🐛 **Report Bug**](https://github.com/John-Varghese-EH/Nizhal-AI/issues)

</div>

---

<div align="center">
  <img src="assets/screenshots/hero-banner.png" alt="Nizhal AI Hero Banner" width="100%" />
  <br/>
  <em>Meet your new AI companion - always there, always listening, always learning.</em>
</div>

---

## ✨ Why Nizhal?

**Nizhal** (നിഴൽ) means **"Shadow"** in Malayalam. Just like a shadow, this AI companion stays by your side — evolving with you, remembering your life, and offering emotional support when you need it most.

<table>
  <tr>
    <td align="center" width="33%">
      <h3>🎭 Emotional</h3>
      <p>Detects your mood through voice and camera. Responds with empathy.</p>
    </td>
    <td align="center" width="33%">
      <h3>🔒 Private</h3>
      <p>Runs 100% locally with Ollama. Your data never leaves your device.</p>
    </td>
    <td align="center" width="33%">
      <h3>🎨 Beautiful</h3>
      <p>Stunning 3D VRM avatars with glassmorphism UI and smooth animations.</p>
    </td>
  </tr>
</table>

---

## 📸 Screenshots

<div align="center">

| Main Interface | Life Dashboard | Settings |
|:---:|:---:|:---:|
| <img src="assets/screenshots/main-ui.png" width="280" alt="Main Interface"/> | <img src="assets/screenshots/life-dashboard.png" width="280" alt="Life Dashboard"/> | <img src="assets/screenshots/settings.png" width="280" alt="Settings"/> |
| *3D Avatar with Chat* | *Calendar, Weather, Moods* | *AI Providers & Themes* |

| Android Control | Task Board | Mood Tracker |
|:---:|:---:|:---:|
| <img src="assets/screenshots/android-control.png" width="280" alt="Android Control"/> | <img src="assets/screenshots/task-board.png" width="280" alt="Task Board"/> | <img src="assets/screenshots/mood-tracker.png" width="280" alt="Mood Tracker"/> |
| *Mirror & Control Phone* | *Kanban-style Tasks* | *Track Emotions* |

</div>

---

## 🚀 Key Features

<table>
  <tr>
    <td width="50%">

### 🗣️ Natural Voice Interaction
- Talk naturally with **no wake words**
- Real-time voice with **LiveKit** & **WebSpeech**
- Multilingual support (English, Hindi, Malayalam)
- Voice commands for desktop control

### 🧠 Emotional Intelligence
- **Camera emotion detection** (happy, sad, focused)
- Sentiment analysis from conversations
- Avatar mirrors your emotions in real-time
- 14+ emotion states for expressive responses

### 🔮 Live 3D Avatars
- Beautiful **VRM model** support
- Drag & drop your own characters
- Mouse tracking & idle animations
- Head pat interactions! 🥰

    </td>
    <td width="50%">

### 🌍 Life Management
- **Weather** with customizable location
- **Calendar** sync with Google Calendar
- **Mood Tracker** with weekly visualization
- **Habit Tracker** with streaks
- **Smart Reminders** with natural language

### 📱 Device Control
- **Android control** via ADB
- Screen mirroring with scrcpy
- Desktop automation (apps, volume, files)
- Cross-device command center

### 🤖 AI Flexibility
- **Local LLMs**: Ollama (100% private)
- **Cloud**: Gemini, OpenAI, Anthropic
- **Voice**: ElevenLabs, Edge TTS
- Automatic fallback between providers

    </td>
  </tr>
</table>

---

## ⚡ Quick Start

### Option 1: Download Installer (Recommended)

<div align="center">

| Platform | Download |
|:---:|:---:|
| 🪟 **Windows** | [**Nizhal-AI-Setup.exe**](https://github.com/John-Varghese-EH/Nizhal-AI/releases/latest) |
| 🍎 **macOS** | [**Nizhal-AI.dmg**](https://github.com/John-Varghese-EH/Nizhal-AI/releases/latest) |
| 🐧 **Linux** | [**Nizhal-AI.AppImage**](https://github.com/John-Varghese-EH/Nizhal-AI/releases/latest) |

</div>

### Option 2: Build from Source

```bash
# Clone the repository
git clone https://github.com/John-Varghese-EH/Nizhal-AI.git
cd Nizhal-AI

# Install dependencies (Node.js v20+ required)
npm install

# Start development mode
npm run dev

# Build for production
npm run build
```

### Option 3: One-Click Setup

```bash
# Full setup with LiveKit agent
npm run setup
```

> **📝 Requirements:**
> - Node.js v20+
> - Microphone for voice features
> - Webcam for emotion detection (optional)
> - [Ollama](https://ollama.com) for local AI (optional)

---

## 🛠️ Tech Stack

<div align="center">

| Category | Technologies |
|:---|:---|
| **Frontend** | React 18, Vite, TailwindCSS, Framer Motion |
| **Desktop** | Electron 30, electron-builder |
| **3D Engine** | Three.js, React Three Fiber, @pixiv/three-vrm |
| **AI** | Ollama, Google Gemini, OpenAI, Anthropic |
| **Voice** | LiveKit Agents, WebSpeech API, ElevenLabs |
| **Vision** | TensorFlow.js, face-api.js, COCO-SSD |
| **Android** | WebADB, scrcpy-wasm |

</div>

---

## 🎨 Customization

### Personality Modes
| Mode | Description |
|:---|:---|
| 💕 **GF/BF** | Affectionate and caring companion |
| 🤖 **JARVIS** | Professional and efficient assistant |
| 😘 **LACHU** | Mallu queen with attitude |
| 🔮 **AUTO** | Detects from conversation context |

### VRM Models
Drop any `.vrm` file to use your own character! Compatible with:
- [VRoid Studio](https://vroid.com/en/studio) exports
- [Booth.pm](https://booth.pm/en/search/vrm) models
- Custom models from Blender

---

## 📁 Project Structure

```
Nizhal-AI/
├── src/
│   ├── main/              # Electron main process
│   ├── preload/           # Secure bridge APIs
│   ├── renderer/          # React UI components
│   │   ├── components/    # UI components
│   │   ├── hooks/         # Custom React hooks
│   │   └── services/      # Frontend services
│   ├── services/          # Core services
│   ├── assistant/         # AI extensions
│   │   ├── android/       # Android control
│   │   ├── livekit/       # Voice communication
│   │   └── life-manager/  # Calendar, weather, etc.
│   └── core/              # Personality & emotion engine
├── assets/                # Icons, models, fonts
├── livekit-backend/       # Python voice agent
└── docs/                  # Documentation
```

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork** the repository
2. Create a **feature branch** (`git checkout -b feature/amazing`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing`)
5. Open a **Pull Request**

### Ideas for Contribution
- 🌐 Add more languages
- 🎨 Create new VRM models
- 🤖 Improve AI responses
- 📱 Expand Android features
- 🐛 Fix bugs and issues

---

## ❓ FAQ

<details>
<summary><b>Is my data private?</b></summary>

Yes! Nizhal AI stores all data locally on your device. When using local LLMs (Ollama), nothing leaves your computer. Cloud AI providers (Gemini, OpenAI) have their own privacy policies.
</details>

<details>
<summary><b>Can I use my own AI models?</b></summary>

Absolutely! Install Ollama and pull any model (Llama 3, Mistral, etc.). Configure the model in Settings → AI Providers.
</details>

<details>
<summary><b>How do I change the avatar?</b></summary>

Drag and drop any `.vrm` file onto the character window, or go to Settings → Character → Load VRM.
</details>

<details>
<summary><b>Does it work offline?</b></summary>

Yes, with Ollama running locally. Voice commands work with WebSpeech API (browser-based, requires internet for some features).
</details>

<details>
<summary><b>What's the performance impact?</b></summary>

Minimal! The app uses ~150-300MB RAM. 3D rendering is optimized, and local AI depends on your model choice.
</details>

---

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [VRoid Project](https://vroid.com) for VRM technology
- [LiveKit](https://livekit.io) for real-time communication
- [Ollama](https://ollama.com) for local AI inference
- All the amazing open-source libraries that make this possible

---

<div align="center">

  <img src="assets/icon.png" alt="Nizhal AI" width="60" />

  ### Made with ❤️ in India

  **[John Varghese](https://github.com/John-Varghese-EH)**

  <br/>

  ⭐ **Star this repo if Nizhal made you smile!** ⭐

  <br/>

  [Report Bug](https://github.com/John-Varghese-EH/Nizhal-AI/issues) •
  [Request Feature](https://github.com/John-Varghese-EH/Nizhal-AI/issues) •
  [Privacy Policy](PRIVACY_POLICY.md) •
  [Terms](TERMS.md)

</div>
