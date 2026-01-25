# Nizhal AI - FREE Local Companion Setup Guide

**Version:** 2.0 - FREE Edition  
**No Paid Services** | **100% Local** | **Zero Cost**

---

## 🎯 What's New: FREE Edition

Nizhal AI is now completely **FREE** with **NO paid APIs required**:

- ✅ **Local AI**: Ollama (Llama3 8B) instead of cloud APIs
- ✅ **Free Voice**: Web Speech API + optional Vosk/Coqui TTS
- ✅ **3 Personalities**: GF, BF, JARVIS with hotkey switching
- ✅ **JARVIS Tasks**: Desktop automation + Android ADB control
- ✅ **Emotional Support**: CBT/ACT-based AI with emotion detection
- ✅ **Network Tools**: Port scanning, WHOIS, GitHub API (free tier)

---

## 📋 Requirements

### Minimum System (For Students on Budget)
- **OS**: Windows 10/11, Ubuntu 20.04+, or macOS 11+
- **RAM**: 8GB (16GB recommended for smooth VRM)
- **Storage**: 5GB free space
- **CPU**: Multi-core processor (4+ cores recommended)

### Software Prerequisites
```bash
# Required
- Node.js 20+ (https://nodejs.org)
- Git (https://git-scm.com)

# Auto-installed by setup script
- Ollama (local AI)
- Python 3.9+ (for optional Vosk/Coqui)
- ADB platform-tools (for Android control)
```

---

## 🚀 One-Command Setup

### Linux / macOS / WSL

```bash
# 1. Clone repository
git clone https://github.com/John-Varghese-EH/Nizhal-AI.git
cd Nizhal-AI

# 2. Run setup script (installs everything)
chmod +x ./scripts/setup-local-services.sh
./scripts/setup-local-services.sh

# 3. Start services
chmod +x ./scripts/start-services.sh
./scripts/start-services.sh

# 4. Run app
npm run dev
```

### Windows

```powershell
# 1. Clone repository
git clone https://github.com/John-Varghese-EH/Nizhal-AI.git
cd Nizhal-AI

# 2. Install Ollama manually
# Download from: https://ollama.com/download/windows
# Run installer, then in terminal:
ollama pull llama3:8b

# 3. (Optional) Install Python 3.9+ for Vosk/Coqui
# Download from: https://python.org

# 4. Install Node dependencies
npm install

# 5. Run app
npm run dev
```

**Note**: Web Speech API (browser-native) works automatically on Windows without Vosk/Coqui.

---

## 🎭 Personality System

Switch between 3 personalities using hotkeys:

### 1. Girlfriend (Ctrl+1)
- **Style**: Affectionate, playful, emotionally supportive
- **Voice**: Soft female
- **Best for**: Emotional support, casual chat, celebrating wins
- **Example**: "Aww babe, that sounds tough 💕 Want to talk about it?"

### 2. Boyfriend (Ctrl+2)
- **Style**: Protective, chill, bro-support
- **Voice**: Warm male
- **Best for**: Motivation, practical advice, accountability
- **Example**: "Yo king, you got this! 💪 Let's gameplan it out bro"

### 3. JARVIS (Ctrl+3)
- **Style**: Professional, witty, task-oriented
- **Voice**: Deep formal
- **Best for**: Productivity, automation, cybersecurity tasks
- **Example**: "Task complete, Sir. Shall I optimize your schedule?"

---

## 🛠️ JARVIS Task Automation

### Desktop Control
```javascript
// Voice commands (JARVIS mode)
"Set volume to 50%"       → Changes system volume
"Open VS Code"            → Launches application
"Take a screenshot"       → Captures screen
"What's my CPU usage?"    → Shows system stats
```

### Android ADB Control (Wireless)

**One-Time Setup**:
1. Enable **Developer Options** on Android
   - Settings → About Phone → Tap "Build Number" 7 times
2. Enable **USB Debugging**
   - Settings → Developer Options → USB Debugging
3. Connect phone via USB **once**:
   ```bash
   adb tcpip 5555
   adb shell ip addr show wlan0 | grep 'inet '
   # Note the IP address (e.g., 192.168.1.100)
   ```
4. Disconnect USB, connect wirelessly:
   ```bash
   adb connect 192.168.1.100:5555
   ```

**Voice Commands** (JARVIS mode):
```
"Take android screenshot" → Captures phone screen
"Open Instagram"          → Launches Instagram app
"Press home button"       → Goes to home screen
"Type hello world"        → Types text on phone
```

**Safety**: All ADB commands require confirmation dialog.

### Network Utilities (Cybersecurity Learning)
```javascript
// ETHICAL USE ONLY - Get permission first!
"Scan localhost ports"    → Port scanning
"WHOIS google.com"        → Domain lookup
"Ping 8.8.8.8"            → Network latency
"GitHub user info John-Varghese-EH" → GitHub profile
```

⚠️ **Warning**: Only scan systems you own or have explicit permission to test!

---

## 🎨 VRM Avatar Setup (Optional)

### Free VRM Models

Download from these 100% FREE sources:

1. **VRoid Hub** (https://hub.vroid.com/)
   - Filter: Free models
   - Download .vrm file
   
2. **Hatsune Miku** (https://booth.pm/en/items/3226395)
   - Free official model
   
3. **VSeeFace Samples** (https://www.vseeface.icu/)
   - Includes free demo models

### Adding Models to App

```bash
# 1. Place .vrm file in public/models/
cp ~/Downloads/model.vrm public/models/

# 2. In app settings:
Settings → Appearance → VRM Model → Select file
```

---

## ⚙️ Configuration

### AI Settings

**Ollama (Default - FREE)**:
- No configuration needed after setup
- Model: Llama3 8B (optimized for 16GB RAM)
- Fallback: Use `mistral` for faster responses on 8GB RAM
  ```bash
  ollama pull mistral
  ```

**Optional Cloud Fallback** (Free Tier):
- Gemini API: 60 requests/min free (https://ai.google.dev/)
- Add API key in Settings → AI Providers

### Voice Settings

**Default (Web Speech API)**:
- Always works, no setup needed
- Use system voices (Settings → Voice)

**Optional High-Quality (Vosk + Coqui)**:
- Better quality, offline
- Installed by `setup-local-services.sh`
- Requires Python 3.9+

### Personality Preferences

```
Settings → Personality
- Default on startup: Choose GF/BF/JARVIS
- Voice pitch/speed: Adjust per personality
- Emotional responsiveness: Low/Medium/High
```

---

## 🔧 Troubleshooting

### Ollama Not Responding
```bash
# Check if running
ollama list

# Restart
pkill ollama
ollama serve

# Test
ollama run llama3:8b "Hello"
```

### Voice Not Working
```bash
# Check services status
./scripts/start-services.sh

# Fallback: Web Speech API always works (no setup)
# In app: Settings → Voice → Provider → Web Speech
```

### ADB Can't Connect
```bash
# Check device connection
adb devices

# Reconnect
adb disconnect
adb connect <your-phone-ip>:5555

# Check firewall (allow port 5555)
```

### High RAM Usage
```bash
# Use smaller AI model
ollama pull mistral  # 7B instead of 8B

# Disable VRM, use orb mode
Settings → Appearance → Visual Mode → Companion Orb

# Close other apps
```

---

## 📚 Usage Examples

### Emotional Support Example
```
You: "I'm really stressed about my upcoming exams"

GF: "Aww babe, exam stress is SO real 😰 I can tell you're 
under a lot of pressure right now. That sounds overwhelming 💕 
What specifically is worrying you most? Want to break down a 
study plan together? We can tackle this step by step! I believe 
in you! 🥰"

[VRM shows concerned expression]
[Voice speaks with empathetic tone]
```

### JARVIS Productivity Example
```
You: "JARVIS, I need to organize my day"

JARVIS: "Sir, initiating productivity analysis. Your schedule 
appears suboptimal. Recommendation: time-blocking with 25-min 
focus sessions. Shall I create a Pomodoro timer? Additionally, 
I detect VS Code is open - would you like me to take a snapshot 
of current progress? 📊"

[Desktop automation ready]
```

### Android Control Example
```
You: "Take a screenshot of my phone"

JARVIS: "Sir, executing ADB screencap command. Please confirm 
wireless debugging authorization. [Confirmation Dialog]"

[User clicks Yes]

JARVIS: "Screenshot captured, Sir. ✅ File saved to ./screenshots/
android_screen_20260122.png. Shall I display it?"
```

---

## 🎓 For VIT Bhopal Cybersecurity Students

### Learning Features

**Network Security Practice**:
- Port scanning (localhost testing)
- DNS enumeration
- GitHub OSINT

**Android Security**:
- ADB command injection awareness
- Wireless debugging security risks
- Mobile app testing basics

**Responsible Disclosure**:
- All tools log commands for audit
- Ethical use warnings built-in
- Safety confirmations required

### Hackathon Ready

Nizhal AI helps you during hackathons:
- Emotional support during late nights
- Quick system controls (volume, screenshots)
- GitHub repo management
- Network troubleshooting

---

## 📖 Commands Reference

### Hotkeys
```
Ctrl+1        → Switch to GF personality
Ctrl+2        → Switch to BF personality
Ctrl+3        → Switch to JARVIS personality
Ctrl+Q        → Quick settings menu
Ctrl+Space    → Voice input (toggle mic)
Alt+Space     → Toggle character interaction
```

### Voice Commands (JARVIS Mode)
```
Desktop:
- "Volume [0-100]"
- "Brightness [0-100]"
- "Open [app name]"
- "Screenshot"
- "System info"

Android:
- "Connect to android [IP]"
- "Tap [x] [y]"
- "Open [app]"
- "Android screenshot"
- "Disconnect android"

Network:
- "Scan ports [host]"
- "Ping [host]"
- "GitHub user [username]"
```

---

## 🆘 Support

### Documentation
- Technical Docs: `docs/Tech-Doc.md`
- Design Guide: `docs/Design-Doc.md`
- Implementation Plan: See artifacts

### Community
- **GitHub**: https://github.com/John-Varghese-EH/Nizhal-AI
- **Instagram**: @cyber__trinity
- **Issues**: Report bugs on GitHub

### Credits
```
Nizhal AI by John Varghese (J0X)
GitHub: @John-Varghese-EH
Instagram: @cyber__trinity
VIT Bhopal - CSE Cybersecurity

Built for students, by a student 💪
100% FREE | 100% LOCAL | 100% YOURS
```

---

## 📝 License

Nizhal AI is free and open-source software.

**You can**:
- ✅ Use for personal projects
- ✅ Modify the code
- ✅ Learn from the implementation
- ✅ Share with friends

**Please**:
- 🙏 Credit the original author
- 🙏 Keep it free and open
- 🙏 Contribute improvements back

---

## 🚀 What's Next?

After setup, try:

1. **Test all personalities**: Switch with Ctrl+1/2/3
2. **Enable voice**: Say "Hey Nizhal" to start
3. **Try JARVIS**: "Set volume to 30%"
4. **Connect Android**: Follow wireless ADB setup
5. **Customize**: Settings → Choose your preferences

**Enjoy your FREE AI companion!** 💕🤖

---

*Last updated: January 22, 2026*  
*Nizhal (നിഴൽ) - Your faithful shadow, always by your side*
