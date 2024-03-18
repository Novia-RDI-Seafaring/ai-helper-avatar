import HumanIK from './humanik.class.js';
import ModelManager from './modelmanager.class.js';

import * as THREE from './lib/three.js/three.module.js';
import { CCDIKSolver } from './lib/three.js/CCDIKSolver.js';

export default class Avatar {
    // Declare private members
    #rig = null;
    #ik = null;
    #animations = null;
    #mixer = null;
    #playingAction = null;

    constructor(context) {
        // Get the avatar GLTF scene
        const gltf = ModelManager.getModel('Avatar01.glb');

        // Get the rig and add it to the scene
        this.#rig = gltf.scene.getObjectByName('Rig');
        context.scene.add(this.#rig);
        
        // Save animations
        this.#animations = gltf.animations;

        // Create an animation mixer for the rig
        this.#mixer = new THREE.AnimationMixer(this.#rig);
        
        // Add human inverse kinematics
        this.#ik = new HumanIK(context, this.#rig);
        
        // Schedule animations
        this.playAnimation('Welcome');
        setTimeout(() => this.playAnimation('Idle01'), 5000);
        setTimeout(() => this.playAnimation('Idle02'), 10000);
        setTimeout(() => this.playAnimation('Idle03'), 15000);
        setTimeout(() => this.playAnimation('Idle04'), 20000);
        
        // Move IK target
        for (let i = 0; i < 100; i++) {
            setTimeout(() => this.#ik.ikTarget.position.set(
                Math.random() * 6 - 3, Math.random() * 6 - 3, Math.random() * 6 - 3), i * 3000);
        }
    }

    update(context) {
        // Update action clip (animation)
        this.#mixer.update(context.elapsedSeconds);

        // Update IK
        this.#ik.update(context);
    }

    playAnimation(name, crossFadeSeconds = 0.5) {
        // Find animation
        const animation = this.#animations.find(animation => animation.name === name);
        if (animation === undefined) {
            throw new Error(`Invalid animation "${name}"`);
        }
    
        // Create action clip for animation
        const action = this.#mixer.clipAction(animation);
    
        // Cross-fade from last action clip
        if (this.#playingAction !== null) {
            this.#playingAction.crossFadeTo(action, crossFadeSeconds);
        }
        this.#playingAction = action;

        // Play action clip
        action.play();
    }
}
