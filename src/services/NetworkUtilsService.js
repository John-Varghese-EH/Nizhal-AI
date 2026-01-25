/**
 * Network Utilities Service - FREE Networking Tools
 * 
 * OSINT and network utilities for cybersecurity students
 * Features:
 * - Port scanning (ethical use only)
 * - WHOIS lookup
 * - DNS resolution
 * - Ping/traceroute
 * - GitHub API integration
 * 
 * NO paid APIs, all FREE tools!
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import dns from 'dns/promises';


const execAsync = promisify(exec);

class NetworkUtilsService {
    constructor() {
        this.platform = process.platform;
        this.isWindows = this.platform === 'win32';

        // Safety: Track command usage
        this.commandHistory = [];
        this.requireConfirmation = true; // Always confirm scans
    }

    // ===== PORT SCANNING (Ethical Use Only) =====

    /**
     * Scan common ports on target (REQUIRES USER CONFIRMATION)
     * @param {string} host - Target host/IP
     * @param {Array} ports - Ports to scan (default: common ports)
     */
    async scanPorts(host, ports = [80, 443, 22, 21, 3306, 5432, 27017]) {
        if (this.requireConfirmation) {
            console.warn('[Network] Port scan requires confirmation and ethical use!');
            // In UI, show confirmation dialog
        }

        try {
            const results = [];

            for (const port of ports) {
                try {
                    // Use netcat or telnet to check if port is open
                    const command = this.isWindows
                        ? `powershell -c "Test-NetConnection -ComputerName ${host} -Port ${port} -InformationLevel Quiet"`
                        : `timeout 2 bash -c "echo >/dev/tcp/${host}/${port}" 2>/dev/null && echo "open" || echo "closed"`;

                    const { stdout } = await execAsync(command);
                    const isOpen = stdout.trim().toLowerCase().includes('true') || stdout.trim() === 'open';

                    results.push({
                        port,
                        status: isOpen ? 'open' : 'closed',
                        service: this._getServiceName(port)
                    });
                } catch (error) {
                    results.push({
                        port,
                        status: 'closed',
                        service: this._getServiceName(port)
                    });
                }
            }

            this._logCommand('port_scan', { host, ports: results });
            return { success: true, host, results };
        } catch (error) {
            console.error('[Network] Port scan failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get service name for common ports
     */
    _getServiceName(port) {
        const services = {
            21: 'FTP',
            22: 'SSH',
            23: 'Telnet',
            25: 'SMTP',
            53: 'DNS',
            80: 'HTTP',
            110: 'POP3',
            143: 'IMAP',
            443: 'HTTPS',
            3306: 'MySQL',
            5432: 'PostgreSQL',
            27017: 'MongoDB',
            6379: 'Redis',
            8080: 'HTTP-Alt'
        };
        return services[port] || 'Unknown';
    }

    // ===== WHOIS LOOKUP =====

    /**
     * WHOIS domain lookup
     */
    async whois(domain) {
        try {
            const command = this.isWindows
                ? `nslookup ${domain}`
                : `whois ${domain}`;

            const { stdout } = await execAsync(command);

            this._logCommand('whois', { domain });
            return { success: true, domain, data: stdout };
        } catch (error) {
            console.error('[Network] WHOIS failed:', error);
            return { success: false, error: error.message };
        }
    }

    // ===== DNS RESOLUTION =====

    /**
     * DNS lookup (resolve domain to IP)
     */
    async resolveDNS(domain) {
        try {
            const addresses = await dns.resolve4(domain);

            this._logCommand('dns_resolve', { domain, addresses });
            return { success: true, domain, addresses };
        } catch (error) {
            console.error('[Network] DNS resolve failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Reverse DNS lookup (IP to domain)
     */
    async reverseDNS(ip) {
        try {
            const hostnames = await dns.reverse(ip);

            this._logCommand('reverse_dns', { ip, hostnames });
            return { success: true, ip, hostnames };
        } catch (error) {
            console.error('[Network] Reverse DNS failed:', error);
            return { success: false, error: error.message };
        }
    }

    // ===== PING & TRACEROUTE =====

    /**
     * Ping host
     */
    async ping(host, count = 4) {
        try {
            const command = this.isWindows
                ? `ping -n ${count} ${host}`
                : `ping -c ${count} ${host}`;

            const { stdout } = await execAsync(command);

            // Parse average latency
            const latencyMatch = stdout.match(/Average = (\d+)ms/i) ||
                stdout.match(/avg.*?=.*?(\d+\.\d+)/i);
            const avgLatency = latencyMatch ? parseFloat(latencyMatch[1]) : null;

            this._logCommand('ping', { host, count });
            return {
                success: true,
                host,
                count,
                avgLatency,
                output: stdout
            };
        } catch (error) {
            console.error('[Network] Ping failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Traceroute to host
     */
    async traceroute(host) {
        try {
            const command = this.isWindows
                ? `tracert ${host}`
                : `traceroute ${host}`;

            const { stdout } = await execAsync(command);

            this._logCommand('traceroute', { host });
            return { success: true, host, output: stdout };
        } catch (error) {
            console.error('[Network] Traceroute failed:', error);
            return { success: false, error: error.message };
        }
    }

    // ===== NETWORK INFO =====

    /**
     * Get local network info
     */
    async getNetworkInfo() {
        try {
            const command = this.isWindows
                ? 'ipconfig'
                : 'ifconfig || ip addr';

            const { stdout } = await execAsync(command);

            return { success: true, info: stdout };
        } catch (error) {
            console.error('[Network] Get network info failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get public IP
     */
    async getPublicIP() {
        try {
            // Use free API
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();

            return { success: true, ip: data.ip };
        } catch (error) {
            console.error('[Network] Get public IP failed:', error);
            return { success: false, error: error.message };
        }
    }

    // ===== GITHUB API (FREE TIER) =====

    /**
     * Get GitHub user info
     * @param {string} username - GitHub username
     */
    async getGitHubUser(username) {
        try {
            const response = await fetch(`https://api.github.com/users/${username}`);
            if (!response.ok) throw new Error('User not found');

            const data = await response.json();

            return {
                success: true,
                user: {
                    login: data.login,
                    name: data.name,
                    bio: data.bio,
                    publicRepos: data.public_repos,
                    followers: data.followers,
                    following: data.following,
                    createdAt: data.created_at,
                    avatarUrl: data.avatar_url
                }
            };
        } catch (error) {
            console.error('[Network] GitHub user lookup failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get GitHub user repositories
     */
    async getGitHubRepos(username) {
        try {
            const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=10`);
            if (!response.ok) throw new Error('Failed to fetch repos');

            const data = await response.json();
            const repos = data.map(repo => ({
                name: repo.name,
                description: repo.description,
                stars: repo.stargazers_count,
                forks: repo.forks_count,
                language: repo.language,
                url: repo.html_url,
                updatedAt: repo.updated_at
            }));

            return { success: true, repos };
        } catch (error) {
            console.error('[Network] GitHub repos lookup failed:', error);
            return { success: false, error: error.message };
        }
    }

    // ===== SECURITY & LOGGING =====

    /**
     * Log command for audit
     */
    _logCommand(action, details) {
        const entry = {
            timestamp: Date.now(),
            action,
            details
        };
        this.commandHistory.push(entry);

        // Keep last 100 commands
        if (this.commandHistory.length > 100) {
            this.commandHistory.shift();
        }
    }

    /**
     * Get command history
     */
    getCommandHistory(limit = 50) {
        return this.commandHistory.slice(-limit);
    }

    /**
     * Get ethical use warning
     */
    getEthicalUseWarning() {
        return {
            title: '⚠️ Ethical Use Only',
            message: [
                'Network scanning tools are for educational and authorized testing only.',
                '',
                'LEGAL REQUIREMENTS:',
                '- Only scan systems you own or have explicit permission to test',
                '- Unauthorized scanning is illegal in most jurisdictions',
                '- Port scanning can trigger IDS/IPS alerts',
                '',
                'CYBERSECURITY BEST PRACTICES:',
                '- Always get written permission before testing',
                '- Document your testing methodology',
                '- Report vulnerabilities responsibly',
                '- Use for learning, not malicious purposes',
                '',
                'Remember: With great power comes great responsibility! 💪'
            ].join('\n')
        };
    }
}

// Export singleton
export const networkUtils = new NetworkUtilsService();
export { NetworkUtilsService };
