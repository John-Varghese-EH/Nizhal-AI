/**
 * SentimentEngine - Emotional Analysis
 * lightweight heuristic analysis for text sentiment
 */
export const SentimentEngine = {
    analyze(text) {
        const lower = text.toLowerCase();

        let score = 0; // -1 to 1
        let mood = 'neutral';

        const positiveWords = ['love', 'happy', 'great', 'good', 'awesome', 'thanks', 'cool', 'excited', 'fun', 'win', 'crushed'];
        const negativeWords = ['sad', 'bad', 'angry', 'hate', 'upset', 'fail', 'tired', 'stressed', 'hard', 'stuck', 'error'];
        const flirtWords = ['cute', 'beautiful', 'kiss', 'hug', 'miss you', 'babe', 'love you'];
        const stressWords = ['deadline', 'exam', 'pressure', 'broken', 'bug', 'fix', 'urgent'];

        // Simple scoring
        positiveWords.forEach(w => { if (lower.includes(w)) score += 0.2; });
        negativeWords.forEach(w => { if (lower.includes(w)) score -= 0.2; });

        // Context detection
        const isFlirty = flirtWords.some(w => lower.includes(w));
        const isStressed = stressWords.some(w => lower.includes(w));

        // Determine mood tag
        if (isFlirty) mood = 'romantic';
        else if (isStressed) mood = 'stressed';
        else if (score >= 0.4) mood = 'happy';
        else if (score <= -0.4) mood = 'sad';

        return {
            score: Math.max(-1, Math.min(1, score)),
            mood: mood,
            isFlirty,
            isStressed
        };
    }
};
