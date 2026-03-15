/**
 * SecurityService.js
 * Advanced security and privacy features for the AI companion
 */

export class SecurityService {
    constructor() {
        this.encryptionKey = null;
        this.isEncrypted = false;
        this.securityLevel = 'standard'; // 'basic', 'standard', 'high', 'maximum'
        this.auditLog = [];
        this.threatDetection = new Map();
        this.privacySettings = {
            dataRetention: 30, // days
            anonymizeData: true,
            localProcessing: true,
            encryptionEnabled: false,
            biometricAuth: false,
            twoFactorAuth: false,
            auditLogging: true
        };
        
        // Security policies
        this.policies = {
            passwordPolicy: {
                minLength: 8,
                requireUppercase: true,
                requireLowercase: true,
                requireNumbers: true,
                requireSpecialChars: true,
                maxAge: 90 // days
            },
            sessionPolicy: {
                maxDuration: 3600000, // 1 hour in ms
                idleTimeout: 900000,   // 15 minutes in ms
                maxConcurrentSessions: 3
            },
            dataPolicy: {
                encryptionAtRest: true,
                encryptionInTransit: true,
                dataMinimization: true,
                purposeLimitation: true
            }
        };
        
        // Session management
        this.sessions = new Map();
        this.sessionTimeout = 3600000; // 1 hour
        this.maxSessionsPerUser = 3;
        
        // Rate limiting
        this.rateLimitStore = new Map();
        this.rateLimitWindow = 900000; // 15 minutes
        this.maxAttemptsPerWindow = 20;
        
        // Initialize security
        this.initializeSecurity();
    }
    
    /**
     * Initialize security service
     */
    async initializeSecurity() {
        try {
            // Generate encryption key
            await this.generateEncryptionKey();
            
            // Start threat monitoring
            this.startThreatMonitoring();
            
            // Initialize audit logging
            this.initializeAuditLogging();
            
            // Load security settings
            await this.loadSecuritySettings();
            
            console.log('[SecurityService] ✓ Security service initialized');
        } catch (error) {
            console.error('[SecurityService] Failed to initialize:', error);
        }
    }
    
    /**
     * Generate encryption key
     */
    async generateEncryptionKey() {
        try {
            // Use proper crypto API with key derivation
            const salt = crypto.getRandomValues(new Uint8Array(16));
            const keyMaterial = await crypto.subtle.importKey(
                'raw',
                new TextEncoder().encode('Nizhal-AI-Secure-Key-2024'),
                { name: 'PBKDF2' },
                false,
                ['deriveBits', 'deriveKey']
            );
            
            this.encryptionKey = await crypto.subtle.deriveKey(
                {
                    name: 'PBKDF2',
                    salt: salt,
                    iterations: 100000,
                    hash: 'SHA-256'
                },
                keyMaterial,
                { name: 'AES-GCM', length: 256 },
                true,
                ['encrypt', 'decrypt']
            );
            
            // Store salt for key derivation
            this.keySalt = salt;
            this.isEncrypted = true;
            
            console.log('[SecurityService] ✓ Secure encryption key generated');
        } catch (error) {
            console.error('[SecurityService] Failed to generate encryption key:', error);
            throw error;
        }
    }
    
    /**
     * Encrypt data
     */
    async encryptData(data) {
        if (!this.isEncrypted || !this.encryptionKey) {
            throw new Error('Encryption not available');
        }
        
        try {
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(JSON.stringify(data));
            
            const iv = crypto.getRandomValues(new Uint8Array(12));
            
            const encryptedData = await crypto.subtle.encrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                this.encryptionKey,
                dataBuffer
            );
            
            // Combine IV and encrypted data
            const combined = new Uint8Array(iv.length + encryptedData.byteLength);
            combined.set(iv);
            combined.set(new Uint8Array(encryptedData), iv.length);
            
            // Convert to base64 for storage
            return btoa(String.fromCharCode(...combined));
        } catch (error) {
            console.error('[SecurityService] Encryption failed:', error);
            throw error;
        }
    }
    
    /**
     * Decrypt data
     */
    async decryptData(encryptedData) {
        if (!this.isEncrypted || !this.encryptionKey) {
            throw new Error('Decryption not available');
        }
        
        try {
            // Convert from base64
            const combined = new Uint8Array(
                atob(encryptedData).split('').map(char => char.charCodeAt(0))
            );
            
            // Extract IV and encrypted data
            const iv = combined.slice(0, 12);
            const data = combined.slice(12);
            
            const decryptedData = await crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                this.encryptionKey,
                data
            );
            
            const decoder = new TextDecoder();
            return JSON.parse(decoder.decode(decryptedData));
        } catch (error) {
            console.error('[SecurityService] Decryption failed:', error);
            throw error;
        }
    }
    
    /**
     * Check rate limiting
     */
    checkRateLimit(identifier) {
        const now = Date.now();
        const key = `rate_limit_${identifier}`;
        const attempts = this.rateLimitStore.get(key) || { count: 0, resetTime: now + this.rateLimitWindow };
        
        // Reset if window expired
        if (now > attempts.resetTime) {
            attempts.count = 0;
            attempts.resetTime = now + this.rateLimitWindow;
        }
        
        // Check if limit exceeded
        if (attempts.count >= this.maxAttemptsPerWindow) {
            const waitTime = Math.ceil((attempts.resetTime - now) / 1000);
            throw new Error(`Rate limit exceeded. Please wait ${waitTime} seconds.`);
        }
        
        // Increment counter
        attempts.count++;
        this.rateLimitStore.set(key, attempts);
        
        // Clean up expired entries
        this.cleanupRateLimitStore();
        
        return true;
    }
    
    /**
     * Clean up expired rate limit entries
     */
    cleanupRateLimitStore() {
        const now = Date.now();
        for (const [key, attempts] of this.rateLimitStore.entries()) {
            if (now > attempts.resetTime) {
                this.rateLimitStore.delete(key);
            }
        }
    }
    
    /**
     * Create secure session
     */
    createSecureSession(username, options = {}) {
        const sessionId = this.generateSecureSessionId();
        const now = Date.now();
        
        const session = {
            sessionId,
            username,
            createdAt: now,
            expiresAt: now + this.sessionTimeout,
            lastActivity: now,
            ipAddress: options.ipAddress || 'unknown',
            userAgent: options.userAgent || 'unknown',
            securityLevel: this.securityLevel,
            isActive: true
        };
        
        // Check max sessions per user
        this.enforceMaxSessions(username);
        
        this.sessions.set(sessionId, session);
        
        // Set up session cleanup
        this.scheduleSessionCleanup(sessionId);
        
        this.logSecurityEvent('session_created', {
            username,
            sessionId,
            timestamp: now
        });
        
        return session;
    }
    
    /**
     * Enforce maximum sessions per user
     */
    enforceMaxSessions(username) {
        const userSessions = Array.from(this.sessions.values())
            .filter(session => session.username === username && session.isActive);
        
        if (userSessions.length >= this.maxSessionsPerUser) {
            // Remove oldest session
            const oldestSession = userSessions.sort((a, b) => a.createdAt - b.createdAt)[0];
            this.invalidateSession(oldestSession.sessionId);
        }
    }
    
    /**
     * Invalidate session
     */
    invalidateSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.isActive = false;
            session.invalidatedAt = Date.now();
            
            this.logSecurityEvent('session_invalidated', {
                sessionId,
                username: session.username,
                timestamp: Date.now()
            });
            
            this.sessions.delete(sessionId);
        }
    }
    
    /**
     * Generate secure session ID
     */
    generateSecureSessionId() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
    
    /**
     * Schedule session cleanup
     */
    scheduleSessionCleanup(sessionId) {
        setTimeout(() => {
            this.invalidateSession(sessionId);
        }, this.sessionTimeout);
    }
    
    /**
     * Validate session
     */
    validateSession(sessionId) {
        const session = this.sessions.get(sessionId);
        
        if (!session || !session.isActive) {
            return false;
        }
        
        // Check if session expired
        if (Date.now() > session.expiresAt) {
            this.invalidateSession(sessionId);
            return false;
        }
        
        // Update last activity
        session.lastActivity = Date.now();
        
        return true;
    }
    
    /**
     * Authenticate user
     */
    async authenticateUser(credentials, options = {}) {
        const { username, password, biometric, token } = credentials;
        const sessionId = this.generateSessionId();
        
        try {
            // Apply rate limiting
            this.checkRateLimit(username || options.ipAddress || 'anonymous');
            
            // Log authentication attempt
            this.logSecurityEvent('authentication_attempt', {
                username,
                method: this.getAuthMethod(credentials),
                sessionId,
                timestamp: Date.now()
            });
            
            // Validate credentials
            const isValid = await this.validateCredentials(credentials);
            
            if (!isValid) {
                // Handle failed authentication
                await this.handleFailedAuth(username);
                throw new Error('Authentication failed');
            }
            
            // Create secure session
            const session = this.createSecureSession(username, options);
            
            // Log successful authentication
            this.logSecurityEvent('authentication_success', {
                username,
                sessionId: session.sessionId,
                timestamp: Date.now()
            });
            
            return { success: true, sessionId: session.sessionId, session };
        } catch (error) {
            this.logSecurityEvent('authentication_failure', {
                username,
                error: error.message,
                timestamp: Date.now()
            });
            throw error;
        }
    }
    
    /**
     * Validate credentials
     */
    async validateCredentials(credentials) {
        // In a real implementation, you'd check against a secure database
        // For now, implement basic validation
        
        if (credentials.password) {
            return this.validatePassword(credentials.password);
        }
        
        if (credentials.biometric) {
            return this.validateBiometric(credentials.biometric);
        }
        
        if (credentials.token) {
            return this.validateToken(credentials.token);
        }
        
        return false;
    }
    
    /**
     * Validate password
     */
    validatePassword(password) {
        const policy = this.policies.passwordPolicy;
        
        if (password.length < policy.minLength) return false;
        if (policy.requireUppercase && !/[A-Z]/.test(password)) return false;
        if (policy.requireLowercase && !/[a-z]/.test(password)) return false;
        if (policy.requireNumbers && !/\d/.test(password)) return false;
        if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;
        
        return true;
    }
    
    /**
     * Validate biometric data
     */
    validateBiometric(biometricData) {
        // In a real implementation, you'd use WebAuthn or similar
        return biometricData && biometricData.fingerprint && biometricData.confidence > 0.8;
    }
    
    /**
     * Validate token
     */
    validateToken(token) {
        // In a real implementation, you'd validate JWT or similar
        return token && token.length > 20;
    }
    
    /**
     * Handle failed authentication
     */
    async handleFailedAuth(username) {
        const key = `auth_fail_${username}`;
        const now = Date.now();
        const attempts = this.threatDetection.get(key) || { count: 0, firstAttempt: now };
        
        attempts.count++;
        attempts.lastAttempt = now;
        
        this.threatDetection.set(key, attempts);
        
        // Check for brute force
        if (attempts.count >= this.threatPatterns.bruteForce.maxAttempts) {
            const windowStart = now - this.threatPatterns.bruteForce.windowMs;
            
            if (attempts.firstAttempt > windowStart) {
                // Lock out account
                const lockoutKey = `lockout_${username}`;
                this.threatDetection.set(lockoutKey, {
                    lockedAt: now,
                    expiresAt: now + this.threatPatterns.bruteForce.lockoutMs
                });
                
                this.logSecurityEvent('account_lockout', {
                    username,
                    attempts: attempts.count,
                    lockoutDuration: this.threatPatterns.bruteForce.lockoutMs,
                    timestamp: now
                });
            }
        }
    }
    
    /**
     * Check if account is locked
     */
    isAccountLocked(username) {
        const lockoutKey = `lockout_${username}`;
        const lockout = this.threatDetection.get(lockoutKey);
        
        if (!lockout) return false;
        
        if (Date.now() > lockout.expiresAt) {
            this.threatDetection.delete(lockoutKey);
            return false;
        }
        
        return true;
    }
    
    /**
     * Validate session
     */
    validateSession(sessionId) {
        // In a real implementation, you'd check against a session store
        return sessionId && sessionId.length > 20;
    }
    
    /**
     * Start threat monitoring
     */
    startThreatMonitoring() {
        setInterval(() => {
            this.detectThreats();
        }, 60000); // Check every minute
    }
    
    /**
     * Detect threats
     */
    detectThreats() {
        const now = Date.now();
        
        // Check for various threat patterns
        this.detectBruteForceAttacks(now);
        this.detectSuspiciousActivity(now);
        this.detectDataExfiltration(now);
        this.detectPrivilegeEscalation(now);
    }
    
    /**
     * Detect brute force attacks
     */
    detectBruteForceAttacks(now) {
        for (const [key, data] of this.threatDetection.entries()) {
            if (key.startsWith('auth_fail_')) {
                const windowStart = now - this.threatPatterns.bruteForce.windowMs;
                
                if (data.count >= this.threatPatterns.bruteForce.maxAttempts && 
                    data.firstAttempt > windowStart) {
                    
                    this.logSecurityEvent('threat_detected', {
                        type: 'brute_force',
                        key,
                        attempts: data.count,
                        timestamp: now
                    });
                }
            }
        }
    }
    
    /**
     * Detect suspicious activity
     */
    detectSuspiciousActivity(now) {
        // Check for unusual patterns in audit log
        const recentEvents = this.auditLog.filter(event => 
            now - event.timestamp < 3600000 // Last hour
        );
        
        // Multiple failed authentications
        const failedAuths = recentEvents.filter(event => 
            event.type === 'authentication_failure'
        );
        
        if (failedAuths.length > 10) {
            this.logSecurityEvent('threat_detected', {
                type: 'suspicious_activity',
                pattern: 'multiple_failed_authentications',
                count: failedAuths.length,
                timestamp: now
            });
        }
    }
    
    /**
     * Detect data exfiltration
     */
    detectDataExfiltration(now) {
        // Check for large data transfers
        const recentDataEvents = this.auditLog.filter(event => 
            event.type === 'data_access' && 
            now - event.timestamp < this.threatPatterns.dataExfiltration.windowMs
        );
        
        const totalDataAccess = recentDataEvents.reduce((sum, event) => 
            sum + (event.dataSize || 0), 0
        );
        
        if (totalDataAccess > this.threatPatterns.dataExfiltration.threshold) {
            this.logSecurityEvent('threat_detected', {
                type: 'data_exfiltration',
                totalDataAccess,
                events: recentDataEvents.length,
                timestamp: now
            });
        }
    }
    
    /**
     * Detect privilege escalation
     */
    detectPrivilegeEscalation(now) {
        // Check for admin access attempts
        const recentAdminEvents = this.auditLog.filter(event => 
            (event.type === 'admin_access' || event.type === 'config_change') &&
            now - event.timestamp < 3600000 // Last hour
        );
        
        if (recentAdminEvents.length > 5) {
            this.logSecurityEvent('threat_detected', {
                type: 'privilege_escalation',
                events: recentAdminEvents.length,
                timestamp: now
            });
        }
    }
    
    /**
     * Initialize audit logging
     */
    initializeAuditLogging() {
        if (this.privacySettings.auditLogging) {
            console.log('[SecurityService] ✓ Audit logging initialized');
        }
    }
    
    /**
     * Log security event
     */
    logSecurityEvent(type, data) {
        if (!this.privacySettings.auditLogging) return;
        
        const event = {
            id: this.generateEventId(),
            type,
            data: this.anonymizeData(data),
            timestamp: Date.now()
        };
        
        this.auditLog.push(event);
        
        // Keep only last 10000 events
        if (this.auditLog.length > 10000) {
            this.auditLog = this.auditLog.slice(-10000);
        }
        
        console.log(`[SecurityService] Event logged: ${type}`);
    }
    
    /**
     * Anonymize data for logging
     */
    anonymizeData(data) {
        if (!this.privacySettings.anonymizeData) return data;
        
        const anonymized = { ...data };
        
        // Remove or hash sensitive fields
        if (anonymized.username) {
            anonymized.username = this.hashString(anonymized.username);
        }
        
        if (anonymized.sessionId) {
            anonymized.sessionId = this.hashString(anonymized.sessionId);
        }
        
        return anonymized;
    }
    
    /**
     * Hash string for anonymization
     */
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(16);
    }
    
    /**
     * Generate session ID
     */
    generateSessionId() {
        return Array.from(crypto.getRandomValues(new Uint8Array(32)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }
    
    /**
     * Generate event ID
     */
    generateEventId() {
        return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Get authentication method
     */
    getAuthMethod(credentials) {
        if (credentials.password) return 'password';
        if (credentials.biometric) return 'biometric';
        if (credentials.token) return 'token';
        return 'unknown';
    }
    
    /**
     * Load security settings
     */
    async loadSecuritySettings() {
        // In a real implementation, you'd load from secure storage
        console.log('[SecurityService] ✓ Security settings loaded');
    }
    
    /**
     * Set security level
     */
    setSecurityLevel(level) {
        const validLevels = ['basic', 'standard', 'high', 'maximum'];
        if (!validLevels.includes(level)) {
            throw new Error(`Invalid security level: ${level}`);
        }
        
        this.securityLevel = level;
        
        // Adjust settings based on level
        switch (level) {
            case 'basic':
                this.privacySettings.encryptionEnabled = false;
                this.privacySettings.auditLogging = false;
                break;
            case 'standard':
                this.privacySettings.encryptionEnabled = true;
                this.privacySettings.auditLogging = true;
                break;
            case 'high':
                this.privacySettings.encryptionEnabled = true;
                this.privacySettings.auditLogging = true;
                this.privacySettings.biometricAuth = true;
                break;
            case 'maximum':
                this.privacySettings.encryptionEnabled = true;
                this.privacySettings.auditLogging = true;
                this.privacySettings.biometricAuth = true;
                this.privacySettings.twoFactorAuth = true;
                break;
        }
        
        this.logSecurityEvent('security_level_changed', { level, timestamp: Date.now() });
    }
    
    /**
     * Get security status
     */
    getSecurityStatus() {
        return {
            securityLevel: this.securityLevel,
            encryptionEnabled: this.isEncrypted,
            auditLogSize: this.auditLog.length,
            threatDetectionCount: this.threatDetection.size,
            privacySettings: { ...this.privacySettings },
            policies: { ...this.policies }
        };
    }
    
    /**
     * Get audit log
     */
    getAuditLog(limit = 100) {
        return this.auditLog.slice(-limit);
    }
    
    /**
     * Clear audit log
     */
    clearAuditLog() {
        this.auditLog = [];
        this.logSecurityEvent('audit_log_cleared', { timestamp: Date.now() });
    }
    
    /**
     * Get threat report
     */
    getThreatReport() {
        const now = Date.now();
        const recentThreats = [];
        
        for (const [key, data] of this.threatDetection.entries()) {
            if (key.startsWith('threat_')) {
                recentThreats.push({
                    type: key.replace('threat_', ''),
                    data,
                    timestamp: data.timestamp || now
                });
            }
        }
        
        return {
            totalThreats: recentThreats.length,
            recentThreats: recentThreats.slice(-10),
            activeLockouts: Array.from(this.threatDetection.entries())
                .filter(([key]) => key.startsWith('lockout_'))
                .map(([key, data]) => ({
                    username: key.replace('lockout_', ''),
                    lockedAt: data.lockedAt,
                    expiresAt: data.expiresAt
                }))
        };
    }
}

export default SecurityService;
