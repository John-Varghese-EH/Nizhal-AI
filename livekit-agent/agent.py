"""
LiveKit Voice AI Agent
Production-ready AI agent with STT → LLM → TTS voice loop
Supports multiple AI service providers with graceful fallbacks
"""

import asyncio
import logging
import os
from pathlib import Path
from dotenv import load_dotenv
from typing import Optional

from livekit import rtc
from livekit.agents import (
    AutoSubscribe,
    JobContext,
    WorkerOptions,
    WorkerType,
    cli,
    llm,
    stt,
    tts,
)
from livekit.agents.voice import Agent
from livekit.plugins import deepgram, openai, elevenlabs

# Load environment variables from root directory
root_dir = Path(__file__).parent.parent
env_path = root_dir / '.env'
load_dotenv(dotenv_path=env_path)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration from environment
LIVEKIT_URL = os.getenv("LIVEKIT_URL")
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET")

# AI Service API Keys
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")  # Free tier: 1,500 requests/day
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

# Agent configuration (dynamic defaults)
DEFAULT_AGENT_NAME = os.getenv("AGENT_NAME", "AI Assistant")
DEFAULT_ROOM_NAME = os.getenv("ROOM_NAME")  # None = join any room

# Personality configurations
PERSONALITIES = {
    "gf": {
        "name": "Girlfriend",
        "system_prompt": "You are a caring, supportive girlfriend. Be warm, affectionate, and genuinely interested in the user's day. Use casual, friendly language.",
        "voice_id": "21m00Tcm4TlvDq8ikWAM",  # ElevenLabs: Rachel
        "openai_voice": "nova",
        "temperature": 0.8,
    },
    "bf": {
        "name": "Boyfriend", 
        "system_prompt": "You are a supportive, reliable boyfriend. Be encouraging, understanding, and offer practical advice when needed. Keep it casual and genuine.",
        "voice_id": "onwK6e14cXo3xhbcA8Gc",  # ElevenLabs: Male voice
        "openai_voice": "onyx",
        "temperature": 0.8,
    },
    "jarvis": {
        "name": "JARVIS",
        "system_prompt": "You are JARVIS, an advanced AI assistant modeled after Tony Stark's AI. Be professional, efficient, and slightly witty. Provide concise, helpful responses with a touch of sophisticated humor.",
        "voice_id": "pNInz6obpgDQGcFmaJgB",  # ElevenLabs: Professional voice
        "openai_voice": "echo",
        "temperature": 0.6,
    },
    "lachu": {
        "name": "Lakshmi (Lachu)",
        "system_prompt": "You are Lakshmi, affectionately called Lachu. You speak a mix of Malayalam and English with Kerala slang. Be friendly, warm, and culturally aware. Provide emotional support with a Kerala perspective.",
        "voice_id": "21m00Tcm4TlvDq8ikWAM",  # Can be changed to Malayalam voice
        "openai_voice": "shimmer",
        "temperature": 0.7,
    },
    "kavya": {
        "name": "Kavya",
        "system_prompt": "You are Kavya, a friendly and intelligent AI assistant. Be helpful, kind, and engaging in your responses.",
        "voice_id": "21m00Tcm4TlvDq8ikWAM",
        "openai_voice": "nova",
        "temperature": 0.7,
    },
    "default": {
        "name": DEFAULT_AGENT_NAME,
        "system_prompt": "You are a helpful and friendly AI voice assistant. Keep responses concise and conversational.",
        "voice_id": "21m00Tcm4TlvDq8ikWAM",
        "openai_voice": "nova",
        "temperature": 0.7,
    }
}


def validate_environment():
    """Validate required environment variables"""
    required = {
        "LIVEKIT_URL": LIVEKIT_URL,
        "LIVEKIT_API_KEY": LIVEKIT_API_KEY,
        "LIVEKIT_API_SECRET": LIVEKIT_API_SECRET,
    }
    
    missing = [key for key, value in required.items() if not value]
    if missing:
        raise ValueError(f"Missing required environment variables: {', '.join(missing)}")
    
    # Check at least one service for each component
    if not DEEPGRAM_API_KEY:
        logger.warning("⚠️ DEEPGRAM_API_KEY not set - STT will not work")
    
    if not GEMINI_API_KEY and not OPENAI_API_KEY:
        logger.warning("⚠️ No LLM configured - Set GEMINI_API_KEY (FREE) or OPENAI_API_KEY")
    
    if not OPENAI_API_KEY and not ELEVENLABS_API_KEY:
        logger.warning("⚠️ No TTS configured - Set OPENAI_API_KEY or ELEVENLABS_API_KEY")


class VoiceAIAgent:
    """Voice AI Agent orchestrator with personality support"""
    
    def __init__(self, personality: str = "default"):
        """
        Initialize agent with specific personality
        
        Args:
            personality: One of 'gf', 'bf', 'jarvis', 'lachu', or 'default'
        """
        self.personality = personality if personality in PERSONALITIES else "default"
        self.config = PERSONALITIES[self.personality]
        self.assistant: Optional[Agent] = None
        
        logger.info(f"🤖 Initialized agent with personality: {self.config['name']}")
        
    def create_stt_provider(self) -> stt.STT:
        """Create Speech-to-Text provider"""
        if DEEPGRAM_API_KEY:
            # Deepgram free tier: 200 hours/month (very generous!)
            logger.info("🎤 Using Deepgram for STT")
            return deepgram.STT(
                api_key=DEEPGRAM_API_KEY,
                model="nova-2-general",  # Latest, most accurate model
                language="en-US",
                smart_format=True,  # Better punctuation and formatting
                interim_results=True,  # Faster response
            )
        
        # FREE ALTERNATIVES (100% local, no API keys):
        # 1. Whisper (OpenAI's open-source model, runs locally)
        #    pip install openai-whisper
        #    from livekit.plugins import whisper
        #    return whisper.STT(model="base")  # or "small", "medium", "large"
        # 
        # 2. Vosk (lightweight, good for low-resource devices)
        #    pip install vosk
        
        raise ValueError("No STT provider configured. Set DEEPGRAM_API_KEY (200 free hours/month) or use local Whisper.")
    
    def create_llm_provider(self) -> llm.LLM:
        """Create Language Model provider with personality"""
        
        # Priority 1: Gemini (FREE tier: 1,500 requests/day, very generous!)
        if GEMINI_API_KEY:
            logger.info(f"🧠 Using Google Gemini 2.0 Flash for LLM ({self.config['name']})")
            # Note: LiveKit doesn't have native Gemini plugin yet
            # You can use google-generativeai SDK directly or wait for plugin
            # For now, we'll fall through to OpenAI
            logger.warning("⚠️ Gemini plugin not yet available, using OpenAI instead")
        
        # Priority 2: OpenAI GPT-3.5-turbo (low cost, reliable)
        if OPENAI_API_KEY:
            # Using GPT-3.5-turbo: 10x cheaper than GPT-4, faster, and still very capable
            # Cost: ~$0.001/1K tokens (vs GPT-4: ~$0.01/1K tokens)
            logger.info(f"🧠 Using OpenAI GPT-3.5-turbo for LLM ({self.config['name']})")
            return openai.LLM(
                model="gpt-3.5-turbo",  # Free tier friendly, fast, reliable
                system_prompt=self.config['system_prompt'],
                temperature=self.config['temperature'],
            )
        
        # FREE ALTERNATIVES (no API key needed):
        # 1. Ollama with Llama 3.1/Mistral (local, 100% free)
        #    pip install ollama
        #    ollama pull llama3.1
        #    return ollama.LLM(model="llama3.1")
        # 
        # 2. LM Studio (local GUI, 100% free)
        #    Download from lmstudio.ai
        
        raise ValueError("No LLM provider configured. Set GEMINI_API_KEY (FREE) or OPENAI_API_KEY, or use local models (Ollama/LM Studio).")
    
    def create_tts_provider(self) -> tts.TTS:
        """Create Text-to-Speech provider with personality voice"""
        
        # Priority 1: OpenAI TTS (included with OpenAI API, no extra cost)
        if OPENAI_API_KEY:
            logger.info(f"🔊 Using OpenAI TTS ({self.config['name']} voice)")
            return openai.TTS(
                model="tts-1",  # Fast model, good quality
                voice=self.config['openai_voice'],
                speed=1.0,
            )
        
        # Priority 2: ElevenLabs (premium quality, optional)
        if ELEVENLABS_API_KEY:
            logger.info(f"🔊 Using ElevenLabs TTS ({self.config['name']} voice)")
            return elevenlabs.TTS(
                api_key=ELEVENLABS_API_KEY,
                model_id="eleven_turbo_v2",
                voice_id=self.config['voice_id'],
                optimize_streaming_latency=4,
            )
        
        # FREE ALTERNATIVES (100% local, no API keys):
        # 1. Coqui TTS (local, high quality)
        #    pip install TTS
        #    from livekit.plugins import coqui
        #    return coqui.TTS()
        # 
        # 2. Piper TTS (local, fast, lightweight)
        #    Very efficient for edge devices
        
        raise ValueError("No TTS provider configured. Set OPENAI_API_KEY for included TTS, or use local options (Coqui/Piper).")
    
    async def entrypoint(self, ctx: JobContext):
        """Main agent entry point - called when agent joins a room"""
        logger.info(f"🚀 Agent starting in room: {ctx.room.name}")
        
        try:
            # Initialize AI providers
            stt_provider = self.create_stt_provider()
            llm_provider = self.create_llm_provider()
            tts_provider = self.create_tts_provider()
            
            # Create voice assistant using the modern Agent API
            self.assistant = Agent(
                instructions=self.config['system_prompt'],
                stt=stt_provider,
                llm=llm_provider,
                tts=tts_provider,
                # Voice activity detection (VAD) settings
                vad=rtc.VAD.create(
                    min_speech_duration=0.1,  # Minimum speech duration (seconds)
                    min_silence_duration=0.5,  # Silence to end utterance (seconds)
                    prefix_padding_duration=0.3,  # Audio before speech starts
                    max_buffered_speech=60.0,  # Max speech buffer (seconds)
                ),
                # Interruption handling
                allow_interruptions=True,
                interrupt_min_words=2,  # Min words before allowing interruption
            )
            
            # Setup event listeners
            self.setup_event_listeners()
            
            # Connect to room
            await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
            logger.info("✅ Agent connected to room")
            
            # Start the voice assistant
            self.assistant.start(ctx.room)
            logger.info("✅ Voice assistant started - ready for conversation!")
            
            # Initial greeting (optional)
            await self.assistant.say(
                f"Hello! I'm {self.config['name']}. How can I help you today?",
                allow_interruptions=True
            )
            
        except Exception as e:
            logger.error(f"❌ Agent error: {e}", exc_info=True)
            raise
    
    def setup_event_listeners(self):
        """Setup event listeners for the voice assistant"""
        
        @self.assistant.on("user_started_speaking")
        def on_user_started_speaking():
            logger.info("🗣️ User started speaking")
        
        @self.assistant.on("user_stopped_speaking")
        def on_user_stopped_speaking():
            logger.info("🤫 User stopped speaking")
        
        @self.assistant.on("agent_started_speaking")
        def on_agent_started_speaking():
            logger.info("🤖 Agent started speaking")
        
        @self.assistant.on("agent_stopped_speaking")
        def on_agent_stopped_speaking():
            logger.info("🤖 Agent stopped speaking")
        
        @self.assistant.on("user_speech_committed")
        def on_user_speech_committed(msg: llm.ChatMessage):
            logger.info(f"💬 User: {msg.content}")
        
        @self.assistant.on("agent_speech_committed")
        def on_agent_speech_committed(msg: llm.ChatMessage):
            logger.info(f"🤖 Agent: {msg.content}")
        
        @self.assistant.on("error")
        def on_error(error: Exception):
            logger.error(f"❌ Assistant error: {error}", exc_info=True)


def main(personality: str = None):
    """
    Main function to run the agent worker
    
    Args:
        personality: Personality to use ('gf', 'bf', 'jarvis', 'lachu')
                    If None, uses PERSONALITY env var or 'default'
    """
    try:
        # Validate environment
        validate_environment()
        
        # Get personality from args, env, or default
        selected_personality = (
            personality or 
            os.getenv("PERSONALITY", "default")
        )
        
        logger.info("=" * 50)
        logger.info("🎙️ LiveKit Voice AI Agent")
        logger.info(f"🏠 LiveKit URL: {LIVEKIT_URL}")
        logger.info(f"🎭 Personality: {PERSONALITIES[selected_personality]['name']}")
        if DEFAULT_ROOM_NAME:
            logger.info(f"🚪 Room: {DEFAULT_ROOM_NAME}")
        logger.info("=" * 50)
        
        # Create agent instance with personality
        agent = VoiceAIAgent(personality=selected_personality)
        
        # Start worker
        cli.run_app(
            WorkerOptions(
                entrypoint_fnc=agent.entrypoint,
                # Worker will automatically join rooms or wait for assignments
                request_fnc=None,
                # Worker configuration
                worker_type=WorkerType.ROOM,
            )
        )
        
    except KeyboardInterrupt:
        logger.info("\n👋 Agent shutting down...")
    except Exception as e:
        logger.error(f"❌ Fatal error: {e}", exc_info=True)
        raise


if __name__ == "__main__":
    # Run the agent
    main()
