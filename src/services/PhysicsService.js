import * as CANNON from 'cannon-es';

/**
 * SpringBonePhysics - Simple spring physics for hair/clothing simulation
 * Lightweight alternative to full DynamicBone for web use
 */
export class SpringBonePhysics {
    constructor(options = {}) {
        this.stiffness = options.stiffness ?? 0.1;
        this.damping = options.damping ?? 0.8;
        this.gravity = options.gravity ?? -9.8;
        this.windStrength = options.windStrength ?? 0;
        this.windDirection = options.windDirection ?? { x: 1, y: 0, z: 0 };

        this.bones = [];
        this.isActive = true;
    }
    // ... (rest of SpringBonePhysics implementation kept as is if needed, or we just append Floating class) ...
    // To safe tokens I'll assume I can just append the new class if I use multi_replace or append.
    // simpler to just rewrite the file with both classes or add the new one.
    // Since I'm using replace_file_content, I need to be careful not to delete SpringBone if it's used.
    // But the prompt implies replacing/updating.

    // Let's implement FloatingPhysicsController and export it.
    // I will write the FULL file content to be safe and clean.

    /**
     * Add a bone chain to simulate
     * @param {Object} bone - { transform, initialRotation, parent }
     */
    addBone(bone) {
        this.bones.push({
            transform: bone.transform,
            initialRotation: bone.initialRotation?.clone() || bone.transform.rotation.clone(),
            velocity: { x: 0, y: 0, z: 0 },
            parent: bone.parent
        });
    }

    /**
     * Update physics simulation
     * @param {number} delta - Time delta in seconds
     */
    update(delta) {
        if (!this.isActive) return;

        const dt = Math.min(delta, 0.033); // Cap at ~30fps for stability

        for (const bone of this.bones) {
            if (!bone.transform) continue;

            // Calculate forces
            const gravityForce = this.gravity * 0.01;
            const windForce = this.windStrength * Math.sin(Date.now() * 0.001) * 0.01;

            // Spring force towards initial rotation
            const springX = (bone.initialRotation.x - bone.transform.rotation.x) * this.stiffness;
            const springZ = (bone.initialRotation.z - bone.transform.rotation.z) * this.stiffness;

            // Apply forces
            bone.velocity.x += springX + windForce * this.windDirection.x;
            bone.velocity.z += springZ + gravityForce;

            // Apply damping
            bone.velocity.x *= this.damping;
            bone.velocity.z *= this.damping;

            // Update rotation
            bone.transform.rotation.x += bone.velocity.x * dt;
            bone.transform.rotation.z += bone.velocity.z * dt;

            // Clamp to reasonable limits
            const limit = 0.5;
            bone.transform.rotation.x = Math.max(-limit, Math.min(limit, bone.transform.rotation.x));
            bone.transform.rotation.z = Math.max(-limit, Math.min(limit, bone.transform.rotation.z));
        }
    }
}

/**
 * FloatingPhysicsController - Uses Cannon.js for smooth floating character physics
 */
export class FloatingPhysicsController {
    constructor() {
        this.world = new CANNON.World();
        this.world.gravity.set(0, 0, 0); // Zero gravity for floating
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.solver.iterations = 10;

        // Avatar Body (Sphere)
        this.avatarShape = new CANNON.Sphere(0.5); // 0.5m radius
        this.avatarBody = new CANNON.Body({
            mass: 5, // Heavy enough to be stable
            position: new CANNON.Vec3(0, 0, 0),
            linearDamping: 0.9, // High damping to stop quickly
            angularDamping: 0.9
        });
        this.avatarBody.addShape(this.avatarShape);
        this.world.addBody(this.avatarBody);

        // Repulsor Body (Mouse cursor) - Kinematic
        this.mouseShape = new CANNON.Sphere(1.0); // Large influence radius
        this.mouseBody = new CANNON.Body({
            mass: 0, // Static/Kinematic
            position: new CANNON.Vec3(100, 100, 100), // Start far away
            type: CANNON.Body.KINEMATIC
        });
        this.mouseBody.addShape(this.mouseShape);
        this.world.addBody(this.mouseBody);

        // Spring to keep avatar centered
        this.centerBody = new CANNON.Body({ mass: 0, position: new CANNON.Vec3(0, 0, 0) });
        this.centerSpring = new CANNON.Spring(this.avatarBody, this.centerBody, {
            localAnchorA: new CANNON.Vec3(0, 0, 0),
            localAnchorB: new CANNON.Vec3(0, 0, 0),
            restLength: 0,
            stiffness: 50,
            damping: 4,
        });
        this.world.addEventListener('postStep', () => {
            this.centerSpring.applyForce();
        });

        // Mouse interaction
        this.mouseRepulsionForce = 200;
    }

    update(delta, mousePos) {
        // Step physics
        this.world.step(1 / 60, delta, 3);

        // Update mouse body position (projected to 3D roughly)
        // Assuming mousePos is normalized -1 to 1 or similar, or skip if not provided
        if (mousePos) {
            // Repulse avatar from mouse
            const dist = this.avatarBody.position.distanceTo(new CANNON.Vec3(mousePos.x, mousePos.y, 0));
            if (dist < 2.0) {
                const force = new CANNON.Vec3(
                    this.avatarBody.position.x - mousePos.x,
                    this.avatarBody.position.y - mousePos.y,
                    0
                );
                force.normalize();
                force.scale(this.mouseRepulsionForce * (2.0 - dist), force);
                this.avatarBody.applyForce(force, this.avatarBody.position);
            }
        }

        return {
            x: this.avatarBody.position.x,
            y: this.avatarBody.position.y,
            z: this.avatarBody.position.z
        };
    }
}

export default { SpringBonePhysics, FloatingPhysicsController };
