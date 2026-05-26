import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Download, CheckCircle2, XCircle, Loader2, Zap, Shield, Brain, Sparkles } from 'lucide-react';

/**
 * FirstRunBootloader — Premium zero-config setup overlay.
 * Runs on first launch: detects GPU, downloads local AI model, verifies keyring.
 */
const FirstRunBootloader = ({ onComplete }) => {
    const [stage, setStage] = useState('init'); // init | gpu | download | loading | verify | done | error
    const [gpuInfo, setGpuInfo] = useState(null);
    const [downloadProgress, setDownloadProgress] = useState({ percent: 0, stage: '', bytes_downloaded: 0, bytes_total: 0 });
    const [keyringOk, setKeyringOk] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [modelStatus, setModelStatus] = useState(null);

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const runSetup = useCallback(async () => {
        try {
            // Stage 1: Detect GPU
            setStage('gpu');
            await new Promise(r => setTimeout(r, 800));

            let gpu = { cuda: false, metal: false, cpu_cores: 4, device: 'cpu' };
            try {
                gpu = await window.nizhal?.invoke('detect_gpu');
            } catch (e) {
                console.warn('[Bootloader] GPU detection failed:', e);
            }
            setGpuInfo(gpu);
            await new Promise(r => setTimeout(r, 1200));

            // Stage 2: Check keyring
            setStage('verify');
            try {
                const status = await window.nizhal?.invoke('keyring_status');
                setKeyringOk(status?.available ?? false);

                // Migrate existing plaintext keys if keyring is available
                if (status?.available) {
                    await window.nizhal?.invoke('keyring_migrate_from_store');
                }
            } catch (e) {
                console.warn('[Bootloader] Keyring check failed:', e);
                setKeyringOk(false);
            }
            await new Promise(r => setTimeout(r, 800));

            // Stage 3: Check if model already downloaded
            let status = null;
            try {
                status = await window.nizhal?.invoke('local_model_status');
                setModelStatus(status);
            } catch (e) {
                console.warn('[Bootloader] Model status check failed:', e);
            }

            if (!status?.ready) {
                // Stage 4: Download model
                setStage('download');

                // Listen for progress events
                const unlisten = await window.nizhal?.listen?.('model-download-progress', (event) => {
                    setDownloadProgress(event.payload);
                });

                try {
                    await window.nizhal?.invoke('local_model_download');
                } catch (e) {
                    console.error('[Bootloader] Model download failed:', e);
                    // Non-fatal: app works with cloud providers
                }

                if (unlisten) unlisten();
            }

            // Stage 5: Load model into memory
            setStage('loading');
            try {
                await window.nizhal?.invoke('local_model_load');
            } catch (e) {
                console.warn('[Bootloader] Model load failed (cloud-only mode):', e);
            }

            // Done
            setStage('done');
            await new Promise(r => setTimeout(r, 2000));

            // Mark first run as complete
            try {
                await window.nizhal?.invoke('set_setting', {
                    category: 'app',
                    key: 'firstRunComplete',
                    value: true,
                });
            } catch (e) { /* ignore */ }

            onComplete?.();
        } catch (err) {
            setErrorMsg(err?.message || String(err));
            setStage('error');
        }
    }, [onComplete]);

    useEffect(() => {
        runSetup();
    }, [runSetup]);

    const stageConfig = {
        init: { icon: Sparkles, label: 'Initializing...', color: 'text-indigo-400' },
        gpu: { icon: Cpu, label: 'Detecting Hardware...', color: 'text-cyan-400' },
        verify: { icon: Shield, label: 'Verifying Security...', color: 'text-emerald-400' },
        download: { icon: Download, label: 'Downloading AI Core...', color: 'text-purple-400' },
        loading: { icon: Brain, label: 'Loading Neural Engine...', color: 'text-amber-400' },
        done: { icon: CheckCircle2, label: 'Ready!', color: 'text-emerald-400' },
        error: { icon: XCircle, label: 'Setup Issue', color: 'text-rose-400' },
    };

    const current = stageConfig[stage] || stageConfig.init;
    const StageIcon = current.icon;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[20000] flex items-center justify-center bg-[#04060E] select-none"
            >
                {/* Animated background orbs */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] -top-32 -left-32 animate-pulse" />
                    <div className="absolute w-[400px] h-[400px] bg-cyan-500/8 rounded-full blur-[100px] bottom-0 right-0 animate-pulse" style={{ animationDelay: '1s' }} />
                    <div className="absolute w-[300px] h-[300px] bg-purple-500/6 rounded-full blur-[80px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDelay: '2s' }} />
                </div>

                <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="relative w-full max-w-lg mx-4"
                >
                    {/* Logo */}
                    <div className="text-center mb-10">
                        <motion.div
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ repeat: Infinity, duration: 3 }}
                            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-600 to-cyan-500 mb-4 shadow-2xl shadow-indigo-500/30"
                        >
                            <Zap className="w-10 h-10 text-white" />
                        </motion.div>
                        <h1 className="text-2xl font-light text-white tracking-wider">
                            NIZHAL AI
                        </h1>
                        <p className="text-sm text-slate-500 mt-1 font-mono tracking-widest">
                            FIRST RUN SETUP
                        </p>
                    </div>

                    {/* Main card */}
                    <div className="rounded-3xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
                        {/* Current stage indicator */}
                        <div className="flex items-center gap-4 mb-8">
                            <div className={`w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center ${current.color}`}>
                                {stage === 'download' || stage === 'loading' ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <StageIcon className="w-6 h-6" />
                                )}
                            </div>
                            <div>
                                <p className={`text-lg font-medium ${current.color}`}>{current.label}</p>
                                <p className="text-xs text-slate-500 font-mono">
                                    {stage === 'gpu' && gpuInfo && `${gpuInfo.device.toUpperCase()} · ${gpuInfo.cpu_cores} cores`}
                                    {stage === 'verify' && (keyringOk ? 'OS Keychain: Active' : 'Checking credential vault...')}
                                    {stage === 'download' && `${formatBytes(downloadProgress.bytes_downloaded)} / ${formatBytes(downloadProgress.bytes_total)}`}
                                    {stage === 'loading' && 'Initializing neural weights...'}
                                    {stage === 'done' && 'All systems operational'}
                                    {stage === 'error' && errorMsg}
                                </p>
                            </div>
                        </div>

                        {/* Progress bar (download stage) */}
                        {stage === 'download' && (
                            <div className="mb-6">
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full"
                                        initial={{ width: '0%' }}
                                        animate={{ width: `${downloadProgress.percent}%` }}
                                        transition={{ duration: 0.3 }}
                                    />
                                </div>
                                <p className="text-right text-[10px] text-slate-500 mt-1 font-mono">
                                    {downloadProgress.percent.toFixed(1)}%
                                </p>
                            </div>
                        )}

                        {/* Stage checklist */}
                        <div className="space-y-3 border-t border-white/[0.04] pt-6">
                            {[
                                { id: 'gpu', label: 'Hardware Detection', done: stage !== 'init' && stage !== 'gpu' },
                                { id: 'verify', label: 'Security Vault', done: ['download', 'loading', 'done'].includes(stage) },
                                { id: 'download', label: 'AI Model Core', done: ['loading', 'done'].includes(stage) },
                                { id: 'loading', label: 'Neural Engine', done: stage === 'done' },
                            ].map(item => (
                                <div key={item.id} className="flex items-center gap-3 text-sm">
                                    {item.done ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                    ) : stage === item.id ? (
                                        <Loader2 className="w-4 h-4 text-cyan-400 animate-spin flex-shrink-0" />
                                    ) : (
                                        <div className="w-4 h-4 rounded-full border border-white/10 flex-shrink-0" />
                                    )}
                                    <span className={item.done ? 'text-slate-300' : stage === item.id ? 'text-white' : 'text-slate-600'}>
                                        {item.label}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Error retry */}
                        {stage === 'error' && (
                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={runSetup}
                                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors"
                                >
                                    Retry Setup
                                </button>
                                <button
                                    onClick={onComplete}
                                    className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-400 text-sm rounded-xl transition-colors"
                                >
                                    Skip (Cloud Only)
                                </button>
                            </div>
                        )}
                    </div>

                    <p className="text-center text-[10px] text-slate-600 mt-6 font-mono">
                        Setting up your private, offline-capable AI brain
                    </p>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default FirstRunBootloader;
