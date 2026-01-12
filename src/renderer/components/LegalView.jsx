import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, FileText, Shield, Scale, ExternalLink } from 'lucide-react';

/**
 * LegalView - Display Terms of Service and Privacy Policy
 */
const LegalView = ({ onBack }) => {
    const [activeDoc, setActiveDoc] = useState('privacy');

    const openExternal = (url) => {
        window.nizhal?.app?.openExternal?.(url);
    };

    const documents = {
        privacy: {
            title: 'Privacy Policy',
            icon: Shield,
            lastUpdated: 'January 2026',
            sections: [
                {
                    title: 'Privacy Mode',
                    content: `Nizhal AI includes a Privacy Mode toggle that allows you to control data processing:

**When Privacy Mode is ON (Local Only):**
• All AI processing uses local Ollama models
• No data is sent to cloud services
• Camera is disabled
• No voice data leaves your device
• Maximum privacy protection

**When Privacy Mode is OFF (Cloud AI):**
• AI requests may be sent to third-party providers
• Third-party terms and privacy policies apply
• Camera frames may be processed by cloud AI`
                },
                {
                    title: 'Local Data',
                    content: `All user data is stored locally on your device:
• Preferences and settings
• Conversation history
• Memory entries and notes
• Character customizations

No servers store your personal data.`
                },
                {
                    title: 'Third-Party Services',
                    content: `When using cloud AI providers, their privacy policies apply:
• Google Gemini - ai.google.dev/tos
• OpenAI - openai.com/policies/privacy-policy
• Anthropic - anthropic.com/privacy
• ElevenLabs - elevenlabs.io/privacy
• Ollama - Local processing, no data sent`
                },
                {
                    title: 'Camera & Microphone',
                    content: `**Camera:** Used for AI vision features. Disabled in Privacy Mode. Frames processed in real-time, not stored.

**Microphone:** Used for voice commands and Gemini Live. Audio streamed in real-time, not stored.

You can toggle these on/off at any time.`
                }
            ]
        },
        terms: {
            title: 'Terms of Service',
            icon: Scale,
            lastUpdated: 'January 2026',
            sections: [
                {
                    title: 'License',
                    content: `Nizhal AI grants you a limited, non-exclusive, non-transferable license to use the Software for personal, non-commercial purposes.

You agree NOT to:
• Reverse engineer or decompile the Software
• Distribute, sell, or sublicense the Software
• Use the Software to harass or harm others
• Generate illegal or harmful content`
                },
                {
                    title: 'AI-Generated Content',
                    content: `The Software uses artificial intelligence to generate responses. You acknowledge that:
• AI responses may not always be accurate
• You are responsible for validating AI content
• The AI does not provide professional advice
• AI responses do not represent our views`
                },
                {
                    title: 'Disclaimers',
                    content: `THE SOFTWARE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND.

We disclaim all warranties, express or implied, including merchantability, fitness for a particular purpose, and non-infringement.`
                },
                {
                    title: 'Limitation of Liability',
                    content: `To the maximum extent permitted by law, Nizhal AI shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Software.`
                }
            ]
        }
    };

    const currentDoc = documents[activeDoc];
    const IconComponent = currentDoc.icon;

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center gap-3">
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={onBack}
                    className="p-2 hover:bg-white/10 rounded-lg"
                >
                    <ArrowLeft size={18} className="text-slate-400" />
                </motion.button>
                <div>
                    <h2 className="text-lg font-semibold text-white">Legal</h2>
                    <p className="text-xs text-slate-500">Terms and policies</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="px-4 py-3 flex gap-2 border-b border-white/5">
                {Object.entries(documents).map(([key, doc]) => {
                    const Icon = doc.icon;
                    return (
                        <motion.button
                            key={key}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setActiveDoc(key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeDoc === key
                                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                    : 'text-slate-400 hover:bg-white/5'
                                }`}
                        >
                            <Icon size={16} />
                            {doc.title}
                        </motion.button>
                    );
                })}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeDoc}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        {/* Document Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-cyan-500/10 rounded-xl">
                                    <IconComponent size={24} className="text-cyan-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white">{currentDoc.title}</h3>
                                    <p className="text-xs text-slate-500">Last updated: {currentDoc.lastUpdated}</p>
                                </div>
                            </div>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => openExternal(`https://nizhal.ai/${activeDoc === 'privacy' ? 'privacy' : 'terms'}`)}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg"
                            >
                                <ExternalLink size={12} />
                                Full Document
                            </motion.button>
                        </div>

                        {/* Sections */}
                        <div className="space-y-4">
                            {currentDoc.sections.map((section, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="p-4 bg-white/5 rounded-xl border border-white/5"
                                >
                                    <h4 className="text-sm font-medium text-white mb-2">{section.title}</h4>
                                    <div className="text-sm text-slate-400 whitespace-pre-line">
                                        {section.content}
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Contact */}
                        <div className="p-4 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 rounded-xl border border-cyan-500/20">
                            <h4 className="text-sm font-medium text-white mb-2">Questions?</h4>
                            <p className="text-sm text-slate-400">
                                Contact us at{' '}
                                <button
                                    onClick={() => openExternal('mailto:legal@nizhal.ai')}
                                    className="text-cyan-400 hover:underline"
                                >
                                    legal@nizhal.ai
                                </button>
                            </p>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default LegalView;
