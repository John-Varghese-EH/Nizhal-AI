import { ethers } from 'ethers';

/**
 * Web3Plugin - Blockchain & Smart Contract Tools
 */
export const Web3Plugin = {
    name: "web3",
    commands: [
        { trigger: "audit", handler: "auditContract" },
        { trigger: "check eth", handler: "checkEthBalance" },
        { trigger: "check balance", handler: "checkEthBalance" },
        { trigger: "gas price", handler: "checkGasPrice" }
    ],

    onLoad() {
        console.log("[Web3Plugin] Loaded. Provider: Cloudflare/Public");
        // Use a default public provider for read-only checks
        this.provider = new ethers.JsonRpcProvider("https://eth.llamarpc.com");
    },

    /**
     * Audit a smart contract (Simulated static analysis)
     * Real logic would parse Solidity AST, here we do Regex checks for demonstration
     */
    async auditContract(text) {
        // Try to read code from clipboard or text
        let code = text;
        if (text.length < 50) {
            // Assume the user wants us to read clipboard if text is short command
            try {
                // Clipboard read usually requires renderer context, 
                // in main process we might need electron's clipboard.
                // For now, prompt user to paste code
                if (!text.includes("contract")) {
                    return "Please paste the contract code you want me to audit. 📋";
                }
            } catch (e) {
                return "I couldn't access the clipboard. Please paste the code directly.";
            }
        }

        const vulnerabilities = [];

        // 1. Reentrancy Check
        if (code.includes('call.value') && !code.includes('nonReentrant')) {
            vulnerabilities.push("⚠️ **Reentrancy Risk**: Use of `call.value` without `nonReentrant` modifier.");
        }

        // 2. Overflow (Legacy check, Solidity <0.8)
        if (code.includes('pragma solidity ^0') && parseInt(code.match(/pragma solidity \^0\.(\d+)/)?.[1] || "8") < 8) {
            vulnerabilities.push("⚠️ **Integer Overflow**: Solidity <0.8.0 requires SafeMath.");
        }

        // 3. tx.origin
        if (code.includes('tx.origin')) {
            vulnerabilities.push("🚫 **Phishing Risk**: Avoid using `tx.origin` for authorization.");
        }

        if (vulnerabilities.length === 0) {
            return "✅ **Audit Complete**: No obvious common vulnerabilities found in this snippet. (Always verify with a professional auditor!).";
        }

        return `🔍 **Audit Report**:\n\n${vulnerabilities.join('\n')}\n\n💡 *Recommendation*: Fix these issues before deploying!`;
    },

    /**
     * Check ETH Balance
     */
    async checkEthBalance(text) {
        // Extract address if present
        const match = text.match(/0x[a-fA-F0-9]{40}/);
        if (!match) {
            return "Give me an Ethereum address to scan. 0x...";
        }

        const address = match[0];
        try {
            const balance = await this.provider.getBalance(address);
            const eth = ethers.formatEther(balance);
            return `💰 **Balance**: ${parseFloat(eth).toFixed(4)} ETH\nAddress: \`${address.substring(0, 6)}...${address.substring(38)}\``;
        } catch (e) {
            console.error(e);
            return "Failed to fetch balance. Is the network valid?";
        }
    },

    async checkGasPrice() {
        try {
            const feeData = await this.provider.getFeeData();
            const gwei = ethers.formatUnits(feeData.gasPrice, "gwei");
            return `⛽ **Gas Price**: ${parseFloat(gwei).toFixed(2)} Gwei.`;
        } catch (e) {
            return "Could not fetch gas price.";
        }
    }
};
