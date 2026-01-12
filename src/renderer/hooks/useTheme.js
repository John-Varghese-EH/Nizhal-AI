import { useEffect, useState } from 'react';

/**
 * useTheme - Manages Dynamic Application Theme
 * 
 * Logic:
 * - Listens to 'personalityMode'
 * - Updates document.body attribute 'data-theme'
 * - Triggers CSS variable updates automatically
 */
export const useTheme = (personalityMode) => {
    const [currentTheme, setCurrentTheme] = useState(personalityMode || 'gf');

    useEffect(() => {
        // Map personality to theme ID
        // GF -> gf
        // BF -> bf
        // JARVIS -> jarvis
        // Others -> gf (fallback)
        const themeMap = {
            'gf': 'gf',
            'bf': 'bf',
            'jarvis': 'jarvis'
        };

        const theme = themeMap[personalityMode] || 'gf';

        // Apply to body for global CSS usage
        document.body.setAttribute('data-theme', theme);
        setCurrentTheme(theme);

        // Log for debugging
        console.log(`[useTheme] Applied theme: ${theme}`);

    }, [personalityMode]);

    return currentTheme;
};
