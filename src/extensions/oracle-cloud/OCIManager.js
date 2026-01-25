/**
 * OracleCloudExtension - OCI Tools
 * Simulates Free Tier VM provisioning and monitoring
 */
export const OracleCloudExtension = {
    name: "oracle-cloud",
    commands: [
        { trigger: "deploy vm", handler: "deployVM" },
        { trigger: "spin up kali", handler: "deployKali" },
        { trigger: "oracle status", handler: "checkStatus" },
        { trigger: "cloud resources", handler: "checkStatus" }
    ],

    onLoad() {
        console.log("[OracleCloud] Loaded. Mode: Free Tier (Simulation)");
    },

    async deployVM(text) {
        // "deploy ubuntu vm"
        const os = text.includes("kali") ? "Kali Linux" : "Ubuntu 22.04";

        return `☁️ **Oracle Cloud Provisioning**
- **Instance**: \`AMP-A1 (Free Tier)\`
- **Region**: \`us-ashburn-1\`
- **OS**: ${os}
- **Status**: Provisioning... (Est: 45s)

⏳ *Waiting for public IP assignment...*

✅ **Success!**
- **IP**: \`130.61.12.45\`
- **User**: \`ubuntu\`
- **Key**: \`id_rsa_oracle_free\` (Saved to vault)
- **Command**: \`ssh -i keys/oracle ubuntu@130.61.12.45\``;
    },

    async deployKali() {
        return this.deployVM("kali");
    },

    async checkStatus() {
        return `📊 **OCI Free Tier Resources**
- **Compute**: 2/4 ARM Cores used
- **Memory**: 12/24 GB used
- **Block Volume**: 50/200 GB
- **Cost**: $0.00 / month (Always Free)

🟢 All systems operational.`;
    }
};
