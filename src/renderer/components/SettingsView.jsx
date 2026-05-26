import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Attribution from './Attribution';
import LegalDocumentViewer from './LegalDocumentViewer';
import { 
    Key, Eye, EyeOff, Lock, Plus, Trash2, Edit2, Save, X, RefreshCw,
    Settings, Sliders, Volume2, User, KeyRound, Monitor, Terminal, 
    HelpCircle, Check, AlertCircle, Loader2, Cpu, HardDrive, Shield 
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { SettingsService } from '../services/SettingsService';

const SettingsView = ({ 
    onBack, 
    onClose, 
    onPersonaChange, 
    privacyMode, 
    onPrivacyToggle, 
    isModal = false, 
    userProfile, 
    onProfileChange 
}) => {
    const toast = useToast();
    
    // Core settings states
    const [preferences, setPreferences] = useState({});
    const [personas, setPersonas] = useState([]);
    const [activePersonaId, setActivePersonaId] = useState('jarvis');
    const [isSaving, setIsSaving] = useState(false);
    
    // UI tabs/layout
    const [activeSection, setActiveSection] = useState('general'); // 'general' | 'ai' | 'hardware' | 'system'
    const [showLegalModal, setShowLegalModal] = useState(null);
    
    // AI Providers and Models
    const [aiProviders, setAiProviders] = useState([]);
    const [providerStatus, setProviderStatus] = useState(null);
    const [availableModels, setAvailableModels] = useState([]);
    
    // Local Candle model specific states
    const [localModelProgress, setLocalModelProgress] = useState(null);
    const [localModelLoading, setLocalModelLoading] = useState(false);
    const [gpuInfo, setGpuInfo] = useState(null);

    // API Key inputs & validation states
    const [apiKeys, setApiKeys] = useState({});
    const [editingKeyProvider, setEditingKeyProvider] = useState(null);
    const [tempKeyValue, setTempKeyValue] = useState('');
    const [validationStatus, setValidationStatus] = useState({}); // { [provider]: 'idle' | 'validating' | 'success' | 'error' }
    const [validationMessage, setValidationMessage] = useState({}); // { [provider]: string }

    // Custom Provider State
    const [customBaseUrl, setCustomBaseUrl] = useState('');
    const [customModelName, setCustomModelName] = useState('');
    const [customProviderName, setCustomProviderName] = useState('');

    // Hardware State
    const [availableMonitors, setAvailableMonitors] = useState([]);

    // Secrets Management State (.env list)
    const [secrets, setSecrets] = useState({});
    const [visibleSecrets, setVisibleSecrets] = useState(new Set());
    const [editingSecret, setEditingSecret] = useState(null);
    const [newSecret, setNewSecret] = useState({ key: '', value: '' });
    const [isAddingSecret, setIsAddingSecret] = useState(false);

    useEffect(() => {
        loadSettings();
        detectHardware();
        
        // Listen to Candle local model progress if any
        let progressUnsubscribe;
        if (window.nizhal?.on) {
            progressUnsubscribe = window.nizhal.on('local-model-download-progress', (progress) => {
                setLocalModelProgress(progress);
                if (progress >= 1.0) {
                    toast.success('Local AI model downloaded successfully!');
                    setLocalModelProgress(null);
                    // Refresh status
                    refreshLocalModelStatus();
                }
            });
        }

        return () => {
            if (progressUnsubscribe) progressUnsubscribe();
        };
    }, []);

    const loadSettings = async () => {
        try {
            const prefs = await window.nizhal?.memory.getUserPreferences();
            const allPersonas = await window.nizhal?.persona.getAll();
            const active = await window.nizhal?.persona.getActive();
            const providers = await window.nizhal?.ai.getProviders();
            const status = await window.nizhal?.ai.getProviderStatus();
            const models = await window.nizhal?.ai.getModels();
            const monitors = await window.nizhal?.windowControls?.getMonitors?.();
            const envVars = await window.nizhal?.env?.getAll();

            setPreferences(prefs || {});
            setPersonas(allPersonas || []);
            setActivePersonaId(active?.id || 'jarvis');
            setAiProviders(providers || []);
            setProviderStatus(status || {});
            setAvailableModels(models || []);
            setAvailableMonitors(monitors || []);
            setSecrets(envVars || {});

            // Load keys securely from Keyring
            const loadedApiKeys = {};
            const keyProviders = ['gemini', 'openai', 'anthropic', 'elevenlabs', 'groq', 'huggingface', 'together', 'custom'];
            for (const kp of keyProviders) {
                try {
                    const key = await window.nizhal?.keyring?.getKey(kp);
                    if (key) {
                        loadedApiKeys[kp] = key;
                    }
                } catch (e) {
                    console.error(`Failed to load key for ${kp} from keyring:`, e);
                }
            }
            setApiKeys(loadedApiKeys);

            // Restore Custom Provider State
            if (prefs && prefs.customConfig) {
                setCustomBaseUrl(prefs.customConfig.baseUrl || '');
                setCustomModelName(prefs.customConfig.model || '');
                setCustomProviderName(prefs.customConfig.name || 'Custom Provider');
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    };

    const detectHardware = async () => {
        try {
            if (window.nizhal?.ai?.detectGpu) {
                const info = await window.nizhal.ai.detectGpu();
                setGpuInfo(info);
            }
        } catch (e) {
            console.error('Failed to detect GPU:', e);
        }
    };

    const handlePreferenceChange = async (key, value) => {
        try {
            const updated = { [key]: value };
            const fullPrefs = await SettingsService.updatePreferences(updated);
            setPreferences(fullPrefs);
        } catch (error) {
            toast.error(error.message || 'Failed to save preference');
        }
    };

    const handlePersonaSwitch = async (personaId) => {
        try {
            const persona = await window.nizhal?.persona.setActive(personaId);
            setActivePersonaId(personaId);
            onPersonaChange?.(persona);
            toast.success(`Persona switched to ${persona?.name || personaId}`);
        } catch (error) {
            console.error('Failed to switch persona:', error);
            toast.error('Failed to switch persona');
        }
    };

    const handleSaveApiKey = async (provider) => {
        if (!tempKeyValue.trim()) {
            toast.error('API Key cannot be empty');
            return;
        }

        setValidationStatus(prev => ({ ...prev, [provider]: 'validating' }));
        setValidationMessage(prev => ({ ...prev, [provider]: '' }));

        try {
            const customConfig = provider === 'custom' ? {
                baseUrl: customBaseUrl.trim(),
                model: customModelName.trim(),
                name: customProviderName.trim() || 'Custom Provider'
            } : null;

            await SettingsService.saveSecureApiKey(provider, tempKeyValue.trim(), customConfig);
            
            setValidationStatus(prev => ({ ...prev, [provider]: 'success' }));
            setApiKeys(prev => ({ ...prev, [provider]: tempKeyValue.trim() }));
            
            // Refresh provider info
            const status = await window.nizhal?.ai.getProviderStatus();
            const providers = await window.nizhal?.ai.getProviders();
            const models = await window.nizhal?.ai.getModels();
            setProviderStatus(status);
            setAiProviders(providers);
            setAvailableModels(models);

            toast.success(`${provider.toUpperCase()} API Key validated and saved successfully!`);
            setEditingKeyProvider(null);
            setTempKeyValue('');
        } catch (error) {
            console.error(error);
            setValidationStatus(prev => ({ ...prev, [provider]: 'error' }));
            setValidationMessage(prev => ({ ...prev, [provider]: error.message || 'Validation failed. Check key & connection.' }));
            toast.error(`Validation Failed: ${error.message || 'Invalid key'}`);
        }
    };

    const handleDeleteApiKey = async (provider) => {
        if (!confirm(`Are you sure you want to remove the API key for ${provider.toUpperCase()}?`)) return;
        
        try {
            await SettingsService.deleteSecureApiKey(provider);
            setApiKeys(prev => {
                const next = { ...prev };
                delete next[provider];
                return next;
            });
            
            // Update provider config
            await window.nizhal?.ai.setProvider(provider, {});
            const status = await window.nizhal?.ai.getProviderStatus();
            const providers = await window.nizhal?.ai.getProviders();
            setProviderStatus(status);
            setAiProviders(providers);

            toast.success(`Removed API Key for ${provider.toUpperCase()}`);
        } catch (error) {
            toast.error('Failed to remove API key');
        }
    };

    const handleModelChange = async (providerId, modelId) => {
        setIsSaving(true);
        try {
            await window.nizhal?.ai.setModel(providerId, modelId);
            await handlePreferenceChange(`aiModel_${providerId}`, modelId);
            const models = await window.nizhal?.ai.getModels();
            setAvailableModels(models);
            toast.success(`Active model updated to: ${modelId}`);
        } catch (error) {
            console.error('Failed to set model:', error);
            toast.error('Failed to update model');
        } finally {
            setIsSaving(false);
        }
    };

    const handleProviderSelect = async (providerId) => {
        setIsSaving(true);
        try {
            await window.nizhal?.ai.setProvider(providerId, {});
            await handlePreferenceChange('aiProvider', providerId);
            const status = await window.nizhal?.ai.getProviderStatus();
            setProviderStatus(status);
            toast.success(`Primary inference provider set to ${providerId}`);
        } catch (error) {
            console.error('Failed to set provider:', error);
            toast.error('Failed to update provider');
        } finally {
            setIsSaving(false);
        }
    };

    const refreshLocalModelStatus = async () => {
        try {
            if (window.nizhal?.ai?.localModelStatus) {
                const status = await window.nizhal.ai.localModelStatus();
                // If we have some status representation
                console.log("Local model status:", status);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const triggerLocalModelDownload = async () => {
        try {
            setLocalModelProgress(0.01);
            await window.nizhal?.ai?.localModelDownload();
            toast.success('Downloading Gemma Local AI Brain in background...');
        } catch (e) {
            console.error(e);
            toast.error('Failed to start local model download');
            setLocalModelProgress(null);
        }
    };

    const triggerLocalModelLoad = async () => {
        setLocalModelLoading(true);
        try {
            await window.nizhal?.ai?.localModelLoad();
            toast.success('Local model successfully loaded into memory!');
            const status = await window.nizhal?.ai.getProviderStatus();
            setProviderStatus(status);
        } catch (e) {
            console.error(e);
            toast.error(e.toString() || 'Failed to load local model');
        } finally {
            setLocalModelLoading(false);
        }
    };

    // Secrets Management (.env) helpers
    const toggleSecretVisibility = (key) => {
        setVisibleSecrets(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const handleSaveSecret = async (key, value) => {
        if (!key) return;
        setIsSaving(true);
        try {
            const success = await window.nizhal?.env?.set(key, value);
            if (success) {
                setSecrets(prev => ({ ...prev, [key]: value }));
                setEditingSecret(null);
                setNewSecret({ key: '', value: '' });
                setIsAddingSecret(false);
                toast.success(`Saved secret: ${key}`);
            }
        } catch (error) {
            console.error('Failed to save secret:', error);
            toast.error('Failed to save secret');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteSecret = async (key) => {
        if (!confirm(`Are you sure you want to delete ${key} from .env?`)) return;
        setIsSaving(true);
        try {
            const success = await window.nizhal?.env?.delete(key);
            if (success) {
                const newSecrets = { ...secrets };
                delete newSecrets[key];
                setSecrets(newSecrets);
                toast.success(`Deleted secret: ${key}`);
            }
        } catch (error) {
            console.error('Failed to delete secret:', error);
            toast.error('Failed to delete secret');
        } finally {
            setIsSaving(false);
        }
    };

    // Helper components
    const SettingRow = ({ label, description, children }) => (
        <div className="flex items-center justify-between py-4 border-b border-white/5 last:border-b-0">
            <div className="pr-4">
                <div className="text-sm font-medium text-white">{label}</div>
                {description && (
                    <div className="text-xs text-white/40 mt-1 max-w-md leading-relaxed">{description}</div>
                )}
            </div>
            <div className="flex-shrink-0">{children}</div>
        </div>
    );

    const Toggle = ({ enabled, onChange }) => (
        <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(!enabled)}
            className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-indigo-600' : 'bg-white/10'}`}
        >
            <motion.div
                className="absolute top-1 w-4 h-4 bg-white rounded-full"
                animate={{ left: enabled ? '26px' : '4px' }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
        </motion.button>
    );

    const StatusBadge = ({ available, configured }) => {
        if (available) {
            return <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> Active</span>;
        }
        if (configured) {
            return <span className="flex items-center gap-1 text-xs text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 bg-yellow-400 rounded-full" /> Configured</span>;
        }
        return <span className="flex items-center gap-1 text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">Not Active</span>;
    };

    const sidebarItems = [
        { id: 'general', label: 'General', icon: Settings, desc: 'Themes, Character & Preferences' },
        { id: 'ai', label: 'AI & Models', icon: Cpu, desc: 'Local Inference & API Keys' },
        { id: 'hardware', label: 'Hardware', icon: Monitor, desc: 'Devices & Diagnostics' },
        { id: 'system', label: 'System', icon: Terminal, desc: 'Logs, Cache & Secrets' },
    ];

    const providerConfigs = [
        { id: 'gemini', name: 'Google Gemini', desc: 'Sleek & Fast - Free tier active', url: 'https://aistudio.google.com/app/apikey' },
        { id: 'openai', name: 'OpenAI', desc: 'GPT-4o standard models', url: 'https://platform.openai.com/api-keys' },
        { id: 'anthropic', name: 'Anthropic', desc: 'Claude models', url: 'https://console.anthropic.com/settings/keys' },
        { id: 'groq', name: 'Groq Cloud', desc: 'Lightning fast open-source models', url: 'https://console.groq.com/keys' },
        { id: 'together', name: 'Together AI', desc: 'Serverless model repository', url: 'https://api.together.xyz' },
        { id: 'elevenlabs', name: 'ElevenLabs', desc: 'Hyper-realistic voice synthesis', url: 'https://elevenlabs.io' },
        { id: 'custom', name: 'Custom LLM', desc: 'Connect to any OpenAI-compatible API', url: '#' },
    ];

    return (
        <div className="h-full flex flex-col overflow-hidden bg-gray-950 text-white font-sans">
            {/* Header */}
            <div className="p-5 border-b border-white/5 flex items-center justify-between bg-gray-950/80 backdrop-blur-md sticky top-0 z-10">
                <div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
                        Nizhal AI Settings
                    </h2>
                    <p className="text-xs text-white/40 mt-1">Configure your personal assistant, hardware & secure brains</p>
                </div>
                {isModal && onClose && (
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-xl transition-all text-white/60 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                )}
            </div>

            {/* Main Content Area: Sidebar + Right Panel */}
            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <div className="w-64 border-r border-white/5 bg-gray-950/50 flex flex-col p-4 space-y-2 overflow-y-auto">
                    {sidebarItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeSection === item.id;
                        return (
                            <motion.button
                                key={item.id}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setActiveSection(item.id)}
                                className={`flex items-start gap-3 p-3 rounded-xl text-left transition-all ${
                                    isActive 
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' 
                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <Icon size={18} className={`mt-0.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-white/40'}`} />
                                <div className="min-w-0">
                                    <div className="text-sm font-semibold truncate">{item.label}</div>
                                    <div className={`text-[10px] truncate ${isActive ? 'text-indigo-200' : 'text-white/30'}`}>
                                        {item.desc}
                                    </div>
                                </div>
                            </motion.button>
                        );
                    })}

                    <div className="flex-1" />
                    
                    {/* Attribution */}
                    <div className="pt-4 border-t border-white/5 text-[10px] text-white/20">
                        <Attribution variant="simple" />
                        <div className="flex gap-2 mt-2">
                            <button onClick={() => setShowLegalModal('privacy')} className="hover:text-white/40">Privacy Policy</button>
                            <span>•</span>
                            <button onClick={() => setShowLegalModal('terms')} className="hover:text-white/40">Terms</button>
                        </div>
                    </div>
                </div>

                {/* Right Panel (Content) */}
                <div className="flex-1 overflow-y-auto bg-gray-950/20 p-6 scrollbar-thin">
                    <AnimatePresence mode="wait">
                        {activeSection === 'general' && (
                            <motion.div
                                key="general"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6 max-w-3xl"
                            >
                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/5">
                                    <Settings className="text-indigo-400" size={18} />
                                    <h3 className="text-base font-bold">General Settings</h3>
                                </div>

                                {/* Active Persona Section */}
                                <div className="space-y-3">
                                    <label className="text-xs font-semibold text-white/50 tracking-wider uppercase block">Active AI Persona</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {personas.map((persona) => (
                                            <motion.button
                                                key={persona.id}
                                                whileHover={{ scale: 1.01 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handlePersonaSwitch(persona.id)}
                                                className={`p-3 rounded-xl text-left flex items-center gap-3 transition-all ${
                                                    activePersonaId === persona.id
                                                        ? 'bg-indigo-600 border-2 border-indigo-400/50 shadow-md shadow-indigo-600/20'
                                                        : 'bg-white/5 border border-white/5 text-white/60 hover:bg-white/10'
                                                }`}
                                            >
                                                <span className="text-xl">
                                                    {persona.id === 'jarvis' && '🤖'}
                                                    {persona.id === 'kavya' && '✨'}
                                                    {persona.id === 'arjun' && '🛡️'}
                                                    {persona.id === 'naruto' && '🦊'}
                                                    {persona.id === 'goku' && '🐉'}
                                                    {persona.id === 'elsa' && '❄️'}
                                                    {persona.id === 'tamil_nanban' && '🎭'}
                                                    {persona.id === 'telugu_sneham' && '🤝'}
                                                    {persona.id === 'hindi_dost' && '🕺'}
                                                    {['jarvis','kavya','arjun','naruto','goku','elsa','tamil_nanban','telugu_sneham','hindi_dost'].indexOf(persona.id) === -1 && '👤'}
                                                </span>
                                                <div className="min-w-0">
                                                    <div className="text-xs font-bold truncate text-white">{persona.name}</div>
                                                    <div className="text-[10px] opacity-60 truncate">Language: {persona.language || 'en'}</div>
                                                </div>
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                {/* Character Model Selection */}
                                <div className="space-y-3 pt-4 border-t border-white/5">
                                    <label className="text-xs font-semibold text-white/50 tracking-wider uppercase block">Character Hologram Avatar</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                                        {[
                                            { id: 'jarvis', name: 'Jarvis Default', icon: '🔮', desc: 'Core Hologram' },
                                            { id: 'aldina', name: 'Aldina', icon: '🌸', desc: 'VRM Anime' },
                                            { id: 'zome', name: 'Zome', icon: '👧', desc: 'VRM Model' },
                                            { id: 'lazuli', name: 'Lazuli', icon: '💫', desc: 'VRM Model' },
                                            { id: 'miku', name: 'Hatsune Miku', icon: '🎤', desc: 'VRM Vocaloid' },
                                            { id: 'nahida', name: 'Nahida', icon: '🌿', desc: 'VRM Model' },
                                            { id: 'alicia', name: 'Alicia Solid', icon: '🦊', desc: 'VRM Anime' },
                                            { id: 'pranama', name: 'Pranama', icon: '🙏', desc: 'Indian VRM' },
                                            { id: 'riku', name: 'Riku Glasses', icon: '👓', desc: 'Male VRM' },
                                            { id: 'sheeba', name: 'Sheeba', icon: '👩', desc: 'VRM model' },
                                            { id: 'meera', name: 'Meera', icon: '👩‍🦰', desc: 'VRM Model' },
                                            { id: 'devika', name: 'Devika', icon: '👸', desc: 'Indian VRM' },
                                            { id: 'linda', name: 'Linda Business', icon: '👱‍♀️', desc: 'Formal VRM' },
                                            { id: 'lakshmi', name: 'Lakshmi', icon: '🕉️', desc: 'Trad VRM' },
                                            { id: 'ananya', name: 'Ananya', icon: '💃', desc: 'Casual VRM' }
                                        ].map((char) => (
                                            <motion.button
                                                key={char.id}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={async () => {
                                                    await window.nizhal?.character?.setModel?.(char.id);
                                                    handlePreferenceChange('characterModel', char.id);
                                                }}
                                                className={`p-2.5 rounded-xl text-left flex items-center gap-2.5 transition-all ${
                                                    preferences.characterModel === char.id
                                                        ? 'bg-indigo-600/20 border-2 border-indigo-500'
                                                        : 'bg-white/5 border border-white/5 hover:bg-white/10'
                                                }`}
                                            >
                                                <span className="text-xl">{char.icon}</span>
                                                <div className="min-w-0">
                                                    <div className="text-xs font-bold text-white truncate">{char.name}</div>
                                                    <div className="text-[10px] text-white/40 truncate">{char.desc}</div>
                                                </div>
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                {/* Custom Toggles and Ranges */}
                                <div className="space-y-2 pt-4 border-t border-white/5">
                                    <h4 className="text-xs font-semibold text-white/50 tracking-wider uppercase mb-2">Display & Basic Controls</h4>
                                    
                                    <SettingRow label="Theme Mode" description="Choose interface color scheme">
                                        <div className="flex bg-white/5 rounded-lg p-0.5 border border-white/5">
                                            {['light', 'dark', 'auto'].map((t) => (
                                                <button
                                                    key={t}
                                                    onClick={() => handlePreferenceChange('theme', t)}
                                                    className={`px-3 py-1 rounded-md text-xs capitalize transition-all ${
                                                        preferences.theme === t 
                                                            ? 'bg-indigo-600 text-white' 
                                                            : 'text-white/50 hover:text-white'
                                                    }`}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </SettingRow>

                                    <SettingRow label="Voice Output (Speak)" description="AI speaks responses aloud using system synthesizer">
                                        <Toggle 
                                            enabled={preferences.voiceEnabled} 
                                            onChange={(val) => handlePreferenceChange('voiceEnabled', val)} 
                                        />
                                    </SettingRow>

                                    <SettingRow label="Camera Object Detection" description="Enable neural real-time visual recognition in camera feed">
                                        <Toggle 
                                            enabled={preferences.objectDetectionEnabled} 
                                            onChange={(val) => handlePreferenceChange('objectDetectionEnabled', val)} 
                                        />
                                    </SettingRow>

                                    <SettingRow label="Startup Launch" description="Automatically launch Nizhal AI on system startup">
                                        <Toggle 
                                            enabled={preferences.startWithWindows} 
                                            onChange={(val) => handlePreferenceChange('startWithWindows', val)} 
                                        />
                                    </SettingRow>

                                    <SettingRow label="Always on Top" description="Keep character hologram layered above other system windows">
                                        <Toggle 
                                            enabled={preferences.alwaysOnTop} 
                                            onChange={(val) => {
                                                handlePreferenceChange('alwaysOnTop', val);
                                                window.nizhal?.window.setAlwaysOnTop(val);
                                            }} 
                                        />
                                    </SettingRow>

                                    {/* Weather Settings */}
                                    <div className="py-4 border-b border-white/5">
                                        <div className="flex justify-between items-center mb-2">
                                            <div>
                                                <div className="text-sm font-medium text-white">Weather Location</div>
                                                <div className="text-xs text-white/40 mt-1">Define city for voice and widget forecasts</div>
                                            </div>
                                            <span className="text-xs text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-full">
                                                {preferences.weatherLocation?.name || 'Kochi, IN'}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Search city (e.g. Cochin, Chennai, New York)..."
                                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500/50 outline-none"
                                                onKeyDown={async (e) => {
                                                    if (e.key === 'Enter') {
                                                        const city = e.target.value;
                                                        if (!city) return;
                                                        try {
                                                            const { weatherService } = await import('../../assistant/life-manager/Weather');
                                                            const loc = await weatherService.resolveLocation(city);
                                                            if (loc) {
                                                                handlePreferenceChange('weatherLocation', loc);
                                                                e.target.value = '';
                                                                toast.success(`Weather location set to ${loc.name}`);
                                                            } else {
                                                                toast.error('City not found');
                                                            }
                                                        } catch (err) {
                                                            console.error(err);
                                                            toast.error('Failed to resolve weather location');
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Opacity and Scale ranges */}
                                    <div className="py-4 border-b border-white/5">
                                        <div className="flex justify-between text-xs font-medium text-white mb-2">
                                            <span>Character Opacity</span>
                                            <span className="text-white/40">{Math.round((preferences.characterOpacity || 0.8) * 100)}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0.1"
                                            max="1.0"
                                            step="0.05"
                                            value={preferences.characterOpacity || 0.8}
                                            onChange={async (e) => {
                                                const val = parseFloat(e.target.value);
                                                handlePreferenceChange('characterOpacity', val);
                                                await window.nizhal?.state?.set?.('ui.transparency', val);
                                            }}
                                            className="w-full accent-indigo-500 bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>

                                    <div className="py-4 border-b border-white/5">
                                        <div className="flex justify-between text-xs font-medium text-white mb-2">
                                            <span>Character Rendering Scale</span>
                                            <span className="text-white/40">{Math.round((preferences.characterScale || 1.0) * 100)}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0.5"
                                            max="2.0"
                                            step="0.1"
                                            value={preferences.characterScale || 1.0}
                                            onChange={async (e) => {
                                                const val = parseFloat(e.target.value);
                                                handlePreferenceChange('characterScale', val);
                                                await window.nizhal?.state?.set?.('ui.characterScale', val);
                                            }}
                                            className="w-full accent-indigo-500 bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>

                                    {/* Snapping position presets */}
                                    <div className="py-4">
                                        <div className="text-sm font-medium text-white mb-2">Snap Placement Presets</div>
                                        <div className="grid grid-cols-4 gap-2">
                                            {[
                                                { id: 'top-left', label: 'Top Left', icon: '↖️' },
                                                { id: 'top-right', label: 'Top Right', icon: '↗️' },
                                                { id: 'bottom-left', label: 'Bottom Left', icon: '↙️' },
                                                { id: 'bottom-right', label: 'Bottom Right', icon: '↘️' }
                                            ].map((pos) => (
                                                <button
                                                    key={pos.id}
                                                    onClick={() => {
                                                        window.nizhal?.character?.snap?.(pos.id);
                                                        toast.success(`Character snapped to: ${pos.label}`);
                                                    }}
                                                    className="py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-center text-sm font-semibold transition-all flex flex-col items-center gap-1"
                                                >
                                                    <span>{pos.icon}</span>
                                                    <span className="text-[10px] text-white/50">{pos.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeSection === 'ai' && (
                            <motion.div
                                key="ai"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6 max-w-3xl"
                            >
                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/5">
                                    <Cpu className="text-indigo-400" size={18} />
                                    <h3 className="text-base font-bold">AI Brains & Model Routing</h3>
                                </div>

                                {/* Active Inference State Banner */}
                                <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-white flex items-center gap-2">
                                            <Shield size={16} className="text-indigo-400" /> Current Inference Active
                                        </span>
                                        <span className="text-xs bg-indigo-500/30 border border-indigo-400/30 text-indigo-300 font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                            {providerStatus?.currentProvider || 'None'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-white/50 leading-relaxed">
                                        Tasks will route either through low-latency local model running directly on your CPU/GPU hardware, or safely failover to super-intelligent cloud endpoints based on complexity.
                                    </p>
                                </div>

                                {/* EMBEDDED LOCAL INFERENCE (CANDLE INTEGRATION) */}
                                <div className="space-y-4 p-5 rounded-2xl bg-white/5 border border-white/10">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                                <Cpu className="text-indigo-400" size={20} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-white">Candle Local Inference Engine</h4>
                                                <p className="text-xs text-white/40 mt-0.5">Self-Contained zero-setup offline Gemma 4B Brain</p>
                                            </div>
                                        </div>
                                        {gpuInfo && (
                                            <span className="text-xs font-semibold px-2.5 py-1 bg-green-500/10 text-green-400 rounded-full border border-green-500/20 flex items-center gap-1">
                                                <Check size={12} /> {gpuInfo.backend || 'CPU Acceleration'}
                                            </span>
                                        )}
                                    </div>

                                    {/* Download / Progress section */}
                                    <div className="pt-2">
                                        {localModelProgress !== null ? (
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-xs text-indigo-300">
                                                    <span>Initializing AI brain in background...</span>
                                                    <span className="font-mono">{Math.round(localModelProgress * 100)}%</span>
                                                </div>
                                                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                                                    <div 
                                                        className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                                                        style={{ width: `${localModelProgress * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={triggerLocalModelDownload}
                                                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/15 flex items-center justify-center gap-2"
                                                >
                                                    <RefreshCw size={14} /> Download Gemma 4B Model (Silent)
                                                </button>
                                                <button
                                                    disabled={localModelLoading}
                                                    onClick={triggerLocalModelLoad}
                                                    className="py-2.5 px-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1.5"
                                                >
                                                    {localModelLoading ? (
                                                        <>
                                                            <Loader2 className="animate-spin" size={14} /> Loading...
                                                        </>
                                                    ) : (
                                                        'Load Model'
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* CLOUD PROVIDERS & KEYRING MANAGEMENT */}
                                <div className="space-y-3">
                                    <label className="text-xs font-semibold text-white/50 tracking-wider uppercase block">Cloud Models & Keyring Vault</label>
                                    
                                    <div className="space-y-3">
                                        {providerConfigs.map((config) => {
                                            const isEditing = editingKeyProvider === config.id;
                                            const hasKey = !!apiKeys[config.id];
                                            const status = validationStatus[config.id] || 'idle';
                                            const errMsg = validationMessage[config.id] || '';

                                            return (
                                                <div 
                                                    key={config.id}
                                                    className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all space-y-3"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <div className="text-sm font-bold text-white flex items-center gap-2">
                                                                {config.name}
                                                                <StatusBadge 
                                                                    available={providerStatus?.currentProvider === config.id} 
                                                                    configured={hasKey} 
                                                                />
                                                            </div>
                                                            <div className="text-xs text-white/40 mt-0.5">{config.desc}</div>
                                                        </div>

                                                        <div className="flex gap-2">
                                                            {hasKey && (
                                                                <button
                                                                    onClick={() => handleDeleteApiKey(config.id)}
                                                                    className="p-2 text-white/40 hover:text-red-400 bg-white/5 hover:bg-red-500/10 rounded-xl border border-white/5 transition-all"
                                                                    title="Delete key"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => {
                                                                    if (isEditing) {
                                                                        setEditingKeyProvider(null);
                                                                        setTempKeyValue('');
                                                                    } else {
                                                                        setEditingKeyProvider(config.id);
                                                                        setTempKeyValue(apiKeys[config.id] || '');
                                                                        // Reset validation
                                                                        setValidationStatus(prev => ({ ...prev, [config.id]: 'idle' }));
                                                                    }
                                                                }}
                                                                className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-xs font-bold transition-all text-indigo-300"
                                                            >
                                                                {isEditing ? 'Cancel' : hasKey ? 'Edit Key' : 'Add Key'}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Key editing block */}
                                                    {isEditing && (
                                                        <div className="space-y-3 pt-3 border-t border-white/5">
                                                            {config.id === 'custom' && (
                                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Custom Provider Name"
                                                                        value={customProviderName}
                                                                        onChange={(e) => setCustomProviderName(e.target.value)}
                                                                        className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                                                                    />
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Base URL (e.g. http://localhost:8080/v1)"
                                                                        value={customBaseUrl}
                                                                        onChange={(e) => setCustomBaseUrl(e.target.value)}
                                                                        className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-indigo-500"
                                                                    />
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Model Name (e.g. llama3)"
                                                                        value={customModelName}
                                                                        onChange={(e) => setCustomModelName(e.target.value)}
                                                                        className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-indigo-500"
                                                                    />
                                                                </div>
                                                            )}

                                                            <div className="flex gap-2">
                                                                <div className="relative flex-1">
                                                                    <input
                                                                        type="password"
                                                                        placeholder="Paste API credential key..."
                                                                        value={tempKeyValue}
                                                                        onChange={(e) => setTempKeyValue(e.target.value)}
                                                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-indigo-500 font-mono"
                                                                    />
                                                                    {status === 'validating' && (
                                                                        <Loader2 className="absolute right-3 top-3 animate-spin text-indigo-400" size={16} />
                                                                    )}
                                                                    {status === 'success' && (
                                                                        <Check className="absolute right-3 top-3 text-green-400" size={16} />
                                                                    )}
                                                                    {status === 'error' && (
                                                                        <AlertCircle className="absolute right-3 top-3 text-red-400" size={16} />
                                                                    )}
                                                                </div>
                                                                <button
                                                                    disabled={status === 'validating'}
                                                                    onClick={() => handleSaveApiKey(config.id)}
                                                                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/10 flex items-center gap-1.5"
                                                                >
                                                                    {status === 'validating' ? 'Validating...' : 'Validate & Save'}
                                                                </button>
                                                            </div>

                                                            {errMsg && (
                                                                <p className="text-[11px] text-red-400 flex items-start gap-1 font-medium bg-red-500/5 p-2.5 rounded-lg border border-red-500/10">
                                                                    <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                                                                    {errMsg}
                                                                </p>
                                                            )}

                                                            {config.url && config.url !== '#' && (
                                                                <button
                                                                    onClick={() => window.nizhal?.app?.openExternal(config.url)}
                                                                    className="text-[10px] text-indigo-400 hover:underline text-left block"
                                                                >
                                                                    How to obtain a {config.name} API Key? Click here to visit developer portal.
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* If Key is saved, show Model selection & Primary use options */}
                                                    {hasKey && !isEditing && (
                                                        <div className="pt-3 border-t border-white/5 flex flex-wrap gap-2 items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs text-white/50">Active Model:</span>
                                                                <select
                                                                    value={preferences[`aiModel_${config.id}`] || ''}
                                                                    onChange={(e) => handleModelChange(config.id, e.target.value)}
                                                                    className="bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-indigo-500"
                                                                >
                                                                    <option value="" disabled className="bg-gray-900">Select model</option>
                                                                    {availableModels
                                                                        .filter(m => m.provider === config.id)
                                                                        .map(model => (
                                                                            <option key={model.id} value={model.id} className="bg-gray-900">
                                                                                {model.name}
                                                                            </option>
                                                                        ))
                                                                    }
                                                                </select>
                                                            </div>

                                                            {providerStatus?.currentProvider !== config.id && (
                                                                <button
                                                                    onClick={() => handleProviderSelect(config.id)}
                                                                    className="px-3 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg text-xs font-semibold border border-indigo-500/20 transition-all"
                                                                >
                                                                    Use as Primary Brain
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* FALLBACK SETTINGS */}
                                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4 pt-4">
                                    <h4 className="text-xs font-semibold text-white/50 tracking-wider uppercase">Auto Fallback Redundancy</h4>
                                    <SettingRow 
                                        label="Enable Failover Routing" 
                                        description="Automatically hand over user intents to next-priority cloud providers if local machine or preferred brain times out."
                                    >
                                        <Toggle 
                                            enabled={providerStatus?.fallbackEnabled ?? true} 
                                            onChange={async (val) => {
                                                await window.nizhal?.ai.setFallbackEnabled(val);
                                                await handlePreferenceChange('enableFallback', val);
                                                const s = await window.nizhal?.ai.getProviderStatus();
                                                setProviderStatus(s);
                                            }} 
                                        />
                                    </SettingRow>

                                    <div className="p-3 bg-black/20 border border-white/5 rounded-xl text-xs text-white/50 leading-relaxed font-mono">
                                        Primary routing path priority order:
                                        <span className="text-indigo-400 font-bold block mt-1">
                                            {providerStatus?.providerPriority?.join(' ──> ') || 'ollama ──> gemini ──> openai ──> anthropic'}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeSection === 'hardware' && (
                            <motion.div
                                key="hardware"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6 max-w-3xl"
                            >
                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/5">
                                    <Monitor className="text-indigo-400" size={18} />
                                    <h3 className="text-base font-bold">Hardware & Interaction</h3>
                                </div>

                                <div className="space-y-2">
                                    {availableMonitors && availableMonitors.length > 0 && (
                                        <SettingRow label="Active Screen / Display" description="Route character rendering to specific connected visual hardware screen.">
                                            <select
                                                value={preferences.characterMonitor || availableMonitors[0]}
                                                onChange={async (e) => {
                                                    const val = e.target.value;
                                                    handlePreferenceChange('characterMonitor', val);
                                                    await window.nizhal?.windowControls?.setMonitor?.(val);
                                                }}
                                                className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                                            >
                                                {availableMonitors.map((mon) => (
                                                    <option key={mon} value={mon} className="bg-gray-900">
                                                        {mon}
                                                    </option>
                                                ))}
                                            </select>
                                        </SettingRow>
                                    )}

                                    <SettingRow label="Interact with mouse hover click-through" description="Allow clicks to pass through transparent character body mesh.">
                                        <Toggle 
                                            enabled={preferences.clickThrough ?? true} 
                                            onChange={async (value) => {
                                                handlePreferenceChange('clickThrough', value);
                                                await window.nizhal?.state?.set?.('ui.clickThrough', value);
                                                await window.nizhal?.character?.setClickThrough?.(value);
                                            }}
                                        />
                                    </SettingRow>

                                    <SettingRow label="Real-time Mouse Tracking" description="Make VRM Avatar eyes and head follow mouse movements in background">
                                        <Toggle 
                                            enabled={preferences.mouseTracking !== false} 
                                            onChange={(val) => handlePreferenceChange('mouseTracking', val)} 
                                        />
                                    </SettingRow>

                                    <SettingRow label="Auto Blinking" description="Simulate natural eye-lid blinking timings on character models">
                                        <Toggle 
                                            enabled={preferences.autoBlink !== false} 
                                            onChange={(val) => handlePreferenceChange('autoBlink', val)} 
                                        />
                                    </SettingRow>

                                    <SettingRow label="Enable gravity sitting" description="Make avatar drop with physical velocity and sit comfortably on the taskbar">
                                        <Toggle 
                                            enabled={preferences.enableGravity} 
                                            onChange={(val) => handlePreferenceChange('enableGravity', val)} 
                                        />
                                    </SettingRow>

                                    <SettingRow label="Visual Beat Dancing" description="Allow character VRM skeleton to dance dynamically to active music playing on desktop audio device">
                                        <Toggle 
                                            enabled={preferences.enableDance !== false} 
                                            onChange={(val) => handlePreferenceChange('enableDance', val)} 
                                        />
                                    </SettingRow>
                                </div>

                                {/* Troubleshooting section */}
                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <h4 className="text-xs font-semibold text-white/50 tracking-wider uppercase">Voice Agent Hardware Diagnostics</h4>
                                    
                                    <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/10 flex items-center justify-between">
                                        <div>
                                            <div className="text-sm font-semibold text-white">Restart Voice Realtime Agent</div>
                                            <div className="text-xs text-white/40 mt-1">Clears audio buffer leaks and resets microphone connections</div>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    await window.nizhal?.livekit?.restartAgent?.();
                                                    toast.success('Realtime LiveKit voice agent successfully restarted');
                                                } catch (e) {
                                                    toast.error('Failed to restart Voice agent');
                                                }
                                            }}
                                            className="px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-xl text-xs font-bold border border-orange-500/20 transition-all flex items-center gap-1.5"
                                        >
                                            <RefreshCw size={14} /> Restart Agent
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeSection === 'system' && (
                            <motion.div
                                key="system"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6 max-w-3xl"
                            >
                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/5">
                                    <Terminal className="text-indigo-400" size={18} />
                                    <h3 className="text-base font-bold">System, Secrets & Environment</h3>
                                </div>

                                {/* System metadata block */}
                                <div className="grid grid-cols-2 gap-3 p-4 bg-white/5 border border-white/5 rounded-2xl">
                                    <div>
                                        <span className="text-[10px] text-white/40 block uppercase tracking-wider">Application Platform</span>
                                        <span className="text-xs font-semibold text-white/80 mt-1 block">Linux Tauri App Native</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-white/40 block uppercase tracking-wider">Build Sandbox</span>
                                        <span className="text-xs font-semibold text-white/80 mt-1 block">Production Local Mode</span>
                                    </div>
                                </div>

                                {/* SECRETS MANAGER */}
                                <div className="space-y-3 pt-2">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h4 className="text-sm font-bold text-white">Environment Secrets (.env)</h4>
                                            <p className="text-xs text-white/40 mt-0.5">Manage plaintext configuration strings stored natively</p>
                                        </div>
                                        <button
                                            onClick={() => setIsAddingSecret(true)}
                                            className="px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                                        >
                                            <Plus size={14} /> Add Secret
                                        </button>
                                    </div>

                                    {/* Adding Form */}
                                    {isAddingSecret && (
                                        <div className="p-4 rounded-xl bg-white/5 border border-indigo-500/30 space-y-3">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-[10px] text-white/40 uppercase block mb-1">Key Name</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. GEMINI_MODEL_VERSION"
                                                        value={newSecret.key}
                                                        onChange={(e) => setNewSecret(prev => ({ ...prev, key: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') }))}
                                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-white/40 uppercase block mb-1">Secret Value</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Configure value string..."
                                                        value={newSecret.value}
                                                        onChange={(e) => setNewSecret(prev => ({ ...prev, value: e.target.value }))}
                                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => setIsAddingSecret(false)} className="px-3 py-1.5 text-xs text-white/40 hover:text-white">Cancel</button>
                                                <button onClick={() => handleSaveSecret(newSecret.key, newSecret.value)} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/10">Save Secret</button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Secrets list */}
                                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                        {Object.entries(secrets).map(([key, value]) => {
                                            const isEditing = editingSecret?.key === key;
                                            const isVisible = visibleSecrets.has(key);
                                            return (
                                                <div 
                                                    key={key} 
                                                    className="p-3 bg-white/5 border border-white/5 hover:border-white/10 rounded-xl flex items-center justify-between gap-4 transition-all"
                                                >
                                                    {isEditing ? (
                                                        <div className="flex-1 flex gap-2 items-center">
                                                            <div className="flex-1">
                                                                <div className="text-[10px] text-indigo-400 font-mono mb-1">{key}</div>
                                                                <input
                                                                    type="text"
                                                                    value={editingSecret.value}
                                                                    onChange={(e) => setEditingSecret({ ...editingSecret, value: e.target.value })}
                                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-1 text-xs text-white outline-none focus:border-indigo-500"
                                                                />
                                                            </div>
                                                            <button
                                                                onClick={() => handleSaveSecret(key, editingSecret.value)}
                                                                className="p-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-xl border border-green-500/20"
                                                            >
                                                                <Save size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingSecret(null)}
                                                                className="p-2 bg-white/5 hover:bg-white/10 text-white/60 rounded-xl"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="text-[10px] text-indigo-400 font-mono font-bold tracking-wider">{key}</div>
                                                                <div className="text-xs text-white/60 mt-0.5 truncate font-mono">
                                                                    {isVisible ? value : '•'.repeat(Math.min(value.length, 24) || 8)}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                                <button
                                                                    onClick={() => toggleSecretVisibility(key)}
                                                                    className="p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/5"
                                                                >
                                                                    {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                                                                </button>
                                                                <button
                                                                    onClick={() => setEditingSecret({ key, value })}
                                                                    className="p-1.5 text-white/40 hover:text-indigo-400 rounded-lg hover:bg-white/5"
                                                                >
                                                                    <Edit2 size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteSecret(key)}
                                                                    className="p-1.5 text-white/40 hover:text-red-400 rounded-lg hover:bg-white/5"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* CLEAR CACHE / HARD DESTRUCTIVE ACTIONS */}
                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <h4 className="text-xs font-semibold text-white/50 tracking-wider uppercase">Application Hard Diagnostics & Reset</h4>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col justify-between gap-3">
                                            <div>
                                                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                                    <HardDrive size={14} className="text-indigo-400" /> Reset Memory & Cache
                                                </div>
                                                <p className="text-[11px] text-white/40 mt-1 leading-relaxed">
                                                    Clears locally stored chat session contextual history files and model inference caches.
                                                </p>
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        await window.nizhal?.ai?.clearContext?.();
                                                        toast.success('Inference context memory cleared');
                                                    } catch (e) {
                                                        toast.error('Failed to clear memory');
                                                    }
                                                }}
                                                className="w-full py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-xl text-xs font-bold transition-all"
                                            >
                                                Clear Session Context Cache
                                            </button>
                                        </div>

                                        <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 flex flex-col justify-between gap-3">
                                            <div>
                                                <div className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                                                    <Shield size={14} /> Destructive Factory Reset
                                                </div>
                                                <p className="text-[11px] text-white/40 mt-1 leading-relaxed">
                                                    Restores complete factory defaults, removes secure OS keyrings and wipes system preferences.
                                                </p>
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    if (confirm('CAUTION: This will wipe out all API keys, custom configs, and restart onboarding. Continue?')) {
                                                        await handlePreferenceChange('onboardingComplete', false);
                                                        window.location.reload();
                                                    }
                                                }}
                                                className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold transition-all"
                                            >
                                                Restart Onboarding Wizard
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Legal Document Viewer Modal */}
            <LegalDocumentViewer
                isOpen={showLegalModal !== null}
                onClose={() => setShowLegalModal(null)}
                initialDocument={showLegalModal || 'terms'}
            />
        </div>
    );
};

export default SettingsView;
