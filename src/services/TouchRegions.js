import { Raycaster, Vector2 } from 'three';
import { getAvatarStateController, AvatarState } from './AvatarStateController';
import { companionPersonality } from './CompanionPersonality';
import { randomMessagesService } from './RandomMessages';

/**
 * TouchRegions Service
 * Handles raycasting and interaction with VRM avatar bones.
 */
class TouchRegionsService {
    constructor() {
        this.raycaster = new Raycaster();
        this.pointer = new Vector2();

        // Bone mapping for standardized touch zones
        // Maps VRM Humanoid bone names to logical zones
        this.boneMap = {
            // Head Zone
            'head': 'head',
            'neck': 'head',

            // Chest/Body Zone
            'chest': 'chest',
            'spine': 'chest',
            'upperChest': 'chest',
            'hips': 'chest',

            // Hands
            'leftHand': 'hand_l',
            'rightHand': 'hand_r',
            'leftLowerArm': 'hand_l',
            'rightLowerArm': 'hand_r'
        };

        // Interactions for each zone
        this.interactions = {
            'head': {
                expression: 'happy',
                message: ['Pat pat!', 'Hehe!', 'That feels nice.', 'You are kind.'],
                mood: 'happy'
            },
            'chest': {
                expression: 'surprised',
                message: ['Hey!', 'Poke!', 'Tickles!', 'What was that?'],
                mood: 'playful'
            },
            'hand_l': {
                expression: 'happy',
                message: ['High five!', 'Holding hands?', 'Hello!', 'Wave!'],
                mood: 'friendly'
            },
            'hand_r': {
                expression: 'happy',
                message: ['High five!', 'Shake hands?', 'Greetings!', 'Hello!'],
                mood: 'friendly'
            }
        };

        this.lastTouchTime = 0;
        this.touchCooldown = 1000; // ms
    }

    /**
     * Handle click/touch on the VRM
     * @param {Object} event - The Three.js interaction event
     * @param {Object} vrm - The VRM instance
     */
    handleTouch(event, vrm) {
        // Prevent spam
        const now = Date.now();
        if (now - this.lastTouchTime < this.touchCooldown) return;

        // Check if we hit a bone we care about
        // The event object from React Three Fiber usually has 'object' which is the mesh
        // We need to find the bone associated with it or traverse up

        let hitObject = event.object;
        let boneName = null;

        // traverse up to find bone name if it's attached to one
        // VRM meshes are often SkinnedMesh and associated with bones
        // But the hit detection might be on the mesh itself which corresponds to a bone
        // Or we check the name of the object

        if (hitObject.name) {
            // Check if name contains bone keywords
            // Basic fuzzy matching since mapping SkinnedMesh to specific bone exactly can be complex without a lookup table
            const name = hitObject.name.toLowerCase();

            // Try to find matching bone key
            for (const boneKey of Object.keys(this.boneMap)) {
                if (name.includes(boneKey.toLowerCase())) {
                    boneName = boneKey;
                    break;
                }
            }
        }

        // If no direct name match, try strictly checking the Standard Skeleton if available
        if (!boneName && vrm.humanoid) {
            // Only works if we are actually clicking a bone helper, which is rare.
            // Usually we click the mesh. 
            // IMPROVEMENT: For robust detection, we assume standard VRM mesh segmentation or 
            // just use basic height-based fallback if bone detection fails.
        }

        // Fallback: Height-based detection (simple & effective for single mesh avatars)
        if (!boneName) {
            const point = event.point; // partial vector3 in world space
            // Assuming character is at (0, y, 0)
            // Head is high, chest mid, etc.
            // We need character height, but let's guess standard units

            // This is relative to the VRM root
            const vrmRoot = vrm.scene;
            const localPoint = vrmRoot.worldToLocal(point.clone());

            if (localPoint.y > 1.3) boneName = 'head';
            else if (localPoint.y > 0.8) boneName = 'chest';
            else boneName = 'hips'; // or default
        }

        const zone = this.boneMap[boneName];
        if (zone) {
            this.triggerReaction(zone);
            this.lastTouchTime = now;
            event.stopPropagation(); // Stop event bubble
        }
    }

    /**
     * Trigger reaction for a specific zone
     */
    triggerReaction(zone) {
        const reaction = this.interactions[zone] || this.interactions['head'];

        // Map zone names for RandomMessages (hands -> hands for both)
        let messageZone = zone;
        if (zone === 'hand_l' || zone === 'hand_r') {
            messageZone = 'hands';
        }

        // Get message from RandomMessages service
        const message = randomMessagesService.getTouchMessage(messageZone);

        // Trigger mood change via IPC (persona update)
        if (window.nizhal && window.nizhal.invoke) {
            window.nizhal.invoke('persona:updateMood', reaction.mood).catch(() => { });
        }

        // Show message via CompanionPersonality callback
        if (companionPersonality.messageCallback) {
            companionPersonality.messageCallback(message);
        }
    }
}

export const touchRegionsService = new TouchRegionsService();
