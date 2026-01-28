import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export class LicenseService {
    constructor(dataPath) {
        // FIX: Resolve dataPath to absolute path to prevent traversal
        this.dataPath = path.resolve(dataPath);
        this.licensesFile = path.join(this.dataPath, 'licenses.enc');
        this.licenses = new Map();
        this.encryptionKey = null;
    }

    async initialize() {
        this.encryptionKey = await this.getOrCreateKey();
        await this.loadLicenses();
    }

    async getOrCreateKey() {
        const keyFile = path.join(this.dataPath, '.key');
        try {
            const existingKey = await fs.readFile(keyFile);
            return existingKey;
        } catch {
            const newKey = crypto.randomBytes(32);
            await fs.writeFile(keyFile, newKey);
            return newKey;
        }
    }

    encrypt(data) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);
        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
    }

    decrypt(encryptedData) {
        const [ivHex, encrypted] = encryptedData.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return JSON.parse(decrypted);
    }

    async loadLicenses() {
        try {
            const encryptedData = await fs.readFile(this.licensesFile, 'utf8');
            const data = this.decrypt(encryptedData);
            this.licenses = new Map(Object.entries(data));
        } catch {
            this.licenses = new Map();
            this.licenses.set('jarvis', {
                personaId: 'jarvis',
                type: 'free',
                unlockedAt: Date.now(),
                expiresAt: null
            });
        }
    }

    async saveLicenses() {
        const data = Object.fromEntries(this.licenses);
        const encrypted = this.encrypt(data);
        await fs.writeFile(this.licensesFile, encrypted);
    }

    isUnlocked(personaId) {
        const freePersonas = ['jarvis'];
        if (freePersonas.includes(personaId)) {
            return true;
        }

        const license = this.licenses.get(personaId);
        if (!license) {
            return false;
        }

        if (license.expiresAt && license.expiresAt < Date.now()) {
            return false;
        }

        return true;
    }

    async unlock(personaId, licenseData) {
        const license = {
            personaId,
            type: licenseData.type || 'purchased',
            unlockedAt: Date.now(),
            expiresAt: licenseData.expiresAt || null,
            paymentId: licenseData.paymentId,
            orderId: licenseData.orderId
        };

        this.licenses.set(personaId, license);
        await this.saveLicenses();

        return license;
    }

    async unlockFromPayment(paymentResult, productId) {
        const productToPersona = {
            'bestie_persona': ['bestie'],
            'buddy_persona': ['buddy'],
            'premium_voice_pack': ['premium_voices'],
            'memory_expansion': ['memory_expansion'],
            'pro_bundle': ['bestie', 'buddy', 'premium_voices', 'memory_expansion']
        };

        const personasToUnlock = productToPersona[productId] || [];
        const results = [];

        for (const personaId of personasToUnlock) {
            const license = await this.unlock(personaId, {
                type: 'purchased',
                paymentId: paymentResult.paymentId,
                orderId: paymentResult.orderId
            });
            results.push(license);
        }

        return results;
    }

    getUnlockedPersonas() {
        const unlocked = [];
        for (const [personaId, license] of this.licenses) {
            if (this.isUnlocked(personaId)) {
                unlocked.push({
                    personaId,
                    ...license
                });
            }
        }
        return unlocked;
    }

    getLicense(personaId) {
        return this.licenses.get(personaId) || null;
    }

    async revoke(personaId) {
        const freePersonas = ['jarvis'];
        if (freePersonas.includes(personaId)) {
            return false;
        }

        this.licenses.delete(personaId);
        await this.saveLicenses();
        return true;
    }

    hasFeature(featureId) {
        return this.isUnlocked(featureId);
    }

    async validateLicenseKey(licenseKey) {
        try {
            const decoded = Buffer.from(licenseKey, 'base64').toString('utf8');
            const [personaId, timestamp, signature] = decoded.split('::');

            const expectedSignature = crypto
                .createHmac('sha256', this.encryptionKey)
                .update(`${personaId}::${timestamp}`)
                .digest('hex')
                .substring(0, 16);

            if (signature === expectedSignature) {
                return {
                    valid: true,
                    personaId,
                    timestamp: parseInt(timestamp)
                };
            }
            return { valid: false };
        } catch {
            return { valid: false };
        }
    }

    generateLicenseKey(personaId) {
        const timestamp = Date.now();
        const signature = crypto
            .createHmac('sha256', this.encryptionKey)
            .update(`${personaId}::${timestamp}`)
            .digest('hex')
            .substring(0, 16);

        return Buffer.from(`${personaId}::${timestamp}::${signature}`).toString('base64');
    }

    async exportLicenses() {
        return {
            licenses: Object.fromEntries(this.licenses),
            exportedAt: Date.now()
        };
    }

    async importLicenses(data, merge = true) {
        try {
            if (merge) {
                for (const [personaId, license] of Object.entries(data.licenses)) {
                    if (!this.licenses.has(personaId)) {
                        this.licenses.set(personaId, license);
                    }
                }
            } else {
                this.licenses = new Map(Object.entries(data.licenses));
            }
            await this.saveLicenses();
            return true;
        } catch {
            return false;
        }
    }
}
