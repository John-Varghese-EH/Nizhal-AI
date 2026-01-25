/**
 * RelationshipMemory - Tracks bonding and history
 * Mock local persistence
 */
export const RelationshipMemory = {
    data: {
        bondingLevel: 1, // 1-100
        xp: 0,
        startDate: Date.now(),
        milestones: [],
        journal: [],
        facts: {}
    },

    load() {
        // In real app: localStorage.getItem('nizhal_relationship')
        console.log("[RelationshipMemory] Loaded history.");
    },

    save() {
        // localStorage.setItem('nizhal_relationship', JSON.stringify(this.data))
    },

    addXP(amount) {
        this.data.xp += amount;
        if (this.data.xp > this.data.bondingLevel * 100) {
            this.data.bondingLevel++;
            return true; // Leveled up
        }
        return false;
    },

    logMood(text, mood) {
        this.data.journal.push({
            timestamp: Date.now(),
            text,
            mood
        });
    },

    getBondingStatus() {
        const days = Math.floor((Date.now() - this.data.startDate) / (1000 * 60 * 60 * 24));

        let title = "Acquaintance";
        if (this.data.bondingLevel > 5) title = "Friend";
        if (this.data.bondingLevel > 15) title = "Close Friend";
        if (this.data.bondingLevel > 30) title = "Partner";
        if (this.data.bondingLevel > 50) title = "Soulmate";

        return {
            level: this.data.bondingLevel,
            title,
            daysTogether: days
        };
    }
};
