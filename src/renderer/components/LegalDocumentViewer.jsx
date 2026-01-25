import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, FileText, Shield, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { legalService } from '../../services/LegalService';

/**
 * LegalDocumentViewer - Display Terms and Privacy Policy
 */
const LegalDocumentViewer = ({ isOpen, onClose, initialDocument = 'terms' }) => {
    const [activeDoc, setActiveDoc] = useState(initialDocument);
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [docInfo, setDocInfo] = useState(null);

    useEffect(() => {
        if (isOpen) {
            loadDocument(activeDoc);
        }
    }, [isOpen, activeDoc]);

    const loadDocument = async (type) => {
        setLoading(true);
        try {
            const result = type === 'terms'
                ? await legalService.getTerms()
                : await legalService.getPrivacyPolicy();

            setContent(result.content);
            setDocInfo(result);
        } catch (error) {
            setContent('Failed to load document. Please check your internet connection.');
            setDocInfo({ fallback: true });
        }
        setLoading(false);
    };

    const handleRefresh = () => {
        legalService.clearCache();
        loadDocument(activeDoc);
    };

    const openInBrowser = () => {
        const urls = legalService.getDocumentUrls();
        const url = activeDoc === 'terms' ? urls.terms : urls.privacy;
        window.open(url, '_blank');
    };

    // Simple markdown to HTML conversion
    const renderMarkdown = (md) => {
        if (!md) return '';

        return md
            // Headers
            .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-cyan-400 mt-6 mb-2">$1</h3>')
            .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-white mt-8 mb-3 pb-2 border-b border-white/10">$1</h2>')
            .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-4">$1</h1>')
            // Bold
            .replace(/\*\*(.*)\*\*/gim, '<strong class="text-white">$1</strong>')
            // Links
            .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" class="text-cyan-400 hover:underline">$1</a>')
            // Lists
            .replace(/^\- (.*$)/gim, '<li class="ml-4 text-white/70">• $1</li>')
            // Tables (basic)
            .replace(/\|([^|]+)\|([^|]+)\|([^|]*)\|/gim, '<div class="flex gap-4 py-1 border-b border-white/5"><span class="flex-1 text-white/60">$1</span><span class="flex-1">$2</span><span class="flex-1">$3</span></div>')
            // Horizontal rules
            .replace(/^---$/gim, '<hr class="my-6 border-white/10" />')
            // Paragraphs
            .replace(/\n\n/gim, '</p><p class="text-white/70 my-3">')
            // Line breaks
            .replace(/\n/gim, '<br />');
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="w-full max-w-4xl max-h-[90vh] bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {/* Document Tabs */}
                            <div className="flex bg-white/5 rounded-xl p-1">
                                <button
                                    onClick={() => setActiveDoc('terms')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${activeDoc === 'terms'
                                            ? 'bg-cyan-500/20 text-cyan-400'
                                            : 'text-white/50 hover:text-white'
                                        }`}
                                >
                                    <FileText size={16} />
                                    Terms
                                </button>
                                <button
                                    onClick={() => setActiveDoc('privacy')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${activeDoc === 'privacy'
                                            ? 'bg-purple-500/20 text-purple-400'
                                            : 'text-white/50 hover:text-white'
                                        }`}
                                >
                                    <Shield size={16} />
                                    Privacy
                                </button>
                            </div>

                            {/* Status indicator */}
                            {docInfo && (
                                <div className="flex items-center gap-2 text-xs text-white/40">
                                    {docInfo.offline || docInfo.fallback ? (
                                        <WifiOff size={12} className="text-amber-400" />
                                    ) : (
                                        <Wifi size={12} className="text-green-400" />
                                    )}
                                    {docInfo.fromCache && !docInfo.fallback && 'Cached'}
                                    {docInfo.fallback && 'Offline'}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleRefresh}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                title="Refresh"
                            >
                                <RefreshCw size={16} className={`text-white/50 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                                onClick={openInBrowser}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                title="Open in browser"
                            >
                                <ExternalLink size={16} className="text-white/50" />
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X size={20} className="text-white/50" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-white/50">Loading document...</p>
                                </div>
                            </div>
                        ) : (
                            <div
                                className="prose prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
                            />
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-white/10 flex items-center justify-between">
                        <div className="text-xs text-white/30">
                            {docInfo?.lastUpdated && (
                                <>Last updated: {new Date(docInfo.lastUpdated).toLocaleDateString()}</>
                            )}
                        </div>
                        <a
                            href={legalService.getRepoUrl()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
                        >
                            View on GitHub <ExternalLink size={10} />
                        </a>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default LegalDocumentViewer;
