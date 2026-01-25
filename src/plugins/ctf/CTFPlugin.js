/**
 * CTFPlugin - Capture The Flag Toolkit
 */
export const CTFPlugin = {
    name: "ctf",
    commands: [
        { trigger: "crack hash", handler: "crackHash" },
        { trigger: "solve crypto", handler: "solveCrypto" },
        { trigger: "decode", handler: "solveCrypto" },
        { trigger: "start timer", handler: "startTimer" }
    ],

    timerInterval: null,

    onLoad() {
        console.log("[CTFPlugin] Loaded. Tools: HashCrack, CryptoSolver, Timer");
    },

    async crackHash(text) {
        // Simple client-side check for common hashes (Rainbow table simulation)
        // Helper to identify hash type
        const hash = text.match(/[a-fA-F0-9]{32,128}/)?.[0];
        if (!hash) return "No hash found in your command.";

        const commonHashes = {
            "5f4dcc3b5aa765d61d8327deb882cf99": "password",
            "098f6bcd4621d373cade4e832627b4f6": "test",
            "21232f297a57a5a743894a0e4a801fc3": "admin"
        };

        if (commonHashes[hash]) {
            return `🔓 **CRACKED**: \`${hash}\` -> **${commonHashes[hash]}**`;
        }

        // Identify type
        let type = "Unknown";
        if (hash.length === 32) type = "MD5";
        if (hash.length === 40) type = "SHA1";
        if (hash.length === 64) type = "SHA256";

        return `🔒 **Hash Analysis**:
- Type: ${type}
- Length: ${hash.length}
- Status: Not in local rainbow table. Try online tools?`;
    },

    async solveCrypto(text) {
        // Remove command words
        let content = text.replace(/solve|crypto|decode/gi, "").trim();

        // Base64 check
        try {
            const b64 = atob(content);
            // Check if result looks like readable text
            if (/[\x20-\x7E]{5,}/.test(b64)) {
                return `🔓 **Base64 Decoded**: \`${b64}\``;
            }
        } catch (e) { }

        // Hex check
        if (/^[0-9a-fA-F]+$/.test(content)) {
            let str = '';
            for (let i = 0; i < content.length; i += 2) {
                str += String.fromCharCode(parseInt(content.substr(i, 2), 16));
            }
            if (/[\x20-\x7E]{3,}/.test(str)) {
                return `🔓 **Hex Decoded**: \`${str}\``;
            }
        }

        // Rot13 check
        const rot13 = content.replace(/[a-zA-Z]/g, function (c) {
            return String.fromCharCode((c <= "Z" ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26);
        });

        return `🔓 **Possible ROT13**: \`${rot13}\``;
    },

    async startTimer(text) {
        // "start timer 10 minutes"
        const minutes = parseInt(text.match(/(\d+) min/)?.[1] || "60");

        if (this.timerInterval) clearInterval(this.timerInterval);

        const endTime = Date.now() + minutes * 60000;

        // In a real app we'd dispatch an event to UI
        return `⏱️ **CTF Timer Started**: ${minutes} minutes remaining. Good luck!`;
    }
};
