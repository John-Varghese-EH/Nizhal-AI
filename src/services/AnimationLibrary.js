/**
 * AnimationLibrary.js
 * 
 * Centralized animation library for managing VRMA animations.
 * Provides categorized animations, lazy loading, and state-based animation selection.
 */

/**
 * Animation categories and their files
 * Paths updated to direct /assets/animations/ folder with standardized naming
 */
const ANIMATION_CATALOG = {
    // Idle animations - subtle movements for standing
    idle: [
        { name: 'motion_pose', path: '/assets/animations/08_Motion_Pose.vrma', duration: 8.0, loop: true },
        { name: 'humidai', path: '/assets/animations/10_Humidai.vrma', duration: 3.0, loop: true },
        { name: 'test', path: '/assets/animations/16_Test.vrma', duration: 5.0, loop: true },
    ],

    // Greeting animations
    greeting: [
        { name: 'greeting', path: '/assets/animations/02_Greeting.vrma', duration: 3.0, loop: false },
        { name: 'hello', path: '/assets/animations/11_Hello.vrma', duration: 3.0, loop: false },
        { name: 'show_full_body', path: '/assets/animations/01_Show_Full_Body.vrma', duration: 10.0, loop: false },
    ],

    // Pose animations
    pose: [
        { name: 'model_pose', path: '/assets/animations/06_Model_Pose.vrma', duration: 5.0, loop: true },
        { name: 'peace_sign', path: '/assets/animations/03_Peace_Sign.vrma', duration: 4.0, loop: false },
        { name: 'shoot', path: '/assets/animations/04_Shoot.vrma', duration: 3.0, loop: false },
    ],

    // Action animations
    action: [
        { name: 'drink_water', path: '/assets/animations/13_Drink_Water.vrma', duration: 5.0, loop: false },
        { name: 'smartphone', path: '/assets/animations/12_Smartphone.vrma', duration: 4.0, loop: true },
        { name: 'squat', path: '/assets/animations/07_Squat.vrma', duration: 4.0, loop: true },
    ],

    // Reaction/Expression animations
    reaction: [
        { name: 'dogeza', path: '/assets/animations/09_Dogeza.vrma', duration: 3.0, loop: false },
        { name: 'cheer', path: '/assets/animations/14_Gekirei.vrma', duration: 4.0, loop: false },
        { name: 'surprise', path: '/assets/animations/15_Gatan.vrma', duration: 2.5, loop: false },
        { name: 'thinking', path: '/assets/animations/10_Humidai.vrma', duration: 3.0, loop: true },
    ],

    // Dance animations
    dance: [
        { name: 'spin', path: '/assets/animations/05_Spin.vrma', duration: 6.0, loop: true },
    ],

    // Special choreography animations
    special: [
        { name: 'smile_world', path: '/assets/animations/17_Smile_World.vrma', duration: 15.0, loop: true },
        { name: 'lovely_world', path: '/assets/animations/18_Lovely_World.vrma', duration: 15.0, loop: true },
        { name: 'cute_sparkle_world', path: '/assets/animations/19_Cute_Sparkle_World.vrma', duration: 15.0, loop: true },
        { name: 'connected_world', path: '/assets/animations/20_Connected_World.vrma', duration: 15.0, loop: true },
    ]
};

/**
 * State-to-animation mapping
 * Maps avatar states to appropriate animation categories and preferences
 */
const STATE_ANIMATION_MAP = {
    'idle': { category: 'idle', preference: 'motion_pose', fallback: 'motion_pose' },
    'speaking': { category: 'idle', preference: 'motion_pose', fallback: 'motion_pose' },
    'thinking': { category: 'reaction', preference: 'thinking', fallback: 'motion_pose' },
    'listening': { category: 'idle', preference: 'motion_pose', fallback: 'motion_pose' },
    'dancing': { category: 'dance', preference: 'random', fallback: 'spin' },
    'greeting': { category: 'greeting', preference: 'greeting', fallback: 'hello' },
    'happy': { category: 'reaction', preference: 'cheer', fallback: 'motion_pose' },
    'surprised': { category: 'reaction', preference: 'surprise', fallback: 'motion_pose' },
    'sleeping': { category: 'idle', preference: 'motion_pose', fallback: 'motion_pose' },
    'dragging': { category: 'pose', preference: 'model_pose', fallback: 'motion_pose' },
    'sitting': { category: 'idle', preference: 'motion_pose', fallback: 'motion_pose' },
    'posing': { category: 'pose', preference: 'model_pose', fallback: 'peace_sign' },
    'celebrating': { category: 'special', preference: 'random', fallback: 'smile_world' },
};

/**
 * AnimationLibrary - Manages animation catalog and selection
 */
export class AnimationLibrary {
    constructor() {
        this.catalog = ANIMATION_CATALOG;
        this.stateMap = STATE_ANIMATION_MAP;
        this.loadedAnimations = new Map(); // Cache of loaded animation configs
    }

    /**
     * Get all animations in a category
     * @param {string} category - Category name
     * @returns {Array} Array of animation configs
     */
    getCategory(category) {
        return this.catalog[category] || [];
    }

    /**
     * Get all available categories
     * @returns {string[]} Array of category names
     */
    getCategories() {
        return Object.keys(this.catalog);
    }

    /**
     * Get a specific animation by name
     * @param {string} name - Animation name
     * @returns {Object|null} Animation config or null
     */
    getAnimation(name) {
        for (const category of Object.values(this.catalog)) {
            const anim = category.find(a => a.name === name);
            if (anim) return anim;
        }
        return null;
    }

    /**
     * Get animation for a specific avatar state
     * @param {string} state - Avatar state (idle, speaking, etc.)
     * @returns {Object} Animation config
     */
    getAnimationForState(state) {
        const mapping = this.stateMap[state] || this.stateMap['idle'];
        const category = this.catalog[mapping.category] || this.catalog['idle'];

        if (mapping.preference === 'random') {
            // Return random animation from category
            const index = Math.floor(Math.random() * category.length);
            return category[index] || this.getAnimation(mapping.fallback);
        }

        // Find preferred animation
        const preferred = category.find(a => a.name === mapping.preference);
        return preferred || this.getAnimation(mapping.fallback) || category[0];
    }

    /**
     * Get a random animation from a category
     * @param {string} category - Category name
     * @returns {Object|null} Random animation config or null
     */
    getRandomFromCategory(category) {
        const anims = this.catalog[category];
        if (!anims || anims.length === 0) return null;
        return anims[Math.floor(Math.random() * anims.length)];
    }

    /**
     * Get all animation names
     * @returns {string[]} Array of all animation names
     */
    getAllAnimationNames() {
        const names = [];
        for (const category of Object.values(this.catalog)) {
            for (const anim of category) {
                names.push(anim.name);
            }
        }
        return names;
    }

    /**
     * Get total count of animations
     * @returns {number} Total animation count
     */
    getTotalCount() {
        let count = 0;
        for (const category of Object.values(this.catalog)) {
            count += category.length;
        }
        return count;
    }

    /**
     * Get animations suitable for idle gestures
     * @returns {Array} Array of animation configs for random idle gestures
     */
    getIdleGestures() {
        return [
            ...this.catalog.greeting,
            ...this.catalog.reaction.filter(a => a.name !== 'dogeza'), // Exclude extreme reactions
        ];
    }
}

// Singleton instance
let libraryInstance = null;

export function getAnimationLibrary() {
    if (!libraryInstance) {
        libraryInstance = new AnimationLibrary();
    }
    return libraryInstance;
}

export { ANIMATION_CATALOG, STATE_ANIMATION_MAP };
export default AnimationLibrary;
