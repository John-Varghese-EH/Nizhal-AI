# 🎙️ LiveKit Voice AI Agent System

Production-ready real-time voice AI agent built with LiveKit, featuring Speech-to-Text, Large Language Models, and Text-to-Speech for natural voice conversations.

![LiveKit](https://img.shields.io/badge/LiveKit-Latest-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![Python](https://img.shields.io/badge/Python-3.9+-yellow)
![License](https://img.shields.io/badge/License-MIT-purple)

## ✨ Features

- 🎯 **Real-time Voice AI**: Natural conversations with AI assistants
- 🔒 **Secure**: Token-based authentication with participant ACLs
- 🚀 **Scalable**: Built on LiveKit's production-ready SFU
- 🔄 **Reconnection**: Automatic recovery from network issues
- 📱 **Multi-platform**: Web, mobile, and desktop clients
- 🎨 **Modern UI**: Premium glassmorphism design
- 🌐 **Multi-provider**: Deepgram, OpenAI, ElevenLabs, and more

## 🏗️ Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│ Web Client  │◄───────►│ LiveKit      │◄───────►│ AI Agent    │
│ (Browser)   │  WebRTC │ Server       │  WebRTC │ (Python)    │
└─────────────┘         └──────────────┘         └─────────────┘
       │                        │
       │ HTTP                   │ gRPC
       ▼                        ▼
┌─────────────┐         ┌──────────────┐
│ Backend     │         │ AI Services  │
│ (Node.js)   │         │ ┌──────────┐ │
│ - Tokens    │         │ │ Deepgram │ │ STT
│ - Rooms     │         │ │ OpenAI   │ │ LLM & TTS
│ - Auth      │         │ │ElevenLabs│ │ Premium TTS
└─────────────┘         │ └──────────┘ │
                        └──────────────┘
```

## 📁 Project Structure

```
.
├── livekit-backend/        # Node.js token server
│   ├── server.js           # Express API server
│   ├── package.json        # Dependencies
│   └── .env.example        # Config template
│
├── livekit-client/         # Web client
│   ├── index.html          # UI interface
│   ├── client.js           # LiveKit client logic
│   └── styles.css          # Premium design
│
└── livekit-agent/          # Python AI agent
    ├── agent.py            # Voice AI logic
    ├── requirements.txt    # Python dependencies
    └── .env.example        # Config template
```

## 🚀 Quick Start

### 1. Prerequisites

- **Node.js** 18+ 
- **Python** 3.9+
- **LiveKit Account** (free at [cloud.livekit.io](https://cloud.livekit.io))
- **API Keys**:
  - Deepgram (STT) - [Free 200 hours](https://console.deepgram.com/signup)
  - OpenAI (LLM/TTS) - [Get here](https://platform.openai.com/signup)

### 2. Setup Backend

```bash
cd livekit-backend
npm install
cp .env.example .env
# Edit .env with your LiveKit credentials
npm run dev
```

### 3. Setup AI Agent

```bash
cd livekit-agent
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys
python agent.py
```

### 4. Open Web Client

```bash
cd livekit-client
python -m http.server 8080
```

Open browser: `http://localhost:8080`

### 5. Test!

1. Enter room name (e.g., `voice-ai-room`)
2. Click "Join Room"
3. Enable microphone
4. **Speak** to the AI agent!

## 📚 Documentation

- **[Setup Guide](./SETUP.md)** - Detailed installation and configuration
- **[Testing Guide](./TESTING.md)** - Comprehensive testing procedures
- **[Implementation Plan](./implementation_plan.md)** - Technical design

## 🔧 Configuration

### Backend Environment Variables

```bash
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
TOKEN_EXPIRY_HOURS=1
```

### Agent Environment Variables

```bash
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
DEEPGRAM_API_KEY=your-deepgram-key
OPENAI_API_KEY=your-openai-key
ELEVENLABS_API_KEY=your-elevenlabs-key  # Optional
```

## 🎯 API Endpoints

### Token Generation
```bash
POST /api/token
Content-Type: application/json

{
  "roomName": "my-room",
  "participantName": "John",
  "permissions": {
    "canPublish": true,
    "canSubscribe": true
  }
}
```

### Room Management
```bash
POST /api/rooms/create     # Create room
GET  /api/rooms            # List active rooms
GET  /api/rooms/:name/participants  # List participants
DELETE /api/rooms/:name    # Delete room
```

## 🔒 Security Features

- ✅ **Token-based auth** with JWT
- ✅ **Configurable expiry** (default: 1 hour)
- ✅ **Participant ACLs** (publish/subscribe permissions)
- ✅ **CORS protection**
- ✅ **API key encryption** (server-side only)
- ✅ **Room access control**

## 🌍 Deployment

### LiveKit Cloud (Easiest)
- Sign up: [cloud.livekit.io](https://cloud.livekit.io)
- Free tier: 10,000 participant minutes/month
- No server management needed

### Self-Hosted (Docker)
```bash
docker run --rm livekit/livekit-server \
  --node-ip=<your-public-ip> \
  --port=7880
```

### Backend Deployment
- **Vercel**: `vercel --prod`
- **Heroku**: `git push heroku main`
- **AWS Lambda**: Serverless deployment
- **Docker**: See [SETUP.md](./SETUP.md)

### Agent Deployment
- **AWS EC2/Lambda**
- **Google Cloud Run**
- **Azure Container Instances**
- **DigitalOcean Droplet**

## 📊 Performance

| Metric | Target | Actual |
|--------|--------|--------|
| Voice-to-response latency | < 3s | ~2-3s |
| Track publish latency | < 100ms | ~50-80ms |
| Audio bandwidth | ~100 Kbps | 50-100 Kbps |
| Reconnection time | < 3s | 1-2s |
| Concurrent participants | 10+ | ✅ |

## 🐛 Troubleshooting

### Backend won't start
- ✅ Check `.env` file exists
- ✅ Verify LiveKit credentials
- ✅ Ensure port 3000 is available

### Agent not responding
- ✅ Verify API keys (Deepgram, OpenAI)
- ✅ Check agent is in correct room
- ✅ Enable microphone permissions

### Connection failed
- ✅ Check LiveKit URL is correct
- ✅ Verify token is not expired
- ✅ Check firewall allows WebRTC
- ✅ Try LiveKit Cloud for easier setup

See [TESTING.md](./TESTING.md#debugging-common-issues) for more.

## 🛠️ Tech Stack

**Backend:**
- Express.js (Node.js)
- LiveKit Server SDK
- JWT authentication

**Client:**
- Vanilla JavaScript
- LiveKit Client SDK
- Modern CSS (Glassmorphism)

**AI Agent:**
- Python 3.9+
- LiveKit Agents SDK
- Deepgram (STT)
- OpenAI (LLM & TTS)
- ElevenLabs (Premium TTS)

## 🎓 Use Cases

- 🎧 **Voice AI Assistants**: Customer support, virtual receptionists
- 🎮 **Gaming**: In-game voice chat with AI NPCs
- 📚 **Education**: AI tutors and language learning
- 🏥 **Healthcare**: Telemedicine with AI triage
- 🎪 **Hackathons**: Quick demos (KAVACH, etc.)

## 💡 Advanced Features

### Custom LLM System Prompts
Edit `agent.py`:
```python
system_prompt=(
    "You are a cybersecurity expert AI. "
    "Provide security advice and threat analysis."
)
```

### Voice Activity Detection Tuning
```python
vad=rtc.VAD.create(
    min_speech_duration=0.2,      # Sensitivity
    min_silence_duration=0.8,      # Response delay
    interrupt_min_words=3,         # Interruption threshold
)
```

### Multi-Language Support
```python
# Deepgram supports 30+ languages
stt = deepgram.STT(
    language="es",  # Spanish
    # or "hi-IN" for Hindi, "ml" for Malayalam
)
```

## 📝 License

MIT License - see LICENSE file

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repo
2. Create a feature branch
3. Submit a pull request

## 📞 Support

- 📚 [LiveKit Docs](https://docs.livekit.io/)
- 💬 [Discord Community](https://livekit.io/discord)
- 🐛 [Issue Tracker](https://github.com/livekit/livekit/issues)

## 🌟 Acknowledgments

- **LiveKit** for the amazing WebRTC infrastructure
- **Deepgram** for low-latency speech recognition
- **OpenAI** for powerful language models
- **ElevenLabs** for premium voice synthesis

---

Built with ❤️ for hackathons, KAVACH events, and production deployments.

**Ready to build?** Start with [SETUP.md](./SETUP.md)!
