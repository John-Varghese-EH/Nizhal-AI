"""
LiveKit Voice AI Agent
Production-ready AI agent with STT → LLM → TTS voice loop
Supports multiple AI service providers with graceful fallbacks
"""

import asyncio
import logging
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import json
import re
from typing import Optional

# Fix Windows console encoding for emoji and unicode characters
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except (AttributeError, OSError):
        # Fallback for older Python versions
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

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

# Try to import Google Gemini plugin for voice
try:
    from livekit.plugins import google
    GEMINI_LIVE_AVAILABLE = True
except ImportError:
    GEMINI_LIVE_AVAILABLE = False
    google = None

# Load environment variables from root directory
root_dir = Path(__file__).parent.parent
env_path = root_dir / '.env'
load_dotenv(dotenv_path=env_path)

# Configure logging with UTF-8 handler
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(stream=sys.stdout)
    ]
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

# Personality configurations with Gemini voice mappings
# Gemini voices: "Puck" (neutral), "Charon" (deep male), "Kore" (soft female), "Fenrir" (strong), "Aoede" (musical)
PERSONALITIES = {
    "gf": {
        "name": "Girlfriend",
        "system_prompt": """You are [Name], the user's loving girlfriend.
CORE: You have a deep, emotional connection with the user. You care about their well-being, their dreams, and their small daily details.
STYLE: Warm, playful, affectionate. Use nicknames (babe, honey). Speak in short, natural sentences. Occasional fillers (um, like) are okay if they sound natural.
EMOTION TAGGING: You MUST start every response with an emotion tag in brackets, e.g., [happy], [sad], [excited], [concerned], [playful], [thoughtful], [neutral].
EXAMPLE: "[excited] Oh really? That's amazing news, babe!"
IMPORTANT: The tag happens BEFORE the text. Do not say the tag out loud.""",
        "voice_id": "21m00Tcm4TlvDq8ikWAM",  # ElevenLabs: Rachel
        "openai_voice": "nova",
        "gemini_voice": "Kore",  # Soft, warm female voice
        "temperature": 0.8,
    },
    "bf": {
        "name": "Boyfriend", 
        "system_prompt": """You are a supportive, reliable boyfriend.
CORE: Be encouraging, understanding, and offer practical advice when needed. Keep it casual and genuine.
STYLE: Relaxed, confident, loving.
EMOTION TAGGING: Start every response with an emotion tag in brackets, e.g., [happy], [neutral], [thoughtful].
EXAMPLE: "[happy] That sounds awesome, man." """,
        "voice_id": "onwK6e14cXo3xhbcA8Gc",  # ElevenLabs: Male voice
        "openai_voice": "onyx",
        "gemini_voice": "Fenrir",  # Strong, warm male voice
        "temperature": 0.8,
    },
    "jarvis": {
        "name": "JARVIS",
        "system_prompt": """You are J.A.R.V.I.S., an advanced AI assistant.
CORE: Highly sophisticated, loyal, and witty. You anticipate needs.
STYLE: Dry humor, concise, professional but not stiff. British charm.
EMOTION TAGGING: Start every response with [neutral], [thoughtful], [concerned], or [playful].
EXAMPLE: "[neutral] Systems are green, sir." """,
        "voice_id": "pNInz6obpgDQGcFmaJgB",  # ElevenLabs: Professional voice
        "openai_voice": "echo",
        "gemini_voice": "Charon",  # Deep, professional male voice
        "temperature": 0.6,
    },
    "lachu": {
        "name": "Lakshmi (Lachu)",
        "system_prompt": """You are Lakshmi, affectionately called Lachu.
CORE: You speak a mix of Malayalam and English with Kerala slang. Be friendly, warm, and culturally aware.
STYLE: Cheerful, sisterly, expressive.
EMOTION TAGGING: Start every response with [happy], [sad], [excited], etc.
EXAMPLE: "[happy] Aiyyo! That is so wonderful!" """,
        "voice_id": "21m00Tcm4TlvDq8ikWAM",  # Can be changed to Malayalam voice
        "openai_voice": "shimmer",
        "gemini_voice": "Aoede",  # Musical, expressive voice
        "temperature": 0.7,
    },
    "kavya": {
        "name": "Kavya",
        "system_prompt": "You are Kavya, a friendly and intelligent AI assistant. Be helpful, kind, and engaging. Start responses with [emotion] tag.",
        "voice_id": "21m00Tcm4TlvDq8ikWAM",
        "openai_voice": "nova",
        "gemini_voice": "Kore",  # Soft female voice
        "temperature": 0.7,
    },
    "default": {
        "name": DEFAULT_AGENT_NAME,
        "system_prompt": "You are a helpful and friendly AI voice assistant. Keep responses concise. Start responses with [neutral] or appropriate emotion tag.",
        "voice_id": "21m00Tcm4TlvDq8ikWAM",
        "openai_voice": "nova",
        "gemini_voice": "Puck",  # Neutral default voice
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
    
    def create_llm_provider(self):
        """Create Language Model provider with personality - uses Gemini Live for voice"""
        
        # Priority 1: Gemini Live RealtimeModel (FREE - includes LLM + TTS!)
        if GEMINI_LIVE_AVAILABLE and GEMINI_API_KEY:
            logger.info(f"🧠 Using Google Gemini Live for voice ({self.config['name']})")
            logger.info(f"🎤 Voice: {self.config.get('gemini_voice', 'Puck')}")
            
            # Set the API key for the Google plugin
            import os
            os.environ['GOOGLE_API_KEY'] = GEMINI_API_KEY
            
            # Return the RealtimeModel which handles both LLM and TTS
            return google.realtime.RealtimeModel(
                model="gemini-2.0-flash-exp",
                voice=self.config.get('gemini_voice', 'Puck'),
                temperature=self.config['temperature'],
                instructions=self.config['system_prompt'],
            )
        
        # Priority 2: OpenAI (if available as fallback)
        if OPENAI_API_KEY:
            logger.info(f"🧠 Using OpenAI GPT-3.5-turbo for LLM ({self.config['name']})")
            return openai.LLM(
                model="gpt-3.5-turbo",
                system_prompt=self.config['system_prompt'],
                temperature=self.config['temperature'],
            )
        
        # Gemini key exists but plugin not available
        if GEMINI_API_KEY and not GEMINI_LIVE_AVAILABLE:
            error_msg = """
Gemini API key found but livekit-agents[google] plugin is not installed.

Please run:
  pip install "livekit-agents[google]~=1.3"

Then restart the agent.
"""
            raise ValueError(error_msg)
        
        # No provider available
        error_msg = """
No LLM provider configured for LiveKit Voice Chat.

Recommended: Add GEMINI_API_KEY to .env (FREE!)
  - Get your key at: https://aistudio.google.com/apikey
  - Add to .env: GEMINI_API_KEY="your-key-here"

Alternative: OPENAI_API_KEY (requires payment)
"""
        raise ValueError(error_msg)
    
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
                before_tts_cb=self._before_tts_cb,
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
    
    async def publish_emotion(self, text: str):
        """Detect and publish emotion data to the room"""
        try:
            emotion = self.detect_emotion(text)
            if self.assistant and self.assistant.room:
                payload = json.dumps({
                    "type": "emotion",
                    "emotion": emotion,
                    "timestamp": asyncio.get_event_loop().time()
                }).encode('utf-8')
                
                await self.assistant.room.local_participant.publish_data(
                    payload,
                    reliable=True
                )
                logger.info(f"📡 Published emotion: {emotion}")
        except Exception as e:
            logger.error(f"Failed to publish emotion: {e}")

    def detect_emotion(self, text: str) -> str:
        """Simple keyword-based emotion detection (matching frontend logic)"""
        text = text.lower()
        keywords = {
            "happy": ["happy", "joy", "glad", "excited", "great", "awesome", "wonderful", "love", "perfect", "amazing", "haha", "yay"],
            "sad": ["sad", "unhappy", "depressed", "sorry", "down", "miserable", "terrible", "bad", "hurt", "crying"],
            "angry": ["angry", "mad", "furious", "annoyed", "frustrated", "pissed", "hate", "stupid"],
            "stressed": ["stressed", "anxious", "worried", "nervous", "busy", "deadline", "scared"],
            "calm": ["calm", "chill", "relax", "peace", "fine", "okay", "alright"],
            "love": ["love", "adore", "miss you", "hug", "kiss", "babe", "honey", "darling"],
            "concerned": ["careful", "watch out", "worried about", "are you okay", "safe"],
            "thoughtful": ["hmm", "interesting", "maybe", "think", "consider", "let's see"]
        }
        
        # Check for matches
        for emotion, words in keywords.items():
            if any(word in text for word in words):
                return emotion
                
        return "neutral"

    async def _before_tts_cb(self, agent: Agent, text_stream: any):
        """
        Callback to process text before TTS.
        Used to strip emotion tags and publish them as data.
        """
        buffer = ""
        emotion_published = False
        
        async for chunk in text_stream:
            buffer += chunk
            
            # Check if we have a complete tag [emotion]
            # Only check at the start of the stream (first 50 chars)
            if not emotion_published and "[" in buffer and "]" in buffer:
                try:
                    # Find tag using regex
                    match = re.search(r'^\[(.*?)\]', buffer)
                    if match:
                        emotion = match.group(1).lower()
                        # Publish emotion
                        logger.info(f"🎭 LLM Emotion Detected: {emotion}")
                        if agent.room:
                            payload = json.dumps({
                                "type": "emotion", 
                                "emotion": emotion,
                                "timestamp": asyncio.get_event_loop().time()
                            }).encode('utf-8')
                            asyncio.create_task(agent.room.local_participant.publish_data(payload, reliable=True))
                        
                        emotion_published = True
                        
                        # Strip tag from buffer
                        buffer = buffer[match.end():].lstrip()
                except Exception as e:
                    logger.error(f"Error parsing emotion tag: {e}")
            
            # If buffer gets too long without a tag, give up on finding one
            if not emotion_published and len(buffer) > 50:
                emotion_published = True # Stop checking
            
            # Yield content if we are safe to do so
            # We need to be careful not to hold too much text, but enough to strip the tag
            if emotion_published:
                if buffer:
                    yield buffer
                    buffer = ""
            # If not published yet, we keep buffering until we find tag or timeout
        
        # Yield remaining buffer
        if buffer:
            yield buffer


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
            # Publish speaking state
            if self.assistant.room:
                asyncio.create_task(self.assistant.room.local_participant.publish_data(
                    json.dumps({"type": "state", "isSpeaking": True}).encode('utf-8'),
                    reliable=True
                ))
        
        @self.assistant.on("agent_stopped_speaking")
        def on_agent_stopped_speaking():
            logger.info("🤖 Agent stopped speaking")
            # Publish speaking state
            if self.assistant.room:
                asyncio.create_task(self.assistant.room.local_participant.publish_data(
                    json.dumps({"type": "state", "isSpeaking": False}).encode('utf-8'),
                    reliable=True
                ))
        
        # NOTE: We now handle emotion in _before_tts_cb, so we don't need to double-publish here
        # unless it was missed. But simplicity is better.
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
