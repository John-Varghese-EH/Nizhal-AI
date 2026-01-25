const fs = require('fs');
const path = require('path');

console.log("Installing Hacker Extensions...");

const extensions = [
    { name: "Web3/Blockchain Auditor", path: "src/plugins/web3" },
    { name: "CTF/Crypto Toolkit", path: "src/plugins/ctf" },
    { name: "Security/OSINT Scanner", path: "src/plugins/security" },
    { name: "Mobile Sync Uplink", path: "src/mobile" }
];

let installed = 0;

extensions.forEach(ext => {
    const extPath = path.join(process.cwd(), ext.path);
    if (fs.existsSync(extPath)) {
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
