/**
 * CloudModelPicker — Mobile-optimized AI provider setup wizard
 * 
 * On mobile devices, local AI models (Ollama, LM Studio) are not available.
 * This component guides users through setting up cloud AI providers with
 * free tiers (Groq, Gemini, HuggingFace) for a zero-cost getting-started experience.
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { invoke } from '@tauri-apps/api/core';

const CLOUD_PROVIDERS = [
    {
        id: 'groq',
        name: 'Groq',
        description: 'Ultra-fast inference with free tier',
        icon: '⚡',
        color: '#f55036',
        free: true,
        freeLimit: '30 requests/min',
        models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'gemma2-9b-it'],
        setupUrl: 'https://console.groq.com/keys',
        envKey: 'GROQ_API_KEY',
    },
    {
        id: 'gemini',
        name: 'Google Gemini',
        description: 'Powerful AI with generous free tier',
        icon: '✨',
        color: '#4285f4',
        free: true,
        freeLimit: '15 requests/min',
        models: ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'],
        setupUrl: 'https://aistudio.google.com/app/apikey',
        envKey: 'GEMINI_API_KEY',
    },
    {
        id: 'huggingface',
        name: 'Hugging Face',
        description: 'Open-source models with free API',
        icon: '🤗',
        color: '#ffcc00',
        free: true,
        freeLimit: '1000 requests/day',
        models: ['mistralai/Mistral-7B-Instruct-v0.3', 'meta-llama/Llama-3-8B-Instruct'],
        setupUrl: 'https://huggingface.co/settings/tokens',
        envKey: 'HUGGINGFACE_API_KEY',
    },
    {
        id: 'together',
        name: 'Together AI',
        description: 'Fast open-source model hosting',
        icon: '🔹',
        color: '#6366f1',
        free: false,
        freeLimit: '$5 free credits',
        models: ['meta-llama/Llama-3-70b-chat-hf', 'mistralai/Mixtral-8x7B-Instruct-v0.1'],
        setupUrl: 'https://api.together.xyz/settings/api-keys',
        envKey: 'TOGETHER_API_KEY',
    },
    {
        id: 'openai',
        name: 'OpenAI',
        description: 'GPT-4o and GPT-4o-mini',
        icon: '🧠',
        color: '#10a37f',
        free: false,
        freeLimit: 'Pay-as-you-go',
        models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'],
        setupUrl: 'https://platform.openai.com/api-keys',
        envKey: 'OPENAI_API_KEY',
    },
];

const CloudModelPicker = ({ isOpen, onClose, onProviderSet }) => {
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [apiKey, setApiKey] = useState('');
    const [step, setStep] = useState('select'); // 'select', 'setup', 'done'
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleProviderSelect = useCallback((provider) => {
        setSelectedProvider(provider);
        setApiKey('');
        setError('');
        setStep('setup');
    }, []);

    const handleSaveKey = useCallback(async () => {
        if (!apiKey.trim()) {
            setError('Please enter your API key');
            return;
        }

        setSaving(true);
        setError('');

        try {
            // Save API key via Tauri env management
            await invoke('set_env', {
                key: selectedProvider.envKey,
                value: apiKey.trim(),
            });

            // Set as active provider
            await invoke('set_provider', {
                provider: selectedProvider.id,
            });

            onProviderSet?.(selectedProvider.id);
            setStep('done');

            // Auto-close after success
            setTimeout(() => {
                onClose();
                setStep('select');
                setSelectedProvider(null);
                setApiKey('');
            }, 2000);
        } catch (e) {
            setError(`Failed to save: ${e}`);
        } finally {
            setSaving(false);
        }
    }, [apiKey, selectedProvider, onClose, onProviderSet]);

    const handleBack = useCallback(() => {
        setStep('select');
        setSelectedProvider(null);
        setApiKey('');
        setError('');
    }, []);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="w-full max-w-md mx-auto bg-gray-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border border-white/10 overflow-hidden max-h-[85vh]"
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-5 border-b border-white/10">
                        <div className="flex items-center justify-between">
                            {step === 'setup' && (
                                <button
                                    onClick={handleBack}
                                    className="text-white/60 hover:text-white text-sm"
                                >
                                    ← Back
                                </button>
                            )}
                            <h2 className="text-lg font-semibold text-white flex-1 text-center">
                                {step === 'select' ? '🤖 Choose AI Provider' :
                                 step === 'setup' ? `Setup ${selectedProvider?.name}` :
                                 '✅ All Set!'}
                            </h2>
                            <button
                                onClick={onClose}
                                className="text-white/40 hover:text-white text-xl leading-none"
                            >
                                ×
                            </button>
                        </div>
                        {step === 'select' && (
                            <p className="text-white/50 text-sm text-center mt-2">
                                Select a cloud AI provider to power your companion
                            </p>
                        )}
                    </div>

                    {/* Content */}
                    <div className="p-4 overflow-y-auto max-h-[60vh]">
                        {/* Step 1: Provider selection */}
                        {step === 'select' && (
                            <div className="space-y-3">
                                {CLOUD_PROVIDERS.map((provider) => (
                                    <motion.button
                                        key={provider.id}
                                        className="w-full p-4 rounded-xl border border-white/10 hover:border-white/25 bg-white/5 hover:bg-white/10 transition-all text-left flex items-start gap-3"
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleProviderSelect(provider)}
                                    >
                                        <span className="text-2xl mt-0.5">{provider.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-white">{provider.name}</span>
                                                {provider.free && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium">
                                                        FREE
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-white/50 text-sm mt-0.5">{provider.description}</p>
                                            <p className="text-white/30 text-xs mt-1">{provider.freeLimit}</p>
                                        </div>
                                        <span className="text-white/20 text-xl">›</span>
                                    </motion.button>
                                ))}
                            </div>
                        )}

                        {/* Step 2: API key setup */}
                        {step === 'setup' && selectedProvider && (
                            <div className="space-y-4">
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-xl">{selectedProvider.icon}</span>
                                        <span className="font-medium text-white">{selectedProvider.name}</span>
                                    </div>

                                    <ol className="space-y-2 text-sm text-white/70">
                                        <li className="flex gap-2">
                                            <span className="text-white/40 font-mono">1.</span>
                                            <span>
                                                Visit{' '}
                                                <a
                                                    href={selectedProvider.setupUrl}
                                                    target="_blank"
                                                    rel="noopener"
                                                    className="text-blue-400 underline"
                                                >
                                                    {selectedProvider.name} API Keys
                                                </a>
                                            </span>
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="text-white/40 font-mono">2.</span>
                                            <span>Create a new API key</span>
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="text-white/40 font-mono">3.</span>
                                            <span>Paste it below</span>
                                        </li>
                                    </ol>
                                </div>

                                <div>
                                    <label className="text-white/60 text-sm block mb-1.5">API Key</label>
                                    <input
                                        type="password"
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        placeholder={`Enter your ${selectedProvider.name} API key...`}
                                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/15 text-white placeholder:text-white/25 focus:border-blue-500/50 focus:outline-none transition-colors text-sm"
                                        autoFocus
                                    />
                                </div>

                                {error && (
                                    <p className="text-red-400 text-sm px-1">{error}</p>
                                )}

                                <motion.button
                                    className="w-full py-3 rounded-xl font-medium text-white transition-all disabled:opacity-50"
                                    style={{ background: selectedProvider.color }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleSaveKey}
                                    disabled={saving || !apiKey.trim()}
                                >
                                    {saving ? 'Saving...' : `Activate ${selectedProvider.name}`}
                                </motion.button>

                                <p className="text-white/30 text-xs text-center">
                                    Your key is stored locally on your device and never shared.
                                </p>
                            </div>
                        )}

                        {/* Step 3: Success */}
                        {step === 'done' && (
                            <div className="text-center py-8">
                                <motion.div
                                    className="text-5xl mb-4"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', damping: 10 }}
                                >
                                    🎉
                                </motion.div>
                                <h3 className="text-xl font-semibold text-white mb-2">Ready to Chat!</h3>
                                <p className="text-white/60 text-sm">
                                    {selectedProvider?.name} is now your AI provider.
                                    <br />Your companion is ready to talk!
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default CloudModelPicker;
