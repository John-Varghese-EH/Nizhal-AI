
/**
 * FamilyService.js
 * Manages multiple user profiles (Family Members).
 * Allows switching contexts so Nizhal knows who it is talking to.
 */

export class FamilyService {
    constructor() {
        this.members = [
            {
                id: 'admin',
                name: 'Chief',
                role: 'admin',
                relationship: 'primary',
                voiceParams: { pitch: 1.0, rate: 1.0 }
            }
        ];
        this.activeMemberId = 'admin';
    }

    /**
     * Get all registered family members
     */
    async getMembers() {
        return this.members;
    }

    /**
     * Get the currently active member
     */
    async getActiveMember() {
        return this.members.find(m => m.id === this.activeMemberId) || this.members[0];
    }

    /**
     * Add a new family member
     * @param {string} name - Name of the member
     * @param {string} relationship - e.g., 'sister', 'brother', 'friend'
     */
    async addMember(name, relationship) {
        const id = name.toLowerCase().replace(/\s+/g, '-');
        const newMember = {
            id,
            name,
            role: 'member',
            relationship,
            voiceParams: { pitch: 1.0, rate: 1.0 }
        };

        // Prevent duplicates
        if (!this.members.find(m => m.id === id)) {
            this.members.push(newMember);
        }

        return newMember;
    }

    /**
     * Switch the active user context
     * @param {string} memberId 
     */
    async switchMember(memberId) {
        const member = this.members.find(m => m.id === memberId);
        if (member) {
            this.activeMemberId = memberId;
            console.log(`[FamilyService] Switched to ${member.name}`);
            return true;
        }
        return false;
    }

    /**
     * Remove a member (except admin)
     */
    async removeMember(memberId) {
        if (memberId === 'admin') return false; // Cannot remove admin

        this.members = this.members.filter(m => m.id !== memberId);
        if (this.activeMemberId === memberId) {
            this.activeMemberId = 'admin'; // Fallback
        }
        return true;
    }
}

export const familyService = new FamilyService();
