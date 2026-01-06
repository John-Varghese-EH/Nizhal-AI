import JarvisHUD from './skins/JarvisHUD';
import CompanionOrb from './skins/CompanionOrb';
import VideoAvatar from './avatar/VideoAvatar';

const SkinManager = ({
    personaId = 'jarvis',
    activeSkin = 'default',
    personalityState,
    isActive = true,
    showVideoAvatar = true
}) => {
    const getMoodColor = (mood) => {
        const colors = {
            happy: '#10b981',
            neutral: '#6366f1',
            concerned: '#f59e0b',
            protective: '#ef4444',
            playful: '#ec4899',
            thoughtful: '#8b5cf6'
        };
        return colors[mood] || colors.neutral;
    };

    const renderSkin = () => {
        // Skin A: Jarvis HUD
        if (activeSkin === 'jarvis_hud' || personaId === 'jarvis') {
            return (
                <JarvisHUD
                    mood={personalityState?.mood}
                    affection={personalityState?.affection}
                    isActive={isActive}
                />
            );
        }

        // Skin C: Video Avatar (Bella/Thozhi style)
        if (showVideoAvatar && ['kavya', 'arjun', 'tamil_nanban', 'naruto', 'goku', 'elsa'].includes(personaId)) {
            return (
                <div className="relative w-full h-full flex items-center justify-center">
                    <VideoAvatar
                        personaId={personaId}
                        currentState={isActive ? 'listening' : 'idle'}
                        mood={personalityState?.mood}
                        size="fullscreen"
                    />
                </div>
            );
        }

        // Skin B: Companion Orb (Fallback/Default)
        return (
            <CompanionOrb
                mood={personalityState?.mood}
                moodColor={getMoodColor(personalityState?.mood)}
                isActive={isActive}
            />
        );
    };

    return (
        <div className="absolute inset-0 pointer-events-none z-0">
            {renderSkin()}
        </div>
    );
};

export default SkinManager;
