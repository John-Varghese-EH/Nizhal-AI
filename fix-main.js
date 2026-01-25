// Quick fix script - removes localVoice references from main.js
// Run this to fix the browser API error

const fs = require('fs');
const path = require('path');

const mainJsPath = path.join(__dirname, 'main.js');
let content = fs.readFileSync(mainJsPath, 'utf8');

// Remove ALL localVoice references
content = content.replace(/await localVoice\.checkServersAvailable\(\);?\r?\n?/g, '');
content = content.replace(/console\.log\('\[Main\] LocalVoice status:', localVoice\.getStatus\(\)\);?\r?\n?/g, '');
content = content.replace(/localVoice\.setVoiceForPersonality\(currentPersonality\);?\r?\n?/g, '');
content = content.replace(/\/\/ Set default personality voice\r?\n?/g, '');

// Write back
fs.writeFileSync(mainJsPath, content, 'utf8');
console.log('✅ Fixed: Removed localVoice references from main.js');
console.log('🔄 Restart the app with: npm run dev');
