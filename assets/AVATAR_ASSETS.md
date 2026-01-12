# Avatar Assets Guide

This folder contains avatar assets for the Desktop companion system.

## Folder Structure

```
assets/
├── avatars/           # 2D character images (PNG, GIF, WebP)
│   ├── kavya-idle.png
│   ├── kavya-thinking.png
│   ├── kavya-speaking.png
│   └── ...
└── models/            # 3D character models (GLTF, GLB)
    └── character.glb
```

## Supported Formats

### 2D Images (`/avatars/`)
- **PNG** - Best for transparent backgrounds
- **GIF** - For animated expressions
- **WebP** - Optimized for web

### 3D Models (`/models/`)
- **GLTF/GLB** - Standard web 3D format
- Models should include animations (Idle, Talk, Wave, etc.)

## Free Asset Sources

### 2D Character Images
- [Waifu Labs](https://waifulabs.com/) - AI-generated anime characters
- [This Anime Does Not Exist](https://thisanimedoesnotexist.ai/) - AI portraits
- [OpenGameArt](https://opengameart.org/) - Game-ready sprites
- [itch.io](https://itch.io/game-assets/free) - Free game assets

### 3D Models (GLTF/GLB)
- **[Sketchfab](https://sketchfab.com/tags/anime)** - Thousands of free anime models
- **[Mixamo](https://mixamo.com/)** - Free rigged + animated characters
- **[VRoid Hub](https://hub.vroid.com/)** - Anime VRM models (convert to GLTF)
- **[Ready Player Me](https://readyplayer.me/)** - Customizable avatars
- **[Poly Pizza](https://poly.pizza/)** - Low-poly 3D assets

### Converting VRM to GLTF
VRM models from VRoid can be converted using:
- [vrm-to-gltf](https://github.com/nickyvanurk/vrm-to-gltf)
- Blender with VRM addon

## Naming Convention

For automatic state detection:
- `{persona}-idle.png` - Default standing pose
- `{persona}-thinking.png` - Thinking/processing state
- `{persona}-speaking.png` - Talking animation
- `{persona}-happy.png` - Happy expression
- `{persona}-wave.png` - Greeting wave

## Adding a New Persona Avatar

1. Add images to `/assets/avatars/`
2. Update `PersonaAvatarConfig` in `InteractiveAvatar.jsx`:

```javascript
mynewpersona: {
    type: 'image', // or '3d' for models
    displayName: 'My Persona',
    imageSrc: '/assets/avatars/mynewpersona-idle.png',
    altImageSrc: '/assets/avatars/mynewpersona-thinking.png',
    speakingImageSrc: '/assets/avatars/mynewpersona-speaking.png'
}
```

For 3D models:
```javascript
mynewpersona: {
    type: '3d',
    displayName: 'My 3D Persona',
    modelPath: '/assets/models/my-character.glb',
    modelScale: 1.5
}
```
