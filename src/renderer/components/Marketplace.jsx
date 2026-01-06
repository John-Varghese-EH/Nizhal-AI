import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Marketplace = ({ onBack }) => {
    const [personas, setPersonas] = useState([]);
    const [selectedPersona, setSelectedPersona] = useState(null);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [purchaseResult, setPurchaseResult] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadPersonas();
    }, []);

    const loadPersonas = async () => {
        try {
            const availablePersonas = await window.nizhal?.marketplace.getPersonas();
            setPersonas(availablePersonas || []);
        } catch (error) {
            console.error('Failed to load personas:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePurchase = async (personaId, gateway) => {
        setIsPurchasing(true);
        setPurchaseResult(null);

        try {
            const result = await window.nizhal?.marketplace.purchase(personaId, gateway);
            setPurchaseResult(result);

            if (result?.success) {
                await loadPersonas();
            }
        } catch (error) {
            setPurchaseResult({ success: false, error: error.message });
        } finally {
            setIsPurchasing(false);
        }
    };

    const getTierBadge = (tier) => {
        const styles = {
            free: 'bg-green-500/20 text-green-400 border-green-500/30',
            pro: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
            elite: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
            ultimate: 'bg-rose-500/20 text-rose-400 border-rose-500/30'
        };
        return styles[tier] || styles.free;
    };

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <motion.div
                    className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col overflow-hidden">
            <div className="p-4 border-b border-white/5">
                <h2 className="text-lg font-semibold gradient-text">Persona Marketplace</h2>
                <p className="text-xs text-white/50 mt-1">Unlock new companions and features</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {personas.map((persona) => (
                    <motion.div
                        key={persona.id}
                        layoutId={persona.id}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setSelectedPersona(persona)}
                        className="bg-white/5 rounded-xl p-4 border border-white/10 cursor-pointer hover:border-indigo-500/50 transition-all"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-medium text-white">{persona.name}</h3>
                                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getTierBadge(persona.tier)}`}>
                                        {persona.tier.toUpperCase()}
                                    </span>
                                    {persona.unlocked && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                                            ✓ Owned
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-white/50 mt-1">{persona.description}</p>
                            </div>

                            {!persona.unlocked && persona.price && (
                                <div className="text-right">
                                    <div className="text-sm font-bold text-indigo-400">
                                        ${persona.price.usd}
                                    </div>
                                    <div className="text-xs text-white/40">
                                        ₹{persona.price.inr}
                                    </div>
                                </div>
                            )}
                        </div>

                        {persona.features && (
                            <div className="flex flex-wrap gap-1 mt-3">
                                {persona.features.slice(0, 3).map((feature, i) => (
                                    <span key={i} className="text-xs bg-white/5 px-2 py-1 rounded-md text-white/60">
                                        {feature}
                                    </span>
                                ))}
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            <AnimatePresence>
                {selectedPersona && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                        onClick={() => setSelectedPersona(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full border border-white/10"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-white">{selectedPersona.name}</h3>
                                <button
                                    onClick={() => setSelectedPersona(null)}
                                    className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <p className="text-sm text-white/60 mb-4">{selectedPersona.description}</p>

                            {selectedPersona.features && (
                                <div className="space-y-2 mb-6">
                                    {selectedPersona.features.map((feature, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm text-white/80">
                                            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            {feature}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {purchaseResult && (
                                <div className={`mb-4 p-3 rounded-lg text-sm ${purchaseResult.success
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-red-500/20 text-red-400'
                                    }`}>
                                    {purchaseResult.success
                                        ? '✓ Purchase successful! Persona unlocked.'
                                        : purchaseResult.cancelled
                                            ? 'Purchase cancelled.'
                                            : `Error: ${purchaseResult.error}`}
                                </div>
                            )}

                            {selectedPersona.unlocked ? (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        window.nizhal?.persona.setActive(selectedPersona.id);
                                        setSelectedPersona(null);
                                    }}
                                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors"
                                >
                                    Activate Persona
                                </motion.button>
                            ) : selectedPersona.tier === 'free' ? (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        window.nizhal?.persona.setActive(selectedPersona.id);
                                        setSelectedPersona(null);
                                    }}
                                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
                                >
                                    Use Now (Free)
                                </motion.button>
                            ) : (
                                <div className="space-y-2">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handlePurchase(selectedPersona.id, 'razorpay')}
                                        disabled={isPurchasing}
                                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isPurchasing ? (
                                            <motion.div
                                                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                            />
                                        ) : (
                                            <>
                                                Pay ₹{selectedPersona.price?.inr} (India)
                                            </>
                                        )}
                                    </motion.button>

                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handlePurchase(selectedPersona.id, 'stripe')}
                                        disabled={isPurchasing}
                                        className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white font-medium rounded-xl transition-colors"
                                    >
                                        Pay ${selectedPersona.price?.usd} (International)
                                    </motion.button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Marketplace;
