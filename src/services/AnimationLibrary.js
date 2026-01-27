/**
 * AnimationLibrary.js
 * 
 * Centralized animation library for managing VRMA animations.
 * Provides categorized animations, lazy loading, and state-based animation selection.
 * 
 * IMPORTANT: All paths must match actual files in /public/assets/animations/
 */

/**
 * Animation categories and their files
 * Files actually available:
 * 01_Show_Full_Body.vrma, 02_Greeting.vrma, 03_Peace_Sign.vrma, 04_Shoot.vrma,
 * 05_Spin.vrma, 06_Model_Pose.vrma, 07_Squat.vrma, 08_Motion_Pose.vrma,
 * 09_Bow.vrma, 10_Step.vrma, 11_Hello.vrma, 12_Smartphone.vrma,
 * 13_Drink_Water.vrma, 14_Warm_Up.vrma, 15_Sit.vrma, 17_Smile_World.vrma,
 * 18_Lovely_World.vrma, 19_Cute_Sparkle_World.vrma, 20_Connected_World.vrma
 */
const ANIMATION_CATALOG = {
    // Idle animations - subtle movements for standing
    idle: [
        { name: 'motion_pose', path: '/assets/animations/08_Motion_Pose.vrma', duration: 8.0, loop: true },
        { name: 'step', path: '/assets/animations/10_Step.vrma', duration: 3.0, loop: true },
        { name: 'sit', path: '/assets/animations/15_Sit.vrma', duration: 5.0, loop: true },
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
        { name: 'warm_up', path: '/assets/animations/14_Warm_Up.vrma', duration: 4.0, loop: true },
    ],

    // Reaction/Expression animations
    reaction: [
        { name: 'bow', path: '/assets/animations/09_Bow.vrma', duration: 3.0, loop: false },
        { name: 'step', path: '/assets/animations/10_Step.vrma', duration: 2.0, loop: false },
    ],

    // Dance animations
    dance: [
        { name: 'spin', path: '/assets/animations/05_Spin.vrma', duration: 6.0, loop: true },
    ],

    // Special choreography animations (World series)
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
    'thinking': { category: 'idle', preference: 'motion_pose', fallback: 'motion_pose' },
    'listening': { category: 'idle', preference: 'motion_pose', fallback: 'motion_pose' },
    'dancing': { category: 'dance', preference: 'spin', fallback: 'spin' },
    'greeting': { category: 'greeting', preference: 'greeting', fallback: 'hello' },
    'happy': { category: 'greeting', preference: 'hello', fallback: 'motion_pose' },
    'surprised': { category: 'reaction', preference: 'bow', fallback: 'motion_pose' },
    'sleeping': { category: 'idle', preference: 'sit', fallback: 'motion_pose' },
    'dragging': { category: 'pose', preference: 'model_pose', fallback: 'motion_pose' },
    'sitting': { category: 'idle', preference: 'sit', fallback: 'motion_pose' },
    'posing': { category: 'pose', preference: 'model_pose', fallback: 'peace_sign' },
    'celebrating': { category: 'special', preference: 'random', fallback: 'smile_world' },
    'working': { category: 'action', preference: 'smartphone', fallback: 'motion_pose' },
    'exercising': { category: 'action', preference: 'warm_up', fallback: 'squat' },
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
                if (!names.includes(anim.name)) {
                    names.push(anim.name);
                }
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
            ...this.catalog.reaction,
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
