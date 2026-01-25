# Product Requirements Document (PRD)
## Nizhal AI - Desktop Companion

**Version:** 1.0.0  
**Last Updated:** January 22, 2026  
**Document Owner:** Nizhal AI Team  
**Status:** Active Development

---

## 📋 Executive Summary

**Nizhal AI** is a commercial-grade desktop companion application that brings emotional intelligence and multi-persona AI interactions to your desktop. The name "Nizhal" (നിഴൽ) means "shadow" in Malayalam, symbolizing a faithful companion that stays by your side.

### Vision Statement
Create a deeply personalized AI companion that understands emotions, remembers conversations, adapts to user preferences, and provides a delightful, culturally-aware interaction experience through stunning visual interfaces.

### Product Goals
1. **Emotional Connection**: Build genuine relationships through emotional intelligence and memory
2. **Cultural Inclusivity**: Support regional languages and cultural nuances (Manglish, Tanglish, Hinglish)
3. **Visual Excellence**: Provide AAA-quality visual experiences with VRM avatars and modern UI
4. **Privacy First**: Offer local AI processing with optional cloud fallback
5. **Monetization**: Sustainable revenue through persona marketplace and premium features

---

## 🎯 Target Audience

### Primary Users
- **Tech-savvy individuals** (18-35 years) who appreciate AI assistants
- **Students and professionals** seeking productivity companions
- **Anime/gaming enthusiasts** who want personalized desktop characters
- **Regional language speakers** (Malayalam, Tamil, Telugu, Hindi) seeking culturally-aware AI

### User Personas

#### Persona 1: "The Student"
- **Age:** 20-25
- **Needs:** Study companion, task management, emotional support
- **Pain Points:** Loneliness, productivity struggles, generic AI interactions
- **Use Case:** Uses Kavya persona for friendly Manglish conversations during study sessions

#### Persona 2: "The Professional"
- **Age:** 25-40
- **Needs:** Technical assistant, system control, productivity automation
- **Pain Points:** Needs quick access to system functions, professional tone
- **Use Case:** Uses Jarvis for voice-controlled system management and work assistance

#### Persona 3: "The Enthusiast"
- **Age:** 18-30
- **Needs:** Entertainment, anime character interactions, customization
- **Pain Points:** Wants unique desktop experiences, collectible characters
- **Use Case:** Purchases premium personas like Naruto or Goku for fun interactions

---

## ✨ Core Features

### 1. Multi-Persona System

#### Description
Users can switch between different AI personalities, each with unique characteristics, voices, and interaction styles.

#### Included Personas (v1.0)
- **Jarvis** - Technical, protective, formal AI assistant
- **Kavya** - Caring female friend (Authentic Kerala Manglish)
- **Arjun** - Reliable male friend (Authentic Kerala Manglish)

#### Premium Personas (Marketplace)
- **Naruto** - Energetic Ninja
- **Goku** - Saiyan Warrior
- **Elsa** - Snow Queen
- **Nanban** - Tamil friend (Tanglish)
- **Sneha** - Telugu friend (Tenglish)
- **Dost** - Hindi friend (Hinglish)

#### Requirements
- [ ] Seamless persona switching without app restart
- [ ] Persistent persona state across sessions
- [ ] License validation for premium personas
- [ ] Voice pack integration per persona

---

### 2. Emotional Intelligence Engine

#### Description
Advanced personality system that tracks affection, trust, professionalism, and dynamically adjusts mood and response tone.

#### Emotional Metrics
- **Affection** (0-100): Friendship level
- **Trust** (0-100): Confidence in user
- **Professionalism** (0-100): Formality level
- **Energy** (0-100): Activity level (decays with use, recovers with rest)

#### Mood States
- Happy, Neutral, Concerned, Protective, Playful, Thoughtful

#### Requirements
- [ ] Track interaction history and sentiment
- [ ] Decay mechanics for realistic relationship dynamics
- [ ] Mood visualization in UI
- [ ] Conversation depth tracking (casual vs. deep topics)

---

### 3. Premium Visual Experiences

#### Jarvis HUD Mode
- Three.js holographic interface
- Animated particle systems
- Reactive to system events and voice commands
- Click-through transparency with toggle interaction (Alt+Space)

#### Companion Orb Visualization
- Mood-reactive morphing sphere
- Glassmorphism effects
- Smooth animations with Framer Motion
- Color-coded emotional states

#### VRM Avatar Support
- Load custom VRM 0.0 & 1.0 models
- Model3D rendering with react-three/fiber
- Lip-sync animations (basic)
- Pose/expression support

#### Requirements
- [ ] 60 FPS performance for all visual modes
- [ ] Low resource usage (< 200MB RAM for orb, < 400MB for VRM)
- [ ] Smooth transitions between visual modes
- [ ] Support for high-DPI displays

---

### 4. AI & Voice Integration

#### AI Providers (Priority Order)
1. **Ollama** (Local, Privacy-focused) - Default
2. **Google Gemini** (Cloud, Low-end device fallback)
3. **OpenAI** (Cloud, Optional)
4. **Anthropic Claude** (Cloud, Optional)

#### Voice Synthesis
- **Web Speech API** (Free, built-in)
- **ElevenLabs** (Premium, natural voices)

#### Requirements
- [ ] Automatic provider selection based on availability
- [ ] Fallback chain if primary provider fails
- [ ] API key management in settings
- [ ] Voice selection per persona
- [ ] Real-time streaming responses

---

### 5. Memory & Context System

#### Description
JSON-RAG (Retrieval Augmented Generation) system that remembers conversations, user preferences, and builds long-term context.

#### Capabilities
- Conversation history (last 50 messages)
- Semantic search for memory recall
- User preference storage (privacy mode, themes, etc.)
- Cross-session persistence

#### Requirements
- [ ] Encrypted local storage
- [ ] Privacy mode to disable memory
- [ ] Memory export/import for backup
- [ ] Search functionality in chat history

---

### 6. Desktop Integration

#### Dual-Window Architecture
- **Character Window**: Transparent overlay, always-on-top optional
- **Chat Window**: Standard windowed interface with full controls

#### System Controls (Jarvis Mode)
- Volume control
- Brightness control (platform-dependent)
- Application launcher
- System information display

#### Productivity Features
- **Zen Mode** (Ctrl+Shift+Z): Focus timer
- **Time Report** (Ctrl+Shift+T): Activity summary
- **Health Check** (Ctrl+Shift+H): Reminder to take breaks

#### Requirements
- [ ] Single-instance application (prevent duplicates)
- [ ] Deep linking support (`nizhal://` protocol)
- [ ] System tray with quick actions
- [ ] Global hotkeys for quick access

---

### 7. Persona Marketplace

#### Description
In-app store for purchasing premium personas, voice packs, and visual themes.

#### Payment Gateways
- **Razorpay** (India, primary)
- **Stripe** (International)

#### License Management
- Encrypted license key validation
- Persistent unlock status
- Download management for large assets

#### Requirements
- [ ] Secure payment processing
- [ ] License key generation and validation
- [ ] Automatic persona installation post-purchase
- [ ] Purchase history and receipts

---

## 🔒 Privacy & Security

### Privacy Commitments
1. **Local-First**: Default to Ollama for offline AI processing
2. **User Control**: Privacy mode to disable all memory/tracking
3. **Encryption**: Sensitive data (licenses, API keys) encrypted at rest
4. **No Telemetry**: No usage tracking without explicit consent

### Security Requirements
- [ ] Sandboxed renderer processes (Electron best practices)
- [ ] CSP (Content Security Policy) for web content
- [ ] No eval() or remote code execution
- [ ] Signed and notarized builds (macOS)
- [ ] Code signing (Windows)

---

## 📊 Success Metrics

### Launch Metrics (Month 1)
- **Downloads**: 1,000+ organic installations
- **DAU (Daily Active Users)**: 30% of total users
- **Average Session Duration**: 15+ minutes
- **Persona Switches**: 3+ per user per week

### Growth Metrics (Month 3)
- **User Retention**: 40% week-over-week retention
- **Marketplace Revenue**: $500+ MRR (Monthly Recurring Revenue)
- **Premium Persona Sales**: 10% conversion rate
- **User Ratings**: 4.5+ stars (GitHub, Product Hunt)

### Engagement Metrics
- **Conversation Depth**: Average 20+ messages per session
- **Emotional Bond**: 60% of users reach "Trusted Friend" level
- **Feature Adoption**: 70% try VRM models, 50% use voice

---

## 🚫 Out of Scope (v1.0)

- Mobile applications (iOS/Android)
- Web version
- Multi-user support (shared personas)
- Advanced 3D scene environments
- Plugin/extension system
- Multiplayer/social features

---

## 📅 Release Timeline

### Phase 1: Alpha (Current)
- Core features functional
- Basic UI/UX
- Local testing

### Phase 2: Beta (Q1 2026)
- Marketplace integration
- Payment gateway testing
- Community testing (50-100 users)

### Phase 3: v1.0 Launch (Q2 2026)
- Public release (GitHub, Product Hunt)
- Marketing campaign
- Documentation finalized

### Phase 4: Post-Launch (Q3 2026)
- Bug fixes based on feedback
- Performance optimizations
- New persona packs (quarterly releases)

---

## 🔧 Technical Constraints

- **Platforms**: Windows, macOS, Linux (Electron 33.x)
- **Minimum System Requirements**:
  - 4GB RAM
  - 500MB storage
  - OpenGL 3.3+ (for 3D rendering)
  - Node.js 20+ (development)
- **Recommended for VRM Models**:
  - 8GB RAM
  - Dedicated GPU
  - Ollama with 7B-8B parameter models

---

## 📝 Open Questions & Decisions Needed

> [!NOTE]
> These require stakeholder/user feedback before finalization.

1. **Pricing Strategy**: Should premium personas be one-time purchases or subscription-based?
2. **Cloud Sync**: Should we add cloud sync for conversations across devices?
3. **Mobile Companion**: Interest in a mobile companion app to check status?
4. **API Access**: Should we expose an API for third-party integrations?
5. **Community Personas**: Allow users to create and sell custom personas?

---

## 📚 References

- [GitHub Repository](https://github.com/John-Varghese-EH/Nizhal-AI)
- [Deployment Guide](../DEPLOYMENT.md)
- [Privacy Policy](../PRIVACY_POLICY.md)
- [Terms of Service](../TERMS_OF_SERVICE.md)

---

**Document Approval:**
- [ ] Product Manager
- [ ] Engineering Lead
- [ ] Design Lead
- [ ] Community Feedback (Beta Users)
