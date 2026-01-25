import React from 'react';
import { Minus, Square, X } from 'lucide-react';

const WindowControls = ({ theme = 'dark', relative = false }) => {
    const handleMinimize = () => window.nizhal?.window?.minimize();
    const handleMaximize = () => window.nizhal?.window?.maximize();
    const handleClose = () => window.nizhal?.window?.close();

    const isLight = theme === 'light';
    const hoverBg = isLight ? 'hover:bg-black/10' : 'hover:bg-white/10';
    const activeBg = isLight ? 'active:bg-black/20' : 'active:bg-white/20';
    const color = isLight ? 'text-gray-800' : 'text-gray-200';

    return (
        <div className={`${relative ? '' : 'absolute top-0 right-0 p-2'} z-50 flex items-center gap-1 window-drag-region-no`}>
            <button
                onClick={handleMinimize}
                className={`p-2 rounded-lg transition-all ${hoverBg} ${activeBg} ${color}`}
                title="Minimize"
            >
                <Minus size={16} />
            </button>
            <button
                onClick={handleMaximize}
                className={`p-2 rounded-lg transition-all ${hoverBg} ${activeBg} ${color}`}
                title="Maximize"
            >
                <Square size={14} />
            </button>
            <button
                onClick={handleClose}
                className={`p-2 rounded-lg transition-all hover:bg-red-500 hover:text-white ${color}`}
                title="Close"
            >
                <X size={16} />
            </button>
        </div>
    );
};

export default WindowControls;
