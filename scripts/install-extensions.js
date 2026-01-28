import fs from 'fs';
import path from 'path';

console.log("Installing Hacker Extensions...");

const extensions = [
    { name: "Web3/Blockchain Auditor", path: "src/plugins/web3" },
    { name: "CTF/Crypto Toolkit", path: "src/plugins/ctf" },
    { name: "Security/OSINT Scanner", path: "src/plugins/security" },
    { name: "Mobile Sync Uplink", path: "src/mobile" }
];

let installed = 0;

extensions.forEach(ext => {
    // FIX: Prevent path traversal by validating the resolved path is within the project root
    const baseDir = process.cwd();
    const resolvedPath = path.resolve(baseDir, ext.path);

    // Ensure the path starts with the base directory
    if (!resolvedPath.startsWith(baseDir)) {
        console.log(`[SECURITY] Blocked unsafe path for ${ext.name}: ${ext.path}`);
        return;
    }

    if (fs.existsSync(resolvedPath)) {
        console.log(`[INSTALLED] ${ext.name} ✅`);
        installed++;
    } else {
        console.log(`[MISSING] ${ext.name} ❌ (Expected at ${ext.path})`);
    }
});

console.log("\n----------------------------------------");
console.log(`Status: ${installed}/${extensions.length} Extensions Active`);
console.log("Run 'npm start' to launch Nizhal with Hacker capabilities.");
console.log("----------------------------------------");
