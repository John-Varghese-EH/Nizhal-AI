import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    User, Cpu, Video, Sliders, Check, AlertCircle, 
    Mic, Loader2, Key, HelpCircle, Laptop, Moon,
    Sparkles, Shield, Heart, Volume2, Keyboard, Monitor, Eye, Play,
    Terminal, ArrowRight, Database, Lock, Settings, Activity
} from 'lucide-react';
import { useOnboardingStore } from './onboardingStore';
import PermissionService from '../../../services/PermissionService';

const OnboardingOverlay = ({ onComplete }) => {
    const { 
        currentStep, data, error, isValidating, 
        setStep, updateData, setError, setValidating, completeOnboarding 
    } = useOnboardingStore();

    // Custom Interactive Feature Highlight state
    const [selectedFeature, setSelectedFeature] = useState(0);

    // Permission local states
    const [hasCameraPerm, setHasCameraPerm] = useState(false);
    const [hasMicPerm, setHasMicPerm] = useState(false);
    const [cameraTesting, setCameraTesting] = useState(false);
    const [micTesting, setMicTesting] = useState(false);

    // Ollama check local state
    const [ollamaStatus, setOllamaStatus] = useState('checking'); // 'checking' | 'active' | 'inactive'

    useEffect(() => {
        if (data.provider === 'ollama') {
            checkOllamaAvailability();
        }
    }, [data.provider]);

    const checkOllamaAvailability = async () => {
        setOllamaStatus('checking');
        try {
            const available = await window.nizhal?.ai?.checkLocalAI();
            setOllamaStatus(available ? 'active' : 'inactive');
        } catch {
            setOllamaStatus('inactive');
        }
    };

    const handleCameraCheck = async () => {
        setCameraTesting(true);
        setError(null);
        try {
            const result = await PermissionService.request('camera');
            if (result === 'granted') {
                setHasCameraPerm(true);
            } else {
                setError('Camera permission denied or camera device is not connected.');
            }
        } catch (err) {
            console.error('Camera permission request failed:', err);
            setError('Camera permission denied or camera device is not connected.');
        } finally {
            setCameraTesting(false);
        }
    };

    const handleMicCheck = async () => {
        setMicTesting(true);
        setError(null);
        try {
            const result = await PermissionService.request('microphone');
            if (result === 'granted') {
                setHasMicPerm(true);
            } else {
                setError('Microphone permission denied or microphone device is not connected.');
            }
        } catch (err) {
            console.error('Microphone permission request failed:', err);
            setError('Microphone permission denied or microphone device is not connected.');
        } finally {
            setMicTesting(false);
        }
    };

    const handleStep1Submit = () => {
        setError(null);
        setStep(2); // Move to Identity & Avatar
    };

    const handleStep2Submit = () => {
        if (!data.name.trim()) {
            setError('Please enter your name.');
            return;
        }
        setError(null);
        setStep(3); // Move to AI Brain Engine
    };

    const handleStep3Submit = async () => {
        if (data.provider !== 'ollama' && !data.apiKey.trim()) {
            setError('Please enter a valid API Secret Key to continue.');
            return;
        }
        
        setError(null);
        setValidating(true);

        try {
            if (data.provider !== 'ollama') {
                if (window.nizhal?.ai?.setProvider) {
                    await window.nizhal.ai.setProvider(data.provider, { apiKey: data.apiKey.trim() });
                }
            } else {
                const available = await window.nizhal?.ai?.checkLocalAI();
                if (!available) {
                    setError('Ollama does not appear to be running. Please start the Ollama service on port 11434.');
                    setValidating(false);
                    return;
                }
            }
            setStep(4); // Move to Permissions
        } catch (err) {
            setError(`Validation failed: ${err.message || err}`);
        } finally {
            setValidating(false);
        }
    };

    const handleStep4Submit = () => {
        setError(null);
        setStep(5); // Move to Final Tuning
    };

    const handleFinish = async () => {
        setError(null);
        await completeOnboarding(() => {
            onComplete();
        });
    };

    // Premium Steps definition
    const steps = [
        { num: 1, label: 'Overview', icon: Sparkles },
        { num: 2, label: 'Persona', icon: User },
        { num: 3, label: 'Engine', icon: Cpu },
        { num: 4, label: 'Devices', icon: Video },
        { num: 5, label: 'Summon', icon: Sliders },
    ];

    // High fidelity features list
    const features = [
        {
            icon: Eye,
            title: 'Rigged 3D Avatars',
            tagline: 'High-Fidelity Interaction',
            desc: 'A collection of interactive, fully rigged 3D models utilizing spring bone physics, eye gaze dynamics, and natural emotional blends.',
            previewTitle: 'D-3D System Diagnostics',
            previewLines: [
                'Initializing WebGL 2.0 Renderer...',
                'Loading model skeletal hierarchy... OK',
                'Registering blend shapes (52 ARKit keys)...',
                'Binding mouse pointer event hooks... Connected'
            ]
        },
        {
            icon: Volume2,
            title: 'Live Voice Stream',
            tagline: 'Zero-Latency Dialogues',
            desc: 'Real-time conversational streaming powered by Silero VAD, Whisper local transcription, and low-latency voice-to-voice synthesizers.',
            previewTitle: 'Audio Pipeline Status',
            previewLines: [
                'VAD threshold set to 35dB...',
                'Listening for user audio frame buffers...',
                'Live speech synthesis ready (16kHz PCM)...',
                'Lip-sync viseme generator loaded (80ms delay)'
            ]
        },
        {
            icon: Database,
            title: 'Episodic Memory Graph',
            tagline: 'Private Context Consolidation',
            desc: 'Local context vector storage that remembers key personal details, daily routines, and conversational history securely on your drive.',
            previewTitle: 'Secure Chromadb Console',
            previewLines: [
                'Vector collection initialized successfully...',
                'Scanning episodic database fragments...',
                'Running memory consolidation job (0.01s)...',
                'PII protection filter enabled (Argon2id)'
            ]
        },
        {
            icon: Monitor,
            title: 'Desktop Automation',
            tagline: 'Autonomous System Agents',
            desc: 'Runs background terminal instructions, controls system sound and brightness, handles calendar tools, and mirrors Android mobile devices.',
            previewTitle: 'System Agent Diagnostics',
            previewLines: [
                'Tauri native shell controller... Active',
                'ADB connection scanner... Connected (USB-0)',
                'Registering keyboard summoning hotkeys...',
                'Audit logging security sandbox: TIER-2 ACTIVE'
            ]
        }
    ];

    const currentFeatureData = useMemo(() => features[selectedFeature], [selectedFeature]);

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#020716] p-4 overflow-y-auto custom-scrollbar select-none">
            {/* Premium Radial Mesh & Mesh Background */}
            <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.012)_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
            <div className="absolute top-[-15%] left-[-15%] w-[60%] h-[60%] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.06)_0%,transparent_75%)] pointer-events-none" />
            <div className="absolute bottom-[-15%] right-[-15%] w-[60%] h-[60%] bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.06)_0%,transparent_75%)] pointer-events-none" />

            <motion.div 
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="w-full max-w-[960px] min-h-[580px] rounded-[32px] overflow-hidden bg-[#0A0F24]/75 border border-white/[0.08] shadow-[0_32px_80px_rgba(0,0,0,0.85),inset_0_0_30px_rgba(255,255,255,0.02)] flex flex-col md:flex-row relative z-10"
            >
                {/* Visual Dashboard Sidebar (Left 42%) */}
                <div className="w-full md:w-[42%] bg-gradient-to-b from-[#0F1635]/65 to-[#070B1F]/90 p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/[0.06] relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(236,72,153,0.04)_0%,transparent_60%)] pointer-events-none" />
                    
                    {/* Brand */}
                    <div className="relative z-10">
                        <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-sm font-extrabold tracking-[0.2em] bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent uppercase">Nizhal AI</span>
                        </div>
                        <h2 className="text-3xl font-black tracking-tight text-white leading-tight mt-6">
                            Autonomous <br/>
                            <span className="bg-gradient-to-r from-pink-400 via-purple-300 to-cyan-300 bg-clip-text text-transparent">3D Companion</span>
                        </h2>
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                            A local sovereign system that runs on your desk, remembers your life, and automates daily developer operations natively.
                        </p>
                    </div>

                    {/* Step-specific custom left visualizations */}
                    <div className="relative z-10 my-8 flex-1 flex flex-col justify-center">
                        <AnimatePresence mode="wait">
                            {currentStep === 1 && (
                                <motion.div 
                                    key="vis-step1"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="space-y-4"
                                >
                                    <div className="p-4 rounded-2xl bg-black/45 border border-white/[0.05] font-mono text-[10px] text-cyan-400/90 shadow-inner">
                                        <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-white/[0.08]">
                                            <Terminal className="w-3.5 h-3.5 text-pink-400" />
                                            <span className="text-white/60 font-bold">{currentFeatureData.previewTitle}</span>
                                        </div>
                                        <div className="space-y-1 text-slate-300">
                                            {currentFeatureData.previewLines.map((line, idx) => (
                                                <div key={idx} className="flex gap-2">
                                                    <span className="text-white/30 font-bold select-none">{`0${idx + 1}`}</span>
                                                    <span className="truncate">{line}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex justify-center gap-1">
                                        {features.map((_, idx) => (
                                            <div 
                                                key={idx} 
                                                className={`h-1 rounded-full transition-all duration-350 ${
                                                    selectedFeature === idx ? 'w-6 bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.6)]' : 'w-1.5 bg-white/10'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {currentStep === 2 && (
                                <motion.div 
                                    key="vis-step2"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="p-5 rounded-2xl bg-black/40 border border-white/[0.06] flex items-center justify-center h-48 relative"
                                >
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.06)_0%,transparent_60%)] pointer-events-none" />
                                    <div className="text-center space-y-3">
                                        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-400/40 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(99,102,241,0.15)]">
                                            {data.characterModel === 'aldina' && '🌸'}
                                            {data.characterModel === 'miku' && '🎤'}
                                            {data.characterModel === 'zome' && '👧'}
                                            {data.characterModel === 'riku' && '👓'}
                                            {data.characterModel === 'jarvis' && '🔮'}
                                        </div>
                                        <div>
                                            <span className="text-xs font-bold text-white uppercase tracking-wider block">
                                                {data.name || 'Your Companion'}
                                            </span>
                                            <span className="text-[10px] text-pink-400 mt-1 block">
                                                {data.relationship.toUpperCase()} MODE active
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {currentStep === 3 && (
                                <motion.div 
                                    key="vis-step3"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="p-5 rounded-2xl bg-black/40 border border-white/[0.06] font-mono text-[10px]"
                                >
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Processor Target</span>
                                        <span className="text-cyan-400 font-bold uppercase">{data.provider}</span>
                                    </div>
                                    <div className="space-y-1.5 text-slate-300">
                                        <div className="flex justify-between">
                                            <span>Secure Handshake</span>
                                            <span className="text-emerald-400 font-bold">✓ SSL Active</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Exclusion Layer</span>
                                            <span className="text-emerald-400 font-bold">✓ T-1 Sandbox</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Buffer Rate</span>
                                            <span className="text-slate-400">120 tokens/sec</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {currentStep === 4 && (
                                <motion.div 
                                    key="vis-step4"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="p-5 rounded-2xl bg-black/40 border border-white/[0.06] space-y-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <Activity className="w-5 h-5 text-pink-400 animate-pulse" />
                                        <div>
                                            <span className="text-xs font-bold text-white block">Diagnostic Core</span>
                                            <span className="text-[9px] text-slate-400 mt-0.5 block">Waiting for hardware activation</span>
                                        </div>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative">
                                        <motion.div 
                                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-pink-500 to-indigo-500" 
                                            animate={{ width: hasMicPerm && hasCameraPerm ? '100%' : hasMicPerm || hasCameraPerm ? '50%' : '15%' }}
                                            transition={{ duration: 0.4 }}
                                        />
                                    </div>
                                </motion.div>
                            )}

                            {currentStep === 5 && (
                                <motion.div 
                                    key="vis-step5"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="p-5 rounded-2xl bg-black/40 border border-white/[0.06] text-center space-y-3"
                                >
                                    <div className="w-12 h-12 mx-auto rounded-xl bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-center text-indigo-400 font-bold font-mono">
                                        {data.globalHotkey === 'Ctrl+Shift+N' ? '⌃⇧N' : data.globalHotkey === 'Alt+Space' ? '⌥␣' : '⌃␣'}
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Ready to Summon</span>
                                        <span className="text-[8px] text-pink-400/85 mt-1 block">Global keyboard hooks registered successfully</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Left footer */}
                    <div className="relative z-10 flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-widest border-t border-white/[0.04] pt-4">
                        <Lock className="w-3.5 h-3.5 text-indigo-400/60" />
                        <span>100% Local Sovereign Processing</span>
                    </div>
                </div>

                {/* Wizard Controls Panel (Right 58%) */}
                <div className="w-full md:w-[58%] p-8 flex flex-col justify-between bg-[#0A0E22]/35 relative">
                    
                    {/* Top step progress tracker bar */}
                    <div className="flex justify-between items-center mb-8 relative z-10">
                        {steps.map((s, idx) => {
                            const Icon = s.icon;
                            const isCompleted = currentStep > s.num;
                            const isActive = currentStep === s.num;
                            return (
                                <div key={s.num} className="flex-1 flex items-center">
                                    <button 
                                        type="button"
                                        onClick={() => isCompleted && setStep(s.num)}
                                        disabled={!isCompleted && !isActive}
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center border font-bold text-xs transition-all ${
                                            isCompleted ? 'bg-indigo-600 border-indigo-500 text-white cursor-pointer' :
                                            isActive ? 'bg-white/10 border-pink-400 text-pink-300 shadow-[0_0_12px_rgba(244,114,182,0.2)]' :
                                            'bg-white/5 border-white/5 text-white/30 cursor-not-allowed'
                                        }`}
                                    >
                                        {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
                                    </button>
                                    {idx < steps.length - 1 && (
                                        <div className="flex-1 h-[1.5px] mx-2 bg-white/5">
                                            <div 
                                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                                                style={{ width: isCompleted ? '100%' : '0%' }}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Step Body */}
                    <div className="relative z-10 flex-1 flex flex-col justify-center">
                        <AnimatePresence mode="wait">
                            {/* STEP 1: INTERACTIVE CAPABILITIES */}
                            {currentStep === 1 && (
                                <motion.div 
                                    key="cap-step1"
                                    variants={{ enter: { opacity: 0, x: 20 }, center: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 } }}
                                    initial="enter" animate="center" exit="exit"
                                    transition={{ duration: 0.35 }}
                                    className="space-y-6"
                                >
                                    <div>
                                        <span className="text-[10px] text-pink-400 font-extrabold uppercase tracking-widest block">Product Capabilities</span>
                                        <h3 className="text-2xl font-black text-white mt-1">Core Architecture</h3>
                                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                            Learn about the major core operations and diagnostic capabilities that make Nizhal AI fully autonomous.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        {features.map((feat, idx) => {
                                            const FIcon = feat.icon;
                                            const active = selectedFeature === idx;
                                            return (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => setSelectedFeature(idx)}
                                                    className={`w-full p-3.5 rounded-2xl border text-left flex items-start gap-3.5 transition-all ${
                                                        active 
                                                        ? 'bg-indigo-600/10 border-indigo-500 shadow-md ring-1 ring-indigo-500/25' 
                                                        : 'bg-white/5 border-white/5 hover:bg-white/10'
                                                    }`}
                                                >
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                                        active ? 'bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.4)]' : 'bg-white/5 text-slate-400'
                                                    }`}>
                                                        <FIcon className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-bold text-white">{feat.title}</span>
                                                            {active && <span className="text-[8px] bg-pink-500 text-white font-black px-1.5 py-0.5 rounded uppercase tracking-wider">Active</span>}
                                                        </div>
                                                        <span className="text-[10px] text-slate-400 block mt-0.5 leading-relaxed">{feat.tagline}</span>
                                                        {active && (
                                                            <motion.p 
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                className="text-[10px] text-slate-400/85 mt-2 leading-relaxed border-t border-white/[0.04] pt-2"
                                                            >
                                                                {feat.desc}
                                                            </motion.p>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className="pt-4 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={handleStep1Submit}
                                            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 text-white text-sm font-semibold transition-all hover:scale-[1.02] flex items-center gap-2 shadow-[0_4px_20px_rgba(236,72,153,0.25)]"
                                        >
                                            Let's Configure
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 2: IDENTITY & AVATAR PICKER */}
                            {currentStep === 2 && (
                                <motion.div 
                                    key="cap-step2"
                                    variants={{ enter: { opacity: 0, x: 20 }, center: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 } }}
                                    initial="enter" animate="center" exit="exit"
                                    transition={{ duration: 0.35 }}
                                    className="space-y-5"
                                >
                                    <div>
                                        <span className="text-[10px] text-pink-400 font-extrabold uppercase tracking-widest block">Identity Tuning</span>
                                        <h3 className="text-2xl font-black text-white mt-1">Companion Setup</h3>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">What should we call you?</label>
                                            <input 
                                                type="text" 
                                                placeholder="Enter name..."
                                                value={data.name}
                                                onChange={(e) => updateData({ name: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-indigo-500/50 focus:bg-white/10 outline-none transition-all"
                                                onKeyDown={(e) => e.key === 'Enter' && data.name.trim() && handleStep2Submit()}
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Companion Vibe</label>
                                            <select
                                                value={data.relationship}
                                                onChange={(e) => updateData({ relationship: e.target.value })}
                                                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500/50 transition-all"
                                            >
                                                <option value="friend">Friends (Fun & Casual)</option>
                                                <option value="assistant">Assistant (Productive & Precise)</option>
                                                <option value="partner">Partner (Deep & Caring)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Personality Vibe Slider</label>
                                            <span className="text-[9px] text-pink-400 font-extrabold uppercase">
                                                {data.vibe < 35 ? '🧘 Calm & Analytical' : data.vibe < 70 ? '✨ Warm & Empathetic' : '😈 Chaotic & Playful'}
                                            </span>
                                        </div>
                                        <input 
                                            type="range" 
                                            min="0" 
                                            max="100"
                                            value={data.vibe}
                                            onChange={(e) => updateData({ vibe: parseInt(e.target.value) })}
                                            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-pink-500"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Choose Initial 3D Character Model</label>
                                        <div className="grid grid-cols-5 gap-2">
                                            {[
                                                { id: 'aldina', name: 'Aldina', icon: '🌸', desc: 'VRM Female' },
                                                { id: 'miku', name: 'Miku', icon: '🎤', desc: 'Idol VRM' },
                                                { id: 'zome', name: 'Zome', icon: '👧', desc: 'Cute VRM' },
                                                { id: 'riku', name: 'Riku', icon: '👓', desc: 'Male VRM' },
                                                { id: 'jarvis', name: 'Jarvis', icon: '🔮', desc: 'Hologram' }
                                            ].map((char) => (
                                                <button
                                                    key={char.id}
                                                    type="button"
                                                    onClick={() => updateData({ characterModel: char.id })}
                                                    className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                                                        data.characterModel === char.id 
                                                        ? 'bg-gradient-to-b from-indigo-500/20 to-purple-500/20 border-indigo-500 ring-1 ring-indigo-500' 
                                                        : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10'
                                                    }`}
                                                >
                                                    <span className="text-lg mb-1">{char.icon}</span>
                                                    <span className="text-[9px] font-bold truncate w-full text-white">{char.name}</span>
                                                    <span className="text-[7px] text-white/40 truncate w-full mt-0.5">{char.desc}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-4 flex justify-between">
                                        <button
                                            type="button"
                                            onClick={() => setStep(1)}
                                            className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 text-sm font-semibold transition-all"
                                        >
                                            Back
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleStep2Submit}
                                            disabled={!data.name.trim()}
                                            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 text-white text-sm font-semibold transition-all hover:scale-[1.02] disabled:opacity-40"
                                        >
                                            Continue
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 3: AI BRAIN ENGINE */}
                            {currentStep === 3 && (
                                <motion.div 
                                    key="cap-step3"
                                    variants={{ enter: { opacity: 0, x: 20 }, center: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 } }}
                                    initial="enter" animate="center" exit="exit"
                                    transition={{ duration: 0.35 }}
                                    className="space-y-5"
                                >
                                    <div>
                                        <span className="text-[10px] text-pink-400 font-extrabold uppercase tracking-widest block">LLM BRAIN SETUP</span>
                                        <h3 className="text-2xl font-black text-white mt-1">Intelligence Source</h3>
                                    </div>

                                    <div className="grid grid-cols-4 gap-2">
                                        {[
                                            { id: 'gemini', label: 'Gemini', desc: 'Google Live' },
                                            { id: 'openai', label: 'OpenAI', desc: 'GPT-4o API' },
                                            { id: 'groq', label: 'Groq', desc: 'Fast Inference' },
                                            { id: 'ollama', label: 'Ollama', desc: 'Local Node' }
                                        ].map(p => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => {
                                                    updateData({ provider: p.id, apiKey: '' });
                                                    setError(null);
                                                }}
                                                className={`p-2.5 rounded-xl border text-center transition-all ${
                                                    data.provider === p.id 
                                                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg ring-1 ring-indigo-500/20' 
                                                    : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10'
                                                }`}
                                            >
                                                <div className="text-xs font-bold">{p.label}</div>
                                                <div className="text-[8px] text-white/40 mt-0.5 truncate">{p.desc}</div>
                                            </button>
                                        ))}
                                    </div>

                                    {data.provider === 'ollama' ? (
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-semibold text-white/70">Ollama Port Scanner</span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                    ollamaStatus === 'active' ? 'bg-green-500/20 text-green-400' :
                                                    ollamaStatus === 'inactive' ? 'bg-rose-500/20 text-rose-400' :
                                                    'bg-white/10 text-white/50'
                                                }`}>
                                                    {ollamaStatus === 'active' && '✓ Active'}
                                                    {ollamaStatus === 'inactive' && '✗ Connection Failed'}
                                                    {ollamaStatus === 'checking' && 'Pinging port 11434...'}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 leading-relaxed">
                                                To route through your local server, please launch the Ollama service on your system.
                                            </p>
                                            <div className="flex justify-end">
                                                <button 
                                                    type="button"
                                                    onClick={checkOllamaAvailability}
                                                    className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg text-xs transition-all"
                                                >
                                                    Pinging server...
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">API Credentials Key</label>
                                                <a 
                                                    href={
                                                        data.provider === 'gemini' ? 'https://aistudio.google.com/app/apikey' : 
                                                        data.provider === 'groq' ? 'https://console.groq.com/keys' :
                                                        'https://platform.openai.com/api-keys'
                                                    } 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="text-[9px] text-indigo-400 hover:underline font-bold"
                                                >
                                                    Claim key →
                                                </a>
                                            </div>
                                            <div className="relative">
                                                <input 
                                                    type="password" 
                                                    placeholder={`Paste your ${data.provider.toUpperCase()} API key here...`}
                                                    value={data.apiKey}
                                                    onChange={(e) => updateData({ apiKey: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:border-indigo-500/50 focus:bg-white/10 outline-none transition-all font-mono"
                                                />
                                                <Key className="absolute left-3.5 top-3 w-4 h-4 text-white/30" />
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-4 flex justify-between">
                                        <button
                                            type="button"
                                            onClick={() => setStep(2)}
                                            className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 text-sm font-semibold transition-all"
                                        >
                                            Back
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleStep3Submit}
                                            disabled={isValidating || (data.provider !== 'ollama' && !data.apiKey.trim())}
                                            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 text-white text-sm font-semibold transition-all flex items-center gap-2"
                                        >
                                            {isValidating && <Loader2 className="w-4 h-4 animate-spin" />}
                                            Next Step
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 4: PERMISSIONS */}
                            {currentStep === 4 && (
                                <motion.div 
                                    key="cap-step4"
                                    variants={{ enter: { opacity: 0, x: 20 }, center: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 } }}
                                    initial="enter" animate="center" exit="exit"
                                    transition={{ duration: 0.35 }}
                                    className="space-y-5"
                                >
                                    <div>
                                        <span className="text-[10px] text-pink-400 font-extrabold uppercase tracking-widest block">Hardware Channels</span>
                                        <h3 className="text-2xl font-black text-white mt-1">Device Access Diagnostics</h3>
                                    </div>

                                    <div className="space-y-3">
                                        {/* Microphone Block */}
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${hasMicPerm ? 'bg-green-500/20 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.15)]' : 'bg-white/5 text-slate-400'}`}>
                                                    <Mic className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-white">Microphone Channel</div>
                                                    <div className="text-[10px] text-slate-400 mt-0.5">Required for natural Voice Chat dialogue</div>
                                                </div>
                                            </div>
                                            <div>
                                                {hasMicPerm ? (
                                                    <span className="text-xs text-green-400 font-bold flex items-center gap-1">
                                                        <Check className="w-4 h-4" /> Activated
                                                    </span>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={handleMicCheck}
                                                        disabled={micTesting}
                                                        className="px-4 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-lg text-xs font-semibold transition-all"
                                                    >
                                                        {micTesting ? 'Requesting...' : 'Request'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Camera Block */}
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${hasCameraPerm ? 'bg-green-500/20 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.15)]' : 'bg-white/5 text-slate-400'}`}>
                                                    <Video className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-white">Camera Capture Feed</div>
                                                    <div className="text-[10px] text-slate-400 mt-0.5">Used locally for head & eye tracking metrics</div>
                                                </div>
                                            </div>
                                            <div>
                                                {hasCameraPerm ? (
                                                    <span className="text-xs text-green-400 font-bold flex items-center gap-1">
                                                        <Check className="w-4 h-4" /> Activated
                                                    </span>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={handleCameraCheck}
                                                        disabled={cameraTesting}
                                                        className="px-4 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-lg text-xs font-semibold transition-all"
                                                    >
                                                        {cameraTesting ? 'Requesting...' : 'Request'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 flex items-start gap-3">
                                        <HelpCircle className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                                        <p className="text-[10px] text-slate-400 leading-relaxed">
                                            You can safely bypass hardware scans if you lack mic/camera hardware. Interface configurations remain fully adjustable later on.
                                        </p>
                                    </div>

                                    <div className="pt-4 flex justify-between">
                                        <button
                                            type="button"
                                            onClick={() => setStep(3)}
                                            className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 text-sm font-semibold transition-all"
                                        >
                                            Back
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleStep4Submit}
                                            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 text-white text-sm font-semibold transition-all hover:scale-[1.02]"
                                        >
                                            Continue
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 5: PREFERENCES & SUMMON TUNING */}
                            {currentStep === 5 && (
                                <motion.div 
                                    key="cap-step5"
                                    variants={{ enter: { opacity: 0, x: 20 }, center: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 } }}
                                    initial="enter" animate="center" exit="exit"
                                    transition={{ duration: 0.35 }}
                                    className="space-y-5"
                                >
                                    <div>
                                        <span className="text-[10px] text-pink-400 font-extrabold uppercase tracking-widest block">Tuning & Launch</span>
                                        <h3 className="text-2xl font-black text-white mt-1">Workspace & Summons</h3>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Startup Preference */}
                                        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <Laptop className="w-4 h-4 text-indigo-400" />
                                                <div>
                                                    <div className="text-xs font-bold text-white">Autostart</div>
                                                    <div className="text-[9px] text-slate-400 mt-0.5">Launch on system login</div>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => updateData({ startWithWindows: !data.startWithWindows })}
                                                className={`w-10 h-5.5 rounded-full transition-colors relative flex items-center ${
                                                    data.startWithWindows ? 'bg-indigo-600' : 'bg-white/10'
                                                }`}
                                            >
                                                <motion.div 
                                                    className="w-3.5 h-3.5 bg-white rounded-full absolute shadow-sm"
                                                    animate={{ left: data.startWithWindows ? '22px' : '3px' }}
                                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                />
                                            </button>
                                        </div>

                                        {/* Global Hotkey */}
                                        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <Keyboard className="w-4 h-4 text-pink-400" />
                                                <div>
                                                    <div className="text-xs font-bold text-white">Summon Hotkey</div>
                                                    <div className="text-[9px] text-slate-400 mt-0.5">Summon interface instantly</div>
                                                </div>
                                            </div>
                                            <select
                                                value={data.globalHotkey}
                                                onChange={(e) => updateData({ globalHotkey: e.target.value })}
                                                className="bg-[#020716] border border-white/15 rounded-lg px-2 py-1 text-[10px] text-indigo-300 font-bold outline-none cursor-pointer"
                                            >
                                                <option value="Ctrl+Shift+N">Ctrl+Shift+N</option>
                                                <option value="Alt+Space">Alt+Space</option>
                                                <option value="Ctrl+Space">Ctrl+Space</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Select Workspace Theme Vibe</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { id: 'purple', label: 'Astral Neon', bg: 'from-violet-950/70 to-slate-900 border-violet-500/30' },
                                                { id: 'dark', label: 'Cyber Shell', bg: 'from-slate-950 to-neutral-900 border-indigo-400/20' },
                                                { id: 'light', label: 'Ghost Glass', bg: 'from-slate-800 to-indigo-950 border-purple-500/20' }
                                            ].map(t => (
                                                <button
                                                    key={t.id}
                                                    type="button"
                                                    onClick={() => updateData({ theme: t.id })}
                                                    className={`p-3 rounded-xl border text-left bg-gradient-to-br transition-all relative ${t.bg} ${
                                                        data.theme === t.id 
                                                        ? 'ring-2 ring-indigo-500 border-transparent scale-[1.02]' 
                                                        : 'opacity-70 hover:opacity-100'
                                                    }`}
                                                >
                                                    <div className="text-xs font-bold text-white">{t.label}</div>
                                                    <Moon className="w-3.5 h-3.5 text-white/40 absolute bottom-3 right-3" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-4 flex justify-between">
                                        <button
                                            type="button"
                                            onClick={() => setStep(4)}
                                            className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 text-sm font-semibold transition-all"
                                        >
                                            Back
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleFinish}
                                            disabled={isValidating}
                                            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 via-indigo-600 to-purple-600 hover:from-pink-400 hover:via-indigo-500 hover:to-purple-500 disabled:opacity-40 text-white text-sm font-semibold transition-all hover:scale-[1.02] flex items-center gap-2 shadow-lg shadow-indigo-600/30"
                                        >
                                            {isValidating && <Loader2 className="w-4 h-4 animate-spin" />}
                                            Launch Companion
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Step body bottom error display */}
                    <AnimatePresence>
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute bottom-4 left-8 right-8 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5 z-10"
                            >
                                <AlertCircle className="w-4.5 h-4.5 text-rose-400 flex-shrink-0 mt-0.5" />
                                <p className="text-[10px] text-rose-300 leading-relaxed">{error}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default OnboardingOverlay;
