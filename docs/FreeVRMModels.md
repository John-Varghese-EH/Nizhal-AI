# Free VRM Models for Nizhal AI

This document lists **100% FREE** VRM model sources for your AI companion.

---

## ✅ Recommended Free Sources

### 1. VRoid Hub (Best Selection)

**Website**: https://hub.vroid.com/  
**License**: Various (check each model)  
**Quality**: High  

**How to Download**:
1. Visit VRoid Hub
2. Use filters: "Free" or "CC0"
3. Download `.vrm` file
4. Place in `public/models/` folder

**Recommended Models**:
- Search: "free vrm model"
- Filter by: Most popular, Free license
- Look for: Anime-style, low-poly (< 30k polygons for performance)

---

### 2. Hatsune Miku (Official Free Model)

**Website**: https://booth.pm/en/items/3226395  
**License**: Free for personal use  
**Quality**: Excellent  

**Download**:
- Click "Free Download"
- Extract ZIP file
- Use `.vrm` file in extracted folder

**Perfect for**: Anime fans, testing VRM features

---

### 3. VSeeFace Sample Models

**Website**: https://www.vseeface.icu/  
**License**: Free demo models  
**Quality**: Good for testing  

**Included Models**:
- Male and female avatars
- Low-poly (optimized for performance)
- Great for 8-16GB RAM systems

---

### 4. UniVRM Sample Models

**Website**: https://github.com/vrm-c/UniVRM/releases  
**License**: MIT (completely free)  
**Quality**: Official reference models  

**Download**:
- Go to latest release
- Download `VRM_Samples.zip`
- Extract and use `.vrm` files

---

### 5. HuggingFace VRM Datasets

**Website**: https://huggingface.co/  
**Search**: "vrm model" or "vroid"  
**License**: Varies (check individual datasets)  

**Community Models**:
- User-uploaded VRM files
- Often includes emotion variations
- Free to download with account

---

## 🎨 Creating Your Own VRM (Free Tools)

### VRoid Studio (Official VRM Creator)

**Website**: https://vroid.com/en/studio  
**License**: Free  
**Platforms**: Windows, macOS  

**Features**:
- Create custom anime characters
- Export as .vrm
- Full customization (hair, face, body, clothes)
- Beginner-friendly

**Tutorial**:
1. Download VRoid Studio
2. Create character
3. Export → VRM 0.0 or 1.0
4. Place in Nizhal AI's `public/models/`

---

### Blender + VRM Add-on (Advanced)

**Website**: https://blender.org + https://github.com/saturday06/VRM-Addon-for-Blender  
**License**: Free, open-source  

**For**: 3D artists who want full control

---

## 📏 VRM Model Guidelines

### Performance Optimization

For smooth performance on 16GB RAM:
- **Polygon Count**: < 30,000 triangles
- **Texture Size**: 2048x2048 or lower
- **File Size**: < 20MB

### Test Your Model

```bash
# Check polygon count in VRM file
# Use online VRM viewer: https://vrm.dev/en/univrm/viewer/

# In Nizhal AI:
Settings → Appearance → VRM Model → Load
# If FPS drops below 30, try a lower-poly model
```

---

## 🚀 Using Models in Nizhal AI

### Installation

```bash
# 1. Download .vrm file
# 2. Place in models folder
cd Nizhal-AI
mkdir -p public/models
cp ~/Downloads/model.vrm public/models/

# 3. In app:
# Settings → Appearance → VRM Model → Browse
# Select your model
```

### Personality-Specific Models

Recommended models for each personality:

**Girlfriend (GF)**:
- Female anime character
- Soft expressions
- Cute/friendly appearance
- Example: Hatsune Miku, VRoid female models

**Boyfriend (BF)**:
- Male anime character
- Confident posture
- Cool/supportive vibe
- Example: VRoid male models, VSeeFace male

**JARVIS**:
- Minimalist/tech aesthetic (optional)
- Or use Companion Orb mode instead
- Futuristic/professional look

---

## 📋 Model License Types

### CC0 (Public Domain)
✅ Use freely  
✅ Modify  
✅ No attribution required  

### CC BY (Attribution)
✅ Use freely  
✅ Modify  
⚠️ Must credit creator  

### Free for Personal Use
✅ Use in Nizhal AI (personal)  
❌ Don't use commercially  

**Always check the model's license page!**

---

## 🔥 Top 5 Free Models (Quick Start)

1. **Hatsune Miku** (booth.pm)
   - Most popular
   - Well-optimized
   - Great for testing

2. **VRoid Hub "Akari"**
   - Search VRoid Hub
   - CC0 licensed popular model

3. **UniVRM Alicia**
   - Official sample
   - MIT licensed

4. **VSeeFace Demo Girl**
   - Pre-optimized for performance
   - Included with VSeeFace

5. **Your Custom VRoid**
   - Create in VRoid Studio
   - Fully personalized!

---

## ⚠️ Troubleshooting

### Model Won't Load
```
Error: "VRM format not supported"
→ Ensure it's VRM 0.0 or 1.0 (not FBX/GLB)

Error: "File too large"
→ Try a lower-poly model (< 30k polygons)

Error: "Missing textures"
→ Re-export from VRoid Studio with embedded textures
```

### Low FPS / Lag
```
1. Switch to lower-poly model
2. Or use Companion Orb mode (Settings → Appearance)
3. Close other apps
4. Reduce VRM window size
```

### Animations Don't Work
```
1. Ensure model has VRM blendshapes
2. Check: Settings → VRM → Expression Test
3. Some models have limited expression support
```

---

## 🎁 Bonus: Community Contributions

Want to share your VRM model?
1. Create in VRoid Studio
2. Export with free license (CC0 or CC BY)
3. Upload to VRoid Hub
4. Share link in Nixhal AI community!

---

## 📚 Learn More

**VRM Specification**:
- https://vrm.dev/en/

**VRoid Studio Tutorials**:
- YouTube: "VRoid Studio beginner tutorial"
- Official docs: https://vroid.com/en/studio

**Blendshape/Expression Guides**:
- VRM emotion mapping
- @locoxsoco/vrm-ai-emotions on GitHub

---

**Remember**: Always respect model creators' licenses and credit their work! 💕

*Nizhal AI - Bringing your VRM companion to life, for free!*
