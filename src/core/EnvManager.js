import fs from 'fs';
import path from 'path';

/**
 * EnvManager
 * Handles reading and writing to .env file safely
 */
export class EnvManager {
    constructor() {
        this.envPath = path.resolve(process.cwd(), '.env');
    }

    /**
     * Get all environment variables from .env file
     * Returns object with key-value pairs
     */
    async getAll() {
        if (!fs.existsSync(this.envPath)) {
            return {};
        }

        try {
            const content = await fs.promises.readFile(this.envPath, 'utf8');
            const lines = content.split('\n');
            const env = {};

            lines.forEach(line => {
                // Match KEY=VALUE, ignoring comments #
                // Regex handles simple cases. complex quoting might need redundancy checks
                const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
                if (match) {
                    const key = match[1];
                    let value = match[2] || '';

                    // Remove end-of-line comments
                    // Be careful not to remove # inside quotes
                    // Simple heuristic: if # exists and is not inside quotes

                    // Basic parsing for now: keys starting with # are comments
                    // We only extracted keys.

                    // Trim whitespace
                    value = value.trim();

                    // Remove surrounding quotes if present
                    if ((value.startsWith('"') && value.endsWith('"')) ||
                        (value.startsWith("'") && value.endsWith("'"))) {
                        value = value.slice(1, -1);
                    }

                    env[key] = value;
                }
            });

            return env;
        } catch (error) {
            console.error('[EnvManager] Failed to read .env:', error);
            return {};
        }
    }

    /**
     * Set a single environment variable
     * updates existing line or appends new one
     */
    async set(key, value) {
        try {
            let content = '';
            if (fs.existsSync(this.envPath)) {
                content = await fs.promises.readFile(this.envPath, 'utf8');
            }

            const lines = content.split(/\r?\n/);
            let found = false;
            const newLines = lines.map(line => {
                const match = line.match(/^\s*([\w_]+)\s*=/);
                if (match && match[1] === key) {
                    found = true;
                    // Escape double quotes in value if needed
                    const safeValue = value.replace(/"/g, '\\"');
                    return `${key}="${safeValue}"`;
                }
                return line;
            });

            if (!found) {
                // Add newline if needed
                if (newLines.length > 0 && newLines[newLines.length - 1] !== '') {
                    newLines.push('');
                }
                const safeValue = value.replace(/"/g, '\\"');
                newLines.push(`${key}="${safeValue}"`);
            }

            await fs.promises.writeFile(this.envPath, newLines.join('\n'), 'utf8');
            return true;
        } catch (error) {
            console.error('[EnvManager] Failed to write .env:', error);
            return false;
        }
    }

    /**
     * Delete an environment variable
     */
    async delete(key) {
        try {
            if (!fs.existsSync(this.envPath)) return true;

            const content = await fs.promises.readFile(this.envPath, 'utf8');
            const lines = content.split(/\r?\n/);

            const newLines = lines.filter(line => {
                const match = line.match(/^\s*([\w_]+)\s*=/);
                return !(match && match[1] === key);
            });

            await fs.promises.writeFile(this.envPath, newLines.join('\n'), 'utf8');
            return true;
        } catch (error) {
            console.error('[EnvManager] Failed to delete from .env:', error);
            return false;
        }
    }
}

// Singleton instance
export const envManager = new EnvManager();
