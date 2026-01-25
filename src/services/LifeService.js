
/**
 * LifeService.js
 * Manages the "Life" aspects of the user: Memories, Artifacts, and Routine.
 * Acts as a central store for the personal life manager.
 */

export class LifeService {
    constructor() {
        this.memories = [
            { id: 1, text: "We first met on Jan 25th, 2026.", date: "2026-01-25", type: "event" },
            { id: 2, text: "You like working on coding projects late at night.", date: "2026-01-25", type: "fact" },
            { id: 3, text: "You prefer the 'Kavya' personality.", date: "2026-01-25", type: "preference" }
        ];

        this.artifacts = [
            { id: 1, name: "Project Plan.md", type: "file", date: "2026-01-25", path: "/docs/plan.md" },
            { id: 2, name: "Funny Cat.jpg", type: "image", date: "2026-01-24", path: "/images/cat.jpg" }
        ];

        this.routine = {
            wakeUp: "08:00",
            workStart: "09:00",
            lunch: "13:00",
            workEnd: "18:00",
            sleep: "23:00"
        };
    }

    // --- Memories ---
    async getMemories() {
        return this.memories;
    }

    async addMemory(text, type = "fact") {
        const memory = {
            id: Date.now(),
            text,
            date: new Date().toISOString().split('T')[0],
            type
        };
        this.memories.unshift(memory);
        return memory;
    }

    async deleteMemory(id) {
        this.memories = this.memories.filter(m => m.id !== id);
    }

    // --- Artifacts ---
    async getArtifacts() {
        return this.artifacts;
    }

    async addArtifact(name, type, path) {
        const artifact = {
            id: Date.now(),
            name,
            type,
            date: new Date().toISOString().split('T')[0],
            path
        };
        this.artifacts.unshift(artifact);
        return artifact;
    }

    // --- Routine ---
    async getRoutine() {
        return this.routine;
    }

    async updateRoutine(newRoutine) {
        this.routine = { ...this.routine, ...newRoutine };
        return this.routine;
    }
}

export const lifeService = new LifeService();
