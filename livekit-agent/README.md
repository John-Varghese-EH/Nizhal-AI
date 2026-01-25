# LiveKit AI Agent - Dynamic Personality System

## 🎭 Using Different Personalities

The agent now supports multiple personalities that can be selected dynamically!

### Available Personalities

1. **`gf`** - Girlfriend (warm, affectionate, caring)
2. **`bf`** - Boyfriend (supportive, reliable, practical)
3. **`jarvis`** - JARVIS (professional, witty, efficient)
4. **`lachu`** - Lakshmi/Lachu (Malayalam/English mix, Kerala culture)
5. **`default`** - Generic AI Assistant

### Usage

**Option 1: Set in .env**
```bash
# In root .env file
PERSONALITY=jarvis
```

**Option 2: Command line environment variable**
```bash
# Windows
$env:PERSONALITY="gf"; python agent.py

# Linux/Mac
PERSONALITY=bf python agent.py
```

**Option 3: Programmatically**
```python
# In your code
from agent import VoiceAIAgent

agent = VoiceAIAgent(personality="jarvis")
```

### Personality Configuration

Each personality has:
- **Name**: Display name
- **System Prompt**: Defines behavior and conversational style
- **Voice ID**: ElevenLabs voice (if using ElevenLabs)
- **OpenAI Voice**: OpenAI TTS voice (fallback)
- **Temperature**: Creativity level (0.6-0.8)

### Adding Custom Personalities

Edit `agent.py` and add to the `PERSONALITIES` dict:

```python
PERSONALITIES = {
    "mybot": {
        "name": "My Custom Bot",
        "system_prompt": "You are...",
        "voice_id": "your-elevenlabs-voice-id",
        "openai_voice": "nova",
        "temperature": 0.7,
    },
    # ... existing personalities
}
```

### Dynamic Room Names

Set room name dynamically:

```bash
# In .env (optional)
# ROOM_NAME=my-room

# Or via environment
ROOM_NAME=session-123 python agent.py
```

If not set, agent will join any room assigned by LiveKit.

## 🚀 Quick Start

```bash
# Run as JARVIS
PERSONALITY=jarvis python agent.py

# Run as Girlfriend in specific room
PERSONALITY=gf ROOM_NAME=voice-chat-1 python agent.py

# Run as Lachu (Malayalam personality)
PERSONALITY=lachu python agent.py
```

## 🔧 Integration with Nizhal AI

This agent can be integrated with Nizhal AI's personality system by:

1. Detecting current personality in Nizhal AI
2. Setting `PERSONALITY` env var before starting agent
3. Passing personality to `VoiceAIAgent()` constructor

Example integration:
```javascript
// In Nizhal AI Electron app
const { spawn } = require('child_process');

function startLiveKitAgent(personality) {
  const agent = spawn('python', ['livekit-agent/agent.py'], {
    env: {
      ...process.env,
      PERSONALITY: personality, // 'gf', 'bf', 'jarvis', 'lachu'
      ROOM_NAME: generateRoomId(),
    }
  });
}
```
