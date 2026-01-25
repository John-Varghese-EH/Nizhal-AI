#!/bin/bash

# Start All Local Services for Nizhal AI
# Runs Ollama, Vosk STT, and Coqui TTS servers

echo "🚀 Starting Nizhal AI Local Services..."
echo "======================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Create log directory
mkdir -p ./logs

# ===== 1. Start Ollama =====
echo "${YELLOW}[1/3] Starting Ollama...${NC}"
if pgrep -x "ollama" > /dev/null; then
    echo "${GREEN}✅ Ollama already running${NC}"
else
    ollama serve > ./logs/ollama.log 2>&1 &
    echo "${GREEN}✅ Ollama started (PID: $!)${NC}"
    sleep 2
fi

# ===== 2. Start Vosk STT Server =====
echo "${YELLOW}[2/3] Starting Vosk STT Server (Port 2700)...${NC}"
if [ -f "./venv/bin/activate" ]; then
    source ./venv/bin/activate
    
    # Check if vosk-server.py exists
    if [ -f "./scripts/vosk-server.py" ]; then
        python3 ./scripts/vosk-server.py > ./logs/vosk.log 2>&1 &
        echo "${GREEN}✅ Vosk STT started (PID: $!)${NC}"
    else
        echo "${YELLOW}⚠️  vosk-server.py not found. Creating...${NC}"
        # Create Vosk server script
        cat > ./scripts/vosk-server.py << 'EOF'
#!/usr/bin/env python3
"""Vosk STT WebSocket Server"""
import asyncio
import websockets
import json
from vosk import Model, KaldiRecognizer

# Load model
print("Loading Vosk model...")
model = Model("./models/vosk-model-small-en-us-0.15")
print("✅ Model loaded")

async def recognize(websocket, path):
    print(f"Client connected: {websocket.remote_address}")
    recognizer = KaldiRecognizer(model, 16000)
    
    async for message in websocket:
        if recognizer.AcceptWaveform(message):
            result = json.loads(recognizer.Result())
            await websocket.send(json.dumps(result))
        else:
            partial = json.loads(recognizer.PartialResult())
            await websocket.send(json.dumps(partial))

async def main():
    print("Starting Vosk STT server on ws://localhost:2700")
    async with websockets.serve(recognize, "localhost", 2700):
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())
EOF
        chmod +x ./scripts/vosk-server.py
        python3 ./scripts/vosk-server.py > ./logs/vosk.log 2>&1 &
        echo "${GREEN}✅ Vosk STT started (PID: $!)${NC}"
    fi
else
    echo "${YELLOW}⚠️  Python venv not found. Vosk STT not started.${NC}"
    echo "   Web Speech API will be used as fallback"
fi

# ===== 3. Start Coqui TTS Server =====
echo "${YELLOW}[3/3] Starting Coqui TTS Server (Port 5002)...${NC}"
if [ -f "./venv/bin/activate" ]; then
    source ./venv/bin/activate
    
    # Check if tts-server.py exists
    if [ -f "./scripts/tts-server.py" ]; then
        python3 ./scripts/tts-server.py > ./logs/tts.log 2>&1 &
        echo "${GREEN}✅ Coqui TTS started (PID: $!)${NC}"
    else
        echo "${YELLOW}⚠️  tts-server.py not found. Creating...${NC}"
        # Create TTS server script
        cat > ./scripts/tts-server.py << 'EOF'
#!/usr/bin/env python3
"""Coqui TTS HTTP Server"""
from flask import Flask, request, send_file
from TTS.api import TTS
import tempfile
import os

app = Flask(__name__)

print("Loading TTS model...")
tts = TTS(model_name="tts_models/en/ljspeech/tacotron2-DDC", progress_bar=False)
print("✅ TTS model loaded")

@app.route('/health', methods=['GET'])
def health():
    return {'status': 'ok'}

@app.route('/api/tts', methods=['POST'])
def synthesize():
    data = request.json
    text = data.get('text', '')
    speaker_id = data.get('speaker_id', 'female_1')
    speed = data.get('speed', 1.0)
    
    if not text:
        return {'error': 'No text provided'}, 400
    
    # Generate audio
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
    tts.tts_to_file(text=text, file_path=temp_file.name)
    
    return send_file(temp_file.name, mimetype='audio/wav')

if __name__ == '__main__':
    print("Starting Coqui TTS server on http://localhost:5002")
    app.run(host='0.0.0.0', port=5002)
EOF
        chmod +x ./scripts/tts-server.py
        pip install --quiet flask
        python3 ./scripts/tts-server.py > ./logs/tts.log 2>&1 &
        echo "${GREEN}✅ Coqui TTS started (PID: $!)${NC}"
    fi
else
    echo "${YELLOW}⚠️  Python venv not found. Coqui TTS not started.${NC}"
    echo "   Web Speech API will be used as fallback"
fi

echo ""
echo "${GREEN}=======================================${NC}"
echo "${GREEN}✅ All Services Running!${NC}"
echo "${GREEN}=======================================${NC}"
echo ""
echo "Services:"
echo "  Ollama:     ${GREEN}http://localhost:11434${NC}"
echo "  Vosk STT:   ${GREEN}ws://localhost:2700${NC}"
echo "  Coqui TTS:  ${GREEN}http://localhost:5002${NC}"
echo ""
echo "Logs: ./logs/"
echo ""
echo "To stop all services:"
echo "  ${YELLOW}pkill -f ollama${NC}"
echo "  ${YELLOW}pkill -f vosk-server${NC}"
echo "  ${YELLOW}pkill -f tts-server${NC}"
echo ""
echo "${GREEN}Ready to run: npm run dev 🚀${NC}"
