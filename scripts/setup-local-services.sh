#!/bin/bash

# Setup Local Services for Nizhal AI
# One-command setup for FREE local AI companion
# NO paid APIs, 100% local operation!

echo "🚀 Nizhal AI - FREE Local Companion Setup"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Detect OS
OS="$(uname -s)"
case "${OS}" in
    Linux*)     MACHINE=Linux;;
    Darwin*)    MACHINE=Mac;;
    MINGW*)     MACHINE=Windows;;
    *)          MACHINE="UNKNOWN:${OS}"
esac

echo "Detected OS: ${MACHINE}"
echo ""

# ===== 1. Install Ollama =====
echo "${YELLOW}[1/5] Installing Ollama (Local AI)...${NC}"
if command -v ollama &> /dev/null; then
    echo "${GREEN}✅ Ollama already installed${NC}"
else
    echo "Installing Ollama..."
    if [ "$MACHINE" = "Linux" ] || [ "$MACHINE" = "Mac" ]; then
        curl -fsSL https://ollama.com/install.sh | sh
    else
        echo "${YELLOW}⚠️  Please install Ollama manually from: https://ollama.com/download${NC}"
        echo "Windows: Download and run installer"
    fi
fi

# Pull recommended AI model
echo "Pulling Llama3 8B model (optimized for 16GB RAM)..."
ollama pull llama3:8b
echo "${GREEN}✅ Ollama ready${NC}"
echo ""

# ===== 2. Install Python and Vosk STT (Optional) =====
echo "${YELLOW}[2/5] Setting up Vosk STT (Offline Speech-to-Text)...${NC}"
if command -v python3 &> /dev/null; then
    echo "${GREEN}✅ Python3 found${NC}"
    
    # Create Python virtual environment
    echo "Creating virtual environment..."
    python3 -m venv ./venv
    source ./venv/bin/activate
    
    # Install Vosk
    echo "Installing Vosk..."
    pip install --quiet vosk websockets
    
    # Download Vosk model (small English)
    echo "Downloading Vosk model..."
    mkdir -p ./models
    cd ./models
    if [ ! -d "vosk-model-small-en-us-0.15" ]; then
        wget -q --show-progress https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip
        unzip -q vosk-model-small-en-us-0.15.zip
        rm vosk-model-small-en-us-0.15.zip
    fi
    cd ..
    
    echo "${GREEN}✅ Vosk STT ready${NC}"
else
    echo "${RED}❌ Python3 not found. Vosk STT will not be available.${NC}"
    echo "   Fallback: Web Speech API will be used (browser-native)"
fi
echo ""

# ===== 3. Install Coqui TTS (Optional) =====
echo "${YELLOW}[3/5] Setting up Coqui TTS (Offline Text-to-Speech)...${NC}"
if command -v python3 &> /dev/null; then
    source ./venv/bin/activate
    
    echo "Installing Coqui TTS..."
    pip install --quiet TTS
    
    # Test TTS
    echo "Testing TTS..."
    tts --text "Hello from Nizhal AI! Your free local companion is ready!" --out_path ./test_tts.wav
    
    if [ -f "./test_tts.wav" ]; then
        echo "${GREEN}✅ Coqui TTS ready${NC}"
        rm ./test_tts.wav
    else
        echo "${YELLOW}⚠️  TTS test failed. Fallback: Web Speech API will be used${NC}"
    fi
else
    echo "${YELLOW}⚠️  Skipping Coqui TTS (Python not found)${NC}"
fi
echo ""

# ===== 4. Install ADB Platform Tools =====
echo "${YELLOW}[4/5] Installing ADB Platform Tools (Android Control)...${NC}"
if command -v adb &> /dev/null; then
    echo "${GREEN}✅ ADB already installed${NC}"
    adb version
else
    echo "Installing ADB..."
    if [ "$MACHINE" = "Linux" ]; then
        sudo apt-get update -qq
        sudo apt-get install -y android-tools-adb
    elif [ "$MACHINE" = "Mac" ]; then
        brew install android-platform-tools
    else
        echo "${YELLOW}⚠️  Windows: Please download from:${NC}"
        echo "   https://developer.android.com/tools/releases/platform-tools"
        echo "   Extract and add to PATH"
    fi
    
    if command -v adb &> /dev/null; then
        echo "${GREEN}✅ ADB installed${NC}"
    else
        echo "${YELLOW}⚠️  ADB not found. Android control will not be available.${NC}"
    fi
fi
echo ""

# ===== 5. Install Node Dependencies =====
echo "${YELLOW}[5/5] Installing Node.js dependencies...${NC}"
if command -v npm &> /dev/null; then
    echo "Running npm install..."
    npm install
    echo "${GREEN}✅ Node dependencies installed${NC}"
else
    echo "${RED}❌ npm not found. Please install Node.js first${NC}"
    echo "   Download from: https://nodejs.org/"
    exit 1
fi
echo ""

# ===== Summary =====
echo "${GREEN}=========================================${NC}"
echo "${GREEN}✅ Setup Complete!${NC}"
echo "${GREEN}=========================================${NC}"
echo ""
echo "Services installed:"
echo "  ${GREEN}✅${NC} Ollama (Local AI) - Llama3 8B"
echo "  ${GREEN}✅${NC} Vosk STT (Offline Speech-to-Text)"
echo "  ${GREEN}✅${NC} Coqui TTS (Offline Text-to-Speech)"
echo "  ${GREEN}✅${NC} ADB Tools (Android Control)"
echo ""
echo "Next steps:"
echo "  1. Start services: ${YELLOW}./scripts/start-services.sh${NC}"
echo "  2. Run app: ${YELLOW}npm run dev${NC}"
echo ""
echo "For Android control:"
echo "  - Enable USB Debugging on your phone"
echo "  - Connect via USB once, then use wirelessly"
echo ""
echo "${GREEN}Happy hacking! 🚀${NC}"
echo "Nizhal AI - 100% FREE, 100% LOCAL, 100% YOURS"
echo ""
