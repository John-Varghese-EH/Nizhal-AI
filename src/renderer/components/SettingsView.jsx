import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SettingsView = ({ onBack, onPersonaChange }) => {
    const [preferences, setPreferences] = useState({});
    const [personas, setPersonas] = useState([]);
    const [activePersonaId, setActivePersonaId] = useState('jarvis');
    const [isSaving, setIsSaving] = useState(false);
    const [showApiKeyModal, setShowApiKeyModal] = useState(null);
    const [apiKeyValue, setApiKeyValue] = useState('');
    const [aiProviders, setAiProviders] = useState([]);
    const [providerStatus, setProviderStatus] = useState(null);
    const [activeTab, setActiveTab] = useState('general');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const prefs = await window.nizhal?.memory.getUserPreferences();
            const allPersonas = await window.nizhal?.persona.getAll();
            const active = await window.nizhal?.persona.getActive();
            const providers = await window.nizhal?.ai.getProviders();
            const status = await window.nizhal?.ai.getProviderStatus();

            setPreferences(prefs || {});
            setPersonas(allPersonas || []);
            setActivePersonaId(active?.id || 'jarvis');
            setAiProviders(providers || []);
            setProviderStatus(status || {});
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    };

    const handlePreferenceChange = async (key, value) => {
        setIsSaving(true);
        try {
            const updatedPrefs = { ...preferences, [key]: value };
            await window.nizhal?.memory.setUserPreferences(updatedPrefs);
            setPreferences(updatedPrefs);
        } catch (error) {
            console.error('Failed to save preference:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handlePersonaSwitch = async (personaId) => {
        try {
            const persona = await window.nizhal?.persona.setActive(personaId);
            setActivePersonaId(personaId);
            onPersonaChange?.(persona);
        } catch (error) {
            console.error('Failed to switch persona:', error);
        }
    };

    const handleSaveApiKey = async () => {
        if (!showApiKeyModal || !apiKeyValue.trim()) return;

        setIsSaving(true);
        try {
            const updatedApiKeys = { ...preferences.apiKeys, [showApiKeyModal]: apiKeyValue.trim() };
            await window.nizhal?.memory.setUserPreferences({ apiKeys: updatedApiKeys });
            setPreferences(prev => ({ ...prev, apiKeys: updatedApiKeys }));

            // Update the provider configuration
            await window.nizhal?.ai.setProvider(showApiKeyModal, { apiKey: apiKeyValue.trim() });

            // Refresh provider status
            const status = await window.nizhal?.ai.getProviderStatus();
            const providers = await window.nizhal?.ai.getProviders();
            setProviderStatus(status);
            setAiProviders(providers);

            setShowApiKeyModal(null);
            setApiKeyValue('');
        } catch (error) {
            console.error('Failed to save API key:', error);
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
        } catch (error) {
            console.error('Failed to set provider:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleFallbackToggle = async (enabled) => {
        try {
            await window.nizhal?.ai.setFallbackEnabled(enabled);
            await handlePreferenceChange('enableFallback', enabled);
            const status = await window.nizhal?.ai.getProviderStatus();
            setProviderStatus(status);
        } catch (error) {
            console.error('Failed to toggle fallback:', error);
        }
    };

    const checkLocalAI = async () => {
        const available = await window.nizhal?.ai.checkLocalAI();
        const status = await window.nizhal?.ai.getProviderStatus();
        setProviderStatus(status);
        return available;
    };

    const openExternal = (url) => {
        window.nizhal?.app.openExternal(url);
    };

    const SettingRow = ({ label, description, children }) => (
        <div className="flex items-center justify-between py-3">
            <div>
                <div className="text-sm font-medium text-white">{label}</div>
                {description && (
                    <div className="text-xs text-white/40 mt-0.5">{description}</div>
                )}
            </div>
            <div className="flex-shrink-0">{children}</div>
        </div>
    );

    const Toggle = ({ enabled, onChange }) => (
        <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(!enabled)}
            className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-indigo-600' : 'bg-white/20'
                }`}
        >
            <motion.div
                className="absolute top-1 w-4 h-4 bg-white rounded-full"
                animate={{ left: enabled ? '26px' : '4px' }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
        </motion.button>
    );

    const StatusIndicator = ({ available, configured }) => {
        if (available) {
            return <span className="flex items-center gap-1.5 text-xs text-green-400"><span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> Connected</span>;
        }
        if (configured) {
            return <span className="flex items-center gap-1.5 text-xs text-yellow-400"><span className="w-2 h-2 bg-yellow-400 rounded-full" /> Configured</span>;
        }
        return <span className="flex items-center gap-1.5 text-xs text-white/30"><span className="w-2 h-2 bg-white/30 rounded-full" /> Not set</span>;
    };

    const TabButton = ({ id, label, active }) => (
        <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${active ? 'bg-indigo-600 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
        >
            {label}
        </motion.button>
    );

    const apiKeyConfigs = [
        { id: 'gemini', name: 'Google Gemini', description: 'Free tier available', url: 'https://aistudio.google.com/app/apikey' },
        { id: 'openai', name: 'OpenAI', description: 'GPT-4o models', url: 'https://platform.openai.com/api-keys' },
        { id: 'anthropic', name: 'Anthropic', description: 'Claude models', url: 'https://console.anthropic.com/settings/keys' },
        { id: 'elevenlabs', name: 'ElevenLabs', description: 'Premium voice synthesis', url: 'https://elevenlabs.io/api' }
    ];

    return (
        <div className="h-full flex flex-col overflow-hidden">
            <div className="p-4 border-b border-white/5">
                <h2 className="text-lg font-semibold gradient-text">Settings</h2>
                <p className="text-xs text-white/50 mt-1">Customize your Nizhal AI experience</p>
            </div>

            {/* Tab Navigation */}
            <div className="px-4 py-2 flex gap-2 border-b border-white/5 overflow-x-auto">
                <TabButton id="general" label="General" active={activeTab === 'general'} />
                <TabButton id="character" label="Character" active={activeTab === 'character'} />
                <TabButton id="ai" label="AI Providers" active={activeTab === 'ai'} />
                <TabButton id="voice" label="Voice" active={activeTab === 'voice'} />
                <TabButton id="shortcuts" label="Shortcuts" active={activeTab === 'shortcuts'} />
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-6">
                    {/* Sponsor Button */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => openExternal('https://www.buymeacoffee.com/nizhalai')}
                        className="w-full py-4 px-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center gap-3 text-white font-medium shadow-lg shadow-orange-500/25"
                    >
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.216 6.415l-.132-.666c-.119-.598-.388-1.163-1.001-1.379-.197-.069-.42-.098-.57-.241-.152-.143-.196-.366-.231-.572-.065-.378-.125-.756-.192-1.133-.057-.325-.102-.69-.25-.987-.195-.4-.597-.634-.996-.788a5.723 5.723 0 00-.626-.194c-1-.263-2.05-.36-3.077-.416a25.834 25.834 0 00-3.7.062c-.915.083-1.88.184-2.75.5-.318.116-.646.256-.888.501-.297.302-.393.77-.177 1.146.154.267.415.456.692.58.36.162.737.284 1.123.366 1.075.238 2.189.331 3.287.37 1.218.05 2.437.01 3.65-.118.299-.033.598-.073.896-.119.352-.054.578-.513.474-.834-.124-.383-.457-.531-.834-.473-.466.074-.96.108-1.382.146-1.177.08-2.358.082-3.536.006a22.228 22.228 0 01-1.157-.107c-.086-.01-.18-.025-.258-.036-.243-.036-.484-.08-.724-.13-.111-.027-.111-.185 0-.212h.005c.277-.06.557-.108.838-.147h.002c.131-.009.263-.032.394-.048a25.076 25.076 0 013.426-.12c.674.019 1.347.067 2.017.144l.228.031c.267.04.533.088.798.145.392.085.895.113 1.07.542.055.137.08.288.111.431l.319 1.484a.237.237 0 01-.199.284h-.003c-.037.006-.075.01-.112.015a36.704 36.704 0 01-4.743.295 37.059 37.059 0 01-4.699-.304c-.14-.017-.293-.042-.417-.06-.326-.048-.649-.108-.973-.161-.393-.065-.768-.032-1.123.161-.29.16-.527.404-.675.701-.154.316-.199.66-.267 1-.069.34-.176.707-.135 1.056.087.753.613 1.365 1.37 1.502a39.69 39.69 0 0011.343.376.483.483 0 01.535.53l-.071.697-1.018 9.907c-.041.41-.047.832-.125 1.237-.122.637-.553 1.028-1.182 1.171-.577.131-1.165.185-1.756.205-.656.023-1.313-.019-1.969-.062-.661-.043-1.32-.104-1.979-.176-.289-.032-.554-.146-.7-.427-.148-.283-.148-.621-.085-.926.111-.533.32-1.017.596-1.468a21.265 21.265 0 011.783-2.456c.299-.355.614-.697.922-1.045.079-.09.154-.185.232-.276.208-.243.189-.589-.074-.773-.25-.175-.582-.137-.822.101-.336.334-.666.673-.988 1.021a23.234 23.234 0 00-2.189 2.851c-.431.66-.781 1.374-.975 2.148-.104.413-.143.846-.07 1.265.074.423.261.807.536 1.113.493.55 1.2.786 1.923.88.749.097 1.507.117 2.261.106.774-.012 1.549-.068 2.319-.16.696-.083 1.39-.206 2.03-.486.574-.252 1.112-.671 1.359-1.273.148-.358.215-.747.268-1.13l.052-.426c.015-.116.029-.232.041-.347l.902-8.765c.028-.266.058-.532.088-.797l.035-.318.024-.2.025-.236.034-.315.018-.162.009-.083c.005-.044.011-.088.016-.131.053-.441-.291-.844-.753-.918a43.422 43.422 0 01-2.693-.448 38.69 38.69 0 01-2.443-.55c-.212-.057-.424-.116-.636-.177-.146-.042-.293-.084-.439-.127-.072-.021-.143-.043-.213-.064-.034-.011-.067-.021-.1-.031h-.003l-.265-.082-.13-.041-.014-.004h-.002l-.016-.005-.028-.009-.064-.02a.486.486 0 01-.332-.597l.008-.027.016-.051.014-.046.01-.034c.112-.378.226-.757.35-1.132.132-.398.274-.793.433-1.18.083-.204.172-.405.266-.603a.514.514 0 01.456-.279h.005l.009.001.027.002.064.007.13.013.279.03c.147.016.294.031.442.046l.451.044c.149.014.298.028.448.041l.444.04c.147.012.294.024.442.035l.435.032.43.03.426.028.42.026.414.024.408.022.4.02.392.018.384.016.375.013.366.011.357.01h.346l.337.005h.656l.316-.003.306-.006z" />
                        </svg>
                        Sponsor Nizhal AI ☕
                    </motion.button>

                    <AnimatePresence mode="wait">
                        {activeTab === 'general' && (
                            <motion.div
                                key="general"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-6"
                            >
                                {/* Persona Selection */}
                                <div className="space-y-1">
                                    <h3 className="text-sm font-medium text-white/70 mb-3">Active Persona</h3>
                                    <div className="grid grid-cols-3 gap-2">
                                        {personas.map((persona) => (
                                            <motion.button
                                                key={persona.id}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handlePersonaSwitch(persona.id)}
                                                className={`p-3 rounded-xl text-center transition-all ${activePersonaId === persona.id
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                                                    }`}
                                            >
                                                <div className="text-2xl mb-1">
                                                    {(() => {
                                                        const icons = {
                                                            jarvis: '🤖',
                                                            kavya: '✨',
                                                            arjun: '🛡️',
                                                            naruto: '🦊',
                                                            goku: '🐉',
                                                            elsa: '❄️',
                                                            tamil_nanban: '🎭',
                                                            telugu_sneham: '🤝',
                                                            hindi_dost: '🕺'
                                                        };
                                                        return icons[persona.id] || '👤';
                                                    })()}
                                                </div>
                                                <div className="text-xs font-medium truncate">{persona.name}</div>
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                {/* General Settings */}
                                <div className="space-y-1 border-t border-white/5 pt-4">
                                    <h3 className="text-sm font-medium text-white/70 mb-3">General</h3>

                                    <SettingRow label="Voice Output" description="Enable AI speech responses">
                                        <Toggle
                                            enabled={preferences.voiceEnabled}
                                            onChange={(value) => handlePreferenceChange('voiceEnabled', value)}
                                        />
                                    </SettingRow>

                                    <SettingRow label="Always on Top" description="Keep window above others">
                                        <Toggle
                                            enabled={preferences.alwaysOnTop}
                                            onChange={(value) => {
                                                handlePreferenceChange('alwaysOnTop', value);
                                                window.nizhal?.window.setAlwaysOnTop(value);
                                            }}
                                        />
                                    </SettingRow>

                                    <SettingRow label="Start with Windows" description="Launch on system startup">
                                        <Toggle
                                            enabled={preferences.startWithWindows}
                                            onChange={(value) => handlePreferenceChange('startWithWindows', value)}
                                        />
                                    </SettingRow>
                                </div>

                                {/* Support Links */}
                                <div className="border-t border-white/5 pt-4 space-y-3">
                                    <h3 className="text-sm font-medium text-white/70">Support & Links</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => openExternal('https://patreon.com/nizhalai')}
                                            className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-400 text-sm font-medium"
                                        >
                                            Patreon
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => openExternal('https://github.com/nizhal-ai')}
                                            className="p-3 bg-white/5 border border-white/10 rounded-xl text-white/70 text-sm font-medium"
                                        >
                                            GitHub
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'character' && (
                            <motion.div
                                key="character"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-6"
                            >
                                {/* Character Model Selection */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-medium text-white/70">Character Model</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { id: 'jarvis', name: 'Jarvis', icon: '🔮', desc: 'Hologram' },
                                            { id: 'zome', name: 'Zome', icon: '👧', desc: 'VRM' },
                                            { id: 'lazuli', name: 'Lazuli', icon: '💫', desc: 'VRM' },
                                            { id: 'aldina', name: 'Aldina', icon: '🌸', desc: 'VRM' }
                                        ].map((char) => (
                                            <motion.button
                                                key={char.id}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => {
                                                    handlePreferenceChange('characterModel', char.id);
                                                    window.nizhal?.character?.setModel?.(char.id);
                                                }}
                                                className={`p-3 rounded-xl text-left transition-all ${preferences.characterModel === char.id
                                                    ? 'bg-indigo-600/30 border-2 border-indigo-500'
                                                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl">{char.icon}</span>
                                                    <div>
                                                        <div className="text-sm font-medium text-white">{char.name}</div>
                                                        <div className="text-xs text-white/40">{char.desc}</div>
                                                    </div>
                                                </div>
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                {/* Display Settings */}
                                <div className="space-y-3 border-t border-white/5 pt-4">
                                    <h3 className="text-sm font-medium text-white/70">Display</h3>

                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-white/60">Size</span>
                                            <span className="text-white/40">{(preferences.characterScale || 1).toFixed(1)}x</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0.5"
                                            max="2"
                                            step="0.1"
                                            value={preferences.characterScale || 1}
                                            onChange={(e) => handlePreferenceChange('characterScale', parseFloat(e.target.value))}
                                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                        />
                                    </div>

                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-white/60">Opacity</span>
                                            <span className="text-white/40">{Math.round((preferences.characterOpacity || 1) * 100)}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0.3"
                                            max="1"
                                            step="0.1"
                                            value={preferences.characterOpacity || 1}
                                            onChange={(e) => handlePreferenceChange('characterOpacity', parseFloat(e.target.value))}
                                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                        />
                                    </div>

                                    <div className="flex gap-2">
                                        {['low', 'medium', 'high'].map((q) => (
                                            <button
                                                key={q}
                                                className={`flex-1 py-2 rounded-lg text-xs capitalize ${preferences.characterQuality === q
                                                    ? 'bg-indigo-500/30 text-white'
                                                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                                                    }`}
                                                onClick={() => handlePreferenceChange('characterQuality', q)}
                                            >
                                                {q} Quality
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Behavior Settings */}
                                <div className="space-y-3 border-t border-white/5 pt-4">
                                    <h3 className="text-sm font-medium text-white/70">Behavior</h3>

                                    <SettingRow label="Enable Gravity" description="Character falls and sits on taskbar">
                                        <Toggle
                                            enabled={preferences.enableGravity}
                                            onChange={(value) => handlePreferenceChange('enableGravity', value)}
                                        />
                                    </SettingRow>

                                    <SettingRow label="Dance to Music" description="Responds to audio beats">
                                        <Toggle
                                            enabled={preferences.enableDance !== false}
                                            onChange={(value) => handlePreferenceChange('enableDance', value)}
                                        />
                                    </SettingRow>

                                    <SettingRow label="Mouse Tracking" description="Eyes follow cursor">
                                        <Toggle
                                            enabled={preferences.mouseTracking !== false}
                                            onChange={(value) => handlePreferenceChange('mouseTracking', value)}
                                        />
                                    </SettingRow>

                                    <SettingRow label="Auto Blink" description="Natural blinking animation">
                                        <Toggle
                                            enabled={preferences.autoBlink !== false}
                                            onChange={(value) => handlePreferenceChange('autoBlink', value)}
                                        />
                                    </SettingRow>
                                </div>

                                {/* Position Presets */}
                                <div className="space-y-3 border-t border-white/5 pt-4">
                                    <h3 className="text-sm font-medium text-white/70">Quick Position</h3>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[
                                            { pos: 'top-left', icon: '↖️' },
                                            { pos: 'top-right', icon: '↗️' },
                                            { pos: 'bottom-left', icon: '↙️' },
                                            { pos: 'bottom-right', icon: '↘️' }
                                        ].map(({ pos, icon }) => (
                                            <button
                                                key={pos}
                                                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-lg"
                                                onClick={() => window.nizhal?.character?.snap?.(pos)}
                                            >
                                                {icon}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'ai' && (
                            <motion.div
                                key="ai"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-6"
                            >
                                {/* Current Provider Status */}
                                <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-white">Active Provider</span>
                                        <span className="text-xs px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded-full">
                                            {providerStatus?.currentProvider || 'auto'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-white/50">
                                        {providerStatus?.ollamaAvailable
                                            ? '✓ Local AI available'
                                            : '✗ Local AI not running, using cloud providers'}
                                    </p>
                                </div>

                                {/* Local AI Section */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-medium text-white/70">Local AI (Ollama)</h3>
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={checkLocalAI}
                                            className="text-xs text-indigo-400 hover:text-indigo-300"
                                        >
                                            Refresh Status
                                        </motion.button>
                                    </div>

                                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${providerStatus?.ollamaAvailable ? 'bg-green-500/20' : 'bg-white/10'}`}>
                                                    <span className="text-xl">🦙</span>
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-white">Ollama</div>
                                                    <div className="text-xs text-white/40">Free, private, runs locally</div>
                                                </div>
                                            </div>
                                            <StatusIndicator available={providerStatus?.ollamaAvailable} configured={true} />
                                        </div>

                                        {!providerStatus?.ollamaAvailable && (
                                            <div className="mt-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                                                <p className="text-xs text-yellow-300 mb-2">
                                                    Ollama is not running. Start it for free local AI:
                                                </p>
                                                <motion.button
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => openExternal('https://ollama.com')}
                                                    className="text-xs text-yellow-400 underline"
                                                >
                                                    Download Ollama →
                                                </motion.button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Cloud Providers */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-medium text-white/70">Cloud Providers</h3>

                                    <div className="space-y-2">
                                        {aiProviders.filter(p => p.id !== 'ollama').map((provider) => (
                                            <motion.div
                                                key={provider.id}
                                                whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                                                className="p-4 rounded-xl bg-white/5 border border-white/10"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${provider.available ? 'bg-green-500/20' : 'bg-white/10'}`}>
                                                            {provider.id === 'gemini' && <span className="text-xl">✨</span>}
                                                            {provider.id === 'openai' && <span className="text-xl">🤖</span>}
                                                            {provider.id === 'anthropic' && <span className="text-xl">🧠</span>}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-white">{provider.name}</div>
                                                            <div className="text-xs text-white/40">{provider.description}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <StatusIndicator available={provider.available} configured={provider.configured} />
                                                        <motion.button
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => {
                                                                setShowApiKeyModal(provider.id);
                                                                setApiKeyValue(preferences.apiKeys?.[provider.id] || '');
                                                            }}
                                                            className="text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white/70"
                                                        >
                                                            {provider.configured ? 'Edit' : 'Add Key'}
                                                        </motion.button>
                                                    </div>
                                                </div>

                                                {provider.configured && providerStatus?.currentProvider !== provider.id && (
                                                    <motion.button
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => handleProviderSelect(provider.id)}
                                                        className="mt-3 w-full py-2 text-xs bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded-lg"
                                                    >
                                                        Use as Primary
                                                    </motion.button>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                {/* Fallback Settings */}
                                <div className="space-y-3 border-t border-white/5 pt-4">
                                    <h3 className="text-sm font-medium text-white/70">Fallback Settings</h3>

                                    <SettingRow
                                        label="Automatic Fallback"
                                        description="Try other providers if primary fails"
                                    >
                                        <Toggle
                                            enabled={providerStatus?.fallbackEnabled ?? true}
                                            onChange={handleFallbackToggle}
                                        />
                                    </SettingRow>

                                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                                        <p className="text-xs text-white/50">
                                            Priority: {providerStatus?.providerPriority?.join(' → ') || 'ollama → gemini → openai → anthropic'}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'voice' && (
                            <motion.div
                                key="voice"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-6"
                            >
                                {/* Voice Input */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-medium text-white/70">Voice Input</h3>

                                    <SettingRow
                                        label="Voice Commands"
                                        description="Use microphone to talk to AI"
                                    >
                                        <Toggle
                                            enabled={preferences.voiceInputEnabled}
                                            onChange={(value) => handlePreferenceChange('voiceInputEnabled', value)}
                                        />
                                    </SettingRow>

                                    <SettingRow
                                        label="Wake Word"
                                        description='Say "Hey Nizhal" to activate'
                                    >
                                        <Toggle
                                            enabled={preferences.wakeWordEnabled}
                                            onChange={(value) => handlePreferenceChange('wakeWordEnabled', value)}
                                        />
                                    </SettingRow>

                                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                                        <p className="text-xs text-white/50 mb-2">Supported languages:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {['English', 'Malayalam', 'Hindi', 'Tamil', 'Telugu'].map(lang => (
                                                <span key={lang} className="text-xs px-2 py-1 bg-white/10 rounded text-white/60">
                                                    {lang}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Voice Output */}
                                <div className="space-y-3 border-t border-white/5 pt-4">
                                    <h3 className="text-sm font-medium text-white/70">Voice Output</h3>

                                    <SettingRow
                                        label="Enable Speech"
                                        description="AI speaks responses aloud"
                                    >
                                        <Toggle
                                            enabled={preferences.voiceEnabled}
                                            onChange={(value) => handlePreferenceChange('voiceEnabled', value)}
                                        />
                                    </SettingRow>
                                </div>

                                {/* ElevenLabs API */}
                                <div className="space-y-3 border-t border-white/5 pt-4">
                                    <h3 className="text-sm font-medium text-white/70">Premium Voice (ElevenLabs)</h3>

                                    <motion.button
                                        whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                                        onClick={() => {
                                            setShowApiKeyModal('elevenlabs');
                                            setApiKeyValue(preferences.apiKeys?.elevenlabs || '');
                                        }}
                                        className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${preferences.apiKeys?.elevenlabs ? 'bg-green-500/20' : 'bg-white/10'}`}>
                                                <span className="text-xl">🎙️</span>
                                            </div>
                                            <div className="text-left">
                                                <div className="text-sm font-medium text-white">ElevenLabs API</div>
                                                <div className="text-xs text-white/40">Ultra-realistic AI voices</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {preferences.apiKeys?.elevenlabs
                                                ? <span className="text-xs text-green-400">✓ Set</span>
                                                : <span className="text-xs text-white/30">Not set</span>
                                            }
                                            <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'shortcuts' && (
                            <motion.div
                                key="shortcuts"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-6"
                            >
                                {/* Character Interaction */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-medium text-white/70">Character Interaction</h3>
                                    <div className="space-y-2">
                                        {[
                                            { keys: 'Alt + Click', action: 'Enable interaction mode' },
                                            { keys: 'Alt + Drag', action: 'Move character' },
                                            { keys: 'Right Click', action: 'Open context menu' },
                                            { keys: 'Click Head', action: 'Pat (shows happy reaction)' },
                                            { keys: 'Click Body', action: 'Poke (shows surprised reaction)' },
                                            { keys: 'Click Hands', action: 'Wave (shows friendly reaction)' }
                                        ].map((shortcut, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                                                <span className="text-sm text-white/80">{shortcut.action}</span>
                                                <kbd className="px-2 py-1 bg-white/10 rounded text-xs text-indigo-300 font-mono">{shortcut.keys}</kbd>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Window Controls */}
                                <div className="space-y-3 border-t border-white/5 pt-4">
                                    <h3 className="text-sm font-medium text-white/70">Window Controls</h3>
                                    <div className="space-y-2">
                                        {[
                                            { keys: 'Ctrl + Shift + N', action: 'Toggle Nizhal visibility' },
                                            { keys: 'Ctrl + Shift + C', action: 'Open chat window' },
                                            { keys: 'Escape', action: 'Close menus/panels', note: 'When focused' }
                                        ].map((shortcut, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                                                <div>
                                                    <span className="text-sm text-white/80">{shortcut.action}</span>
                                                    {shortcut.note && <span className="text-xs text-white/40 ml-2">({shortcut.note})</span>}
                                                </div>
                                                <kbd className="px-2 py-1 bg-white/10 rounded text-xs text-indigo-300 font-mono">{shortcut.keys}</kbd>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Features */}
                                <div className="space-y-3 border-t border-white/5 pt-4">
                                    <h3 className="text-sm font-medium text-white/70">Features</h3>
                                    <div className="grid grid-cols-1 gap-2">
                                        <div className="p-3 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl border border-indigo-500/20">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-lg">💤</span>
                                                <span className="text-sm font-medium text-white">Sleep Mode</span>
                                            </div>
                                            <p className="text-xs text-white/50">Character sleeps when you're idle for 1 minute</p>
                                        </div>
                                        <div className="p-3 bg-gradient-to-r from-pink-500/10 to-rose-500/10 rounded-xl border border-pink-500/20">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-lg">💕</span>
                                                <span className="text-sm font-medium text-white">Compliments</span>
                                            </div>
                                            <p className="text-xs text-white/50">Random encouragement every 5 minutes</p>
                                        </div>
                                        <div className="p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/20">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-lg">🪑</span>
                                                <span className="text-sm font-medium text-white">Window Sitting</span>
                                            </div>
                                            <p className="text-xs text-white/50">Character can sit on windows and taskbar</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="text-center pt-4 pb-2 space-y-2">
                        <div className="text-xs text-white/30">
                            Nizhal AI v1.0.0 • Made with 💜 in India
                        </div>
                        <div className="flex justify-center gap-4 text-xs text-white/20">
                            <button onClick={() => openExternal('https://nizhal.ai/privacy')} className="hover:text-white/40">Privacy</button>
                            <button onClick={() => openExternal('https://nizhal.ai/terms')} className="hover:text-white/40">Terms</button>
                            <button onClick={() => openExternal('https://nizhal.ai/changelog')} className="hover:text-white/40">Changelog</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* API Key Modal */}
            {showApiKeyModal && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                    onClick={() => setShowApiKeyModal(null)}
                >
                    <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full border border-white/10"
                    >
                        <h3 className="text-lg font-bold text-white mb-2">
                            {apiKeyConfigs.find(a => a.id === showApiKeyModal)?.name || 'API Key'}
                        </h3>
                        <p className="text-xs text-white/50 mb-4">
                            {apiKeyConfigs.find(a => a.id === showApiKeyModal)?.description}
                        </p>

                        <input
                            type="password"
                            value={apiKeyValue}
                            onChange={(e) => setApiKeyValue(e.target.value)}
                            placeholder="Enter your API key"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 mb-3"
                        />

                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => openExternal(apiKeyConfigs.find(a => a.id === showApiKeyModal)?.url || '#')}
                            className="w-full text-xs text-indigo-400 hover:text-indigo-300 mb-4 text-left"
                        >
                            Get API key →
                        </motion.button>

                        <div className="flex gap-2">
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowApiKeyModal(null)}
                                className="flex-1 py-2 bg-white/10 text-white rounded-xl"
                            >
                                Cancel
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={handleSaveApiKey}
                                disabled={isSaving}
                                className="flex-1 py-2 bg-indigo-600 text-white rounded-xl disabled:opacity-50"
                            >
                                {isSaving ? 'Saving...' : 'Save'}
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
};

export default SettingsView;
