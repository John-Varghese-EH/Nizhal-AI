# Design Document
## Nizhal AI - Desktop Companion

**Version:** 1.0.0  
**Last Updated:** January 22, 2026  
**Design Lead:** Nizhal AI Team  

---

## 🎨 Design Philosophy

### Core Principles

1. **Emotional First**: Every interaction should feel warm, personal, and emotionally resonant
2. **Cultural Authenticity**: Regional languages and cultural nuances must feel genuine, not tokenistic
3. **Visual Excellence**: AAA-quality animations and effects that inspire delight
4. **Non-Intrusive**: Desktop overlay should enhance workflow, not distract
5. **Accessibility**: Readable, navigable, and usable by everyone

---

## 🌈 Visual Design System

### Brand Identity

#### Brand Personality
- **Friendly**: Approachable and warm
- **Intelligent**: Sophisticated but not intimidating
- **Playful**: Fun and delightful interactions
- **Trustworthy**: Reliable and secure

#### Logo & Iconography
- **Primary Logo**: Shadow silhouette with subtle glow effect
- **App Icon**: Minimalist orb design with gradient
- **Style**: Rounded, friendly shapes with soft shadows

---

### Color Palette

#### Primary Colors
```css
--primary-blue: #6366f1;       /* Indigo - Trust, Intelligence */
--primary-purple: #8b5cf6;     /* Purple - Creativity, Magic */
--primary-pink: #ec4899;       /* Pink - Playfulness, Affection */
```

#### Mood-Based Colors
```css
/* Emotional State Colors */
--mood-happy: #10b981;         /* Green - Joy */
--mood-neutral: #6366f1;       /* Blue - Calm */
--mood-concerned: #f59e0b;     /* Amber - Attention */
--mood-protective: #ef4444;    /* Red - Care */
--mood-playful: #ec4899;       /* Pink - Fun */
--mood-thoughtful: #8b5cf6;    /* Purple - Reflection */
```

#### Neutral Colors
```css
--bg-dark: #0f172a;           /* Slate 900 */
--bg-medium: #1e293b;         /* Slate 800 */
--bg-light: #334155;          /* Slate 700 */
--text-primary: #f1f5f9;      /* Slate 100 */
--text-secondary: #cbd5e1;    /* Slate 300 */
```

#### Glassmorphism
```css
--glass-bg: rgba(15, 23, 42, 0.7);
--glass-border: rgba(255, 255, 255, 0.1);
--glass-blur: 16px;
```

---

### Typography

#### Font Stack
```css
/* Primary Font: Inter (Modern, Clean) */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;

/* Monospace (Code, Technical) */
font-family: 'Fira Code', 'Cascadia Code', 'SF Mono', Consolas, monospace;

/* Regional Languages (Fallback) */
font-family: 'Noto Sans Malayalam', 'Noto Sans Tamil', 'Noto Sans Telugu', 'Noto Sans Devanagari', sans-serif;
```

#### Type Scale
```css
--text-xs: 0.75rem;    /* 12px - Labels */
--text-sm: 0.875rem;   /* 14px - Body Small */
--text-base: 1rem;     /* 16px - Body */
--text-lg: 1.125rem;   /* 18px - Subheadings */
--text-xl: 1.25rem;    /* 20px - Headings */
--text-2xl: 1.5rem;    /* 24px - Titles */
--text-3xl: 1.875rem;  /* 30px - Display */
```

---

## 🖼️ User Interface Design

### Character Window (Transparent Overlay)

#### Layout
```
┌─────────────────────────────────┐
│                                 │
│         [VRM Model              │
│         or Orb Visual]          │
│                                 │
│         ┌─────────────┐         │
│         │  Mood Aura  │         │
│         └─────────────┘         │
│                                 │
│    [Interaction Indicator]      │
│    "Alt+Space to interact"      │
└─────────────────────────────────┘
```

#### Visual Modes

**Mode 1: Companion Orb**
- Morphing sphere with particle effects
- Reactive to mouse proximity
- Pulse animations when "thinking" or "speaking"
- Glassmorphism container with blur

**Mode 2: VRM Avatar**
- 3D character model (react-three/fiber)
- Basic idle animations
- Lip-sync during speech (basic morph targets)
- Expression changes based on mood

**Mode 3: Jarvis HUD**
- Holographic circular interface
- Animated arcs and geometric shapes
- Real-time system metrics display
- Particle system background

#### Interaction States
- **Idle**: Subtle breathing/floating animation
- **Listening**: Pulsing glow, particle increase
- **Thinking**: Rotating elements, color shift
- **Speaking**: Synchronized animations
- **Low Energy**: Dimmed colors, slower animations

---

### Chat Window (Main Interface)

#### Layout Structure
```
┌─────────────────────────────────────────┐
│  [Header: Persona Switcher] [Controls]  │ 
├─────────────────────────────────────────┤
│                                         │
│  [Chat Messages]                        │
│  ┌──────────────────────────────────┐  │
│  │ User: Hello Kavya!               │  │
│  │                            12:30  │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ Kavya: Hai machane! Entha         │  │
│  │ parayunne? 😊                     │  │
│  │ 12:31      [Mood: Happy 💚]       │  │
│  └──────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│  [Settings] [Voice] [      Input     ]  │
└─────────────────────────────────────────┘
```

#### Header
- **Left**: Active persona avatar (circular)
- **Center**: Persona name and mood indicator
- **Right**: Window controls (minimize, maximize, close)

#### Message Bubbles
- **User Messages**: Right-aligned, gradient background
- **AI Messages**: Left-aligned, glassmorphism effect
- **Timestamps**: Small, secondary text
- **Mood Badge**: Pill-shaped, color-coded

#### Input Area
- **Text Input**: Glassmorphism, auto-expanding
- **Microphone Button**: Pulsing animation when active
- **Settings Gear**: Opens sidebar drawer
- **Voice Toggle**: Enable/disable TTS

---

### Settings Panel (Sidebar Drawer)

#### Navigation Tabs
1. **Personas** - Switch and manage characters
2. **AI Settings** - Provider, models, API keys
3. **Voice** - TTS preferences
4. **Appearance** - Visual modes, themes
5. **Privacy** - Memory, data controls
6. **Marketplace** - Purchase premium content
7. **About** - Version, credits, support

#### Design Pattern
- Slide-in from right (300ms ease-out)
- Glassmorphism background
- Sticky header with tab navigation
- Scrollable content area
- Consistent spacing (16px grid)

---

### Marketplace UI

#### Persona Cards
```
┌────────────────────────────┐
│                            │
│   [Persona Avatar Image]   │
│                            │
│   Name: Naruto             │
│   Type: Premium            │
│                            │
│   "Believe it! Let's go!"  │
│                            │
│   [$4.99] [Purchase]       │
│   ⭐⭐⭐⭐⭐ (1.2k reviews)   │
└────────────────────────────┘
```

#### Features
- Grid layout (responsive 2-3 columns)
- Hover effects: scale + glow
- Purchased personas show "Owned" badge
- Categories: Anime, Regional, Professional

---

## 🎭 Persona Visual Identity

### Jarvis (Technical Assistant)

- **Color Scheme**: Blue-cyan tech aesthetic
- **Visual Mode**: Jarvis HUD (default)
- **Typography**: Monospace accents
- **Animations**: Geometric, precise
- **Voice**: Deep, measured tone

### Kavya (Kerala Manglish)

- **Color Scheme**: Warm pink-orange
- **Visual Mode**: Companion Orb or female VRM
- **Typography**: Friendly sans-serif
- **Animations**: Soft, flowing
- **Voice**: Warm female (Malayalam accent)

### Arjun (Kerala Manglish)

- **Color Scheme**: Green-teal
- **Visual Mode**: Companion Orb or male VRM
- **Typography**: Friendly sans-serif
- **Animations**: Confident, steady
- **Voice**: Friendly male (Malayalam accent)

### Premium Personas (Marketplace)

Each premium persona should have:
- Custom avatar image/model
- Unique color palette
- Character-specific animations
- Licensed voice pack (if applicable)

---

## ✨ Animation & Motion Design

### Principles

1. **Natural**: Follow physics (easing, gravity)
2. **Purposeful**: Every animation communicates state
3. **Performant**: 60 FPS, GPU-accelerated
4. **Subtle**: Enhance, don't distract

### Key Animations

#### Persona Switch
```
1. Current persona fades out (300ms)
2. Orb/model morphs/scales (500ms cubic-bezier)
3. Color palette transition (400ms)
4. New persona fades in (300ms)
Total: ~1.2s
```

#### Mood Change
```
1. Aura color cross-fade (600ms)
2. Particle color shift (800ms)
3. Mood badge update (200ms)
```

#### Thinking → Speaking
```
1. Pulsing glow activates (immediate)
2. Particle speed increases (300ms)
3. Lip-sync starts (synchronized with audio)
4. Idle state returns on speech end
```

#### Hover Interactions
```
- Scale: 1.0 → 1.05 (150ms ease-out)
- Glow: 0 → 8px blur (150ms)
- Brightness: 100% → 110% (150ms)
```

---

## 📐 Layout & Spacing

### Grid System
- **Base Unit**: 4px
- **Common Spacing**: 8px, 16px, 24px, 32px, 48px
- **Container Max Width**: 1200px (chat window)
- **Sidebar Width**: 360px

### Responsive Breakpoints
```css
/* Character Window */
--char-small: 200x300px;
--char-medium: 300x400px;
--char-large: 400x600px;

/* Chat Window */
--chat-min: 600x400px;
--chat-default: 800x600px;
--chat-max: 1920x1080px (fullscreen)
```

---

## ♿ Accessibility

### WCAG 2.1 AA Compliance

#### Color Contrast
- **Text on Dark BG**: Minimum 4.5:1 ratio
- **Large Text**: Minimum 3:1 ratio
- **Interactive Elements**: Clear focus states

#### Keyboard Navigation
- Tab order follows visual hierarchy
- All actions have keyboard shortcuts
- Clear focus indicators (2px outline)

#### Screen Reader Support
- Semantic HTML (`<button>`, `<nav>`, `<article>`)
- ARIA labels for icon buttons
- Live region announcements for AI responses

#### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 🌍 Internationalization (i18n)

### Supported Languages
1. **English** (en-US) - Default
2. **Malayalam** (ml-IN)
3. **Tamil** (ta-IN)
4. **Telugu** (te-IN)
5. **Hindi** (hi-IN)

### Regional Language Integration

#### Manglish (Malayalam + English)
```
Example: "Machane, ini entha plan? Let's go outdoor aano?"
Translation: "Dude, what's the plan now? Should we go outdoors?"
```

#### Tanglish (Tamil + English)
```
Example: "Nanba, enna da doing now? Movie paakalaama?"
Translation: "Friend, what are you doing now? Shall we watch a movie?"
```

#### Typography Considerations
- Load regional fonts on demand
- Increase line-height for complex scripts (1.6 vs 1.5)
- Support right-to-left if needed (future: Urdu)

---

## 🎯 Interaction Patterns

### Character Window Interactions

#### Default State
- **Always-on-top**: Optional toggle
- **Click-through**: Default enabled
- **Alt+Space**: Toggle interaction mode

#### Interaction Mode (Alt+Space Activated)
- Click to open chat window
- Right-click for quick menu
- Drag to reposition
- Scroll to resize (future enhancement)

#### Quick Menu (Right-Click)
```
┌──────────────────────┐
│ 🗨️  Open Chat        │
│ 🎭  Switch Persona   │
│ 📍  Snap to Corner   │
│ 👁️  Toggle Visibility│
│ ⚙️  Settings         │
│ ❌  Exit             │
└──────────────────────┘
```

### Chat Window Interactions

#### Message Input
- **Enter**: Send message
- **Shift+Enter**: New line
- **Ctrl+K**: Clear conversation
- **Ctrl+/**: Toggle voice input

#### Persona Switching
- Click header avatar → persona selector modal
- Keyboard: `Ctrl+Shift+P` → arrow keys to select

---

## 🎨 Theme Support

### Dark Mode (Default)
- High contrast for readability
- Deep blacks for transparent overlays
- Vibrant accent colors

### Light Mode (Optional - Future)
- Inverted color palette
- Softer shadows
- Reduced glass blur

### Custom Themes (Marketplace - Future)
- User-created color palettes
- Seasonal themes (Halloween, Christmas)
- Game-themed (Cyberpunk, Fantasy)

---

## 📊 Visual Hierarchy

### Priority Levels

1. **Critical**: User messages, AI responses, error states
2. **High**: Persona name, mood indicator, primary actions
3. **Medium**: Timestamps, settings, navigation
4. **Low**: Metadata, version info, subtle decorations

### Size & Weight Guidelines
- **Headlines**: 1.5-2rem, semibold (600)
- **Body**: 1rem, regular (400)
- **Captions**: 0.875rem, regular (400)
- **Labels**: 0.75rem, medium (500), uppercase

---

## 🔄 State Management (Visual Feedback)

### Application States

#### Loading
- Skeleton screens for chat history
- Shimmer effect on placeholders
- Spinner for async operations

#### Success
- Green checkmark animations
- Toast notifications (4s auto-dismiss)
- Subtle confetti for purchases

#### Error
- Red error messages (inline)
- Icon with shake animation
- Helpful retry actions

#### Empty States
```
┌─────────────────────────────┐
│                             │
│      [Illustration]         │
│                             │
│   No conversations yet      │
│  Say hi to get started! 👋  │
│                             │
│   [Start Chatting]          │
└─────────────────────────────┘
```

---

## 🎭 Emotion Visualization

### Mood Indicators

#### Companion Orb
- **Color**: Changes based on mood
- **Intensity**: Brightness reflects energy level
- **Particles**: Speed and count vary with excitement

#### Chat Interface
- **Badge**: Small pill with emoji and label
- **Message Border**: Subtle glow in mood color
- **Avatar**: Optional animated expressions

### Relationship Level Display
```
┌──────────────────────────────┐
│  Relationship: Trusted Friend │
│  ████████░░ 80%              │
│                              │
│  Affection:   ██████░░░░ 60% │
│  Trust:       ████████░░ 80% │
│  Professional: ███████░░░ 70% │
└──────────────────────────────┘
```

---

## 🛠️ Design Tools & Assets

### Design System Tools
- **Figma**: Component library (future)
- **Tailwind CSS**: Utility-first framework
- **Framer Motion**: React animation library

### 3D Assets
- **VRM Models**: VRoid Hub, Booth.pm
- **Three.js**: 3D rendering engine
- **react-three/fiber**: React wrapper for Three.js

### Icon Set
- **Lucide React**: Consistent, open-source icons
- **Custom Icons**: For unique persona actions

---

## 📱 Platform-Specific Considerations

### Windows
- Acrylic material effects (optional)
- Native window controls integration
- System tray icon design

### macOS
- Vibrancy effects for transparency
- Touch bar support (future)
- macOS Big Sur+ rounded corners

### Linux
- Fallback for missing system features
- GNOME/KDE theme integration
- Wayland transparency support

---

## ✅ Design Checklist

Before launch, ensure:
- [ ] All personas have unique visual identities
- [ ] Animations run at 60 FPS on target hardware
- [ ] WCAG AA compliance verified
- [ ] All states have clear visual feedback
- [ ] Regional fonts load correctly
- [ ] Dark mode tested thoroughly
- [ ] Glassmorphism effects perform well
- [ ] Touch targets are minimum 44x44px
- [ ] Focus states are clearly visible
- [ ] Error messages are helpful and actionable

---

## 🎯 Future Enhancements

- **AR Mode**: Interact with character in AR (future platforms)
- **3D Environments**: Customizable rooms/backgrounds
- **Seasonal Events**: Special visuals for holidays
- **User-Generated Themes**: Theme creator tool
- **Advanced Expressions**: Full VRM expression support
- **Gesture Controls**: Webcam-based hand gestures

---

**Document Approval:**
- [ ] Design Lead
- [ ] Engineering Lead
- [ ] UX Researcher
- [ ] Community Beta Testers
