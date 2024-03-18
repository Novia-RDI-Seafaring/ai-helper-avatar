import ModelManager from './modelmanager.class.js';

import * as THREE from './lib/three.js/three.module.js';

export default class Avatar {
    // Declare private members
    #animations = null;
    #rig = null;
    #mixer = null;
    #playingAction = null;

    constructor(context) {
        // Get the avatar GLTF scene
        const gltf = ModelManager.getModel('Avatar01.glb');

        // Save animations
        this.#animations = gltf.animations;

        // Get the rig and add it to the scene
        this.#rig = gltf.scene.getObjectByName('Rig');
        context.scene.add(this.#rig);

        // Create an animation mixer for the rig
        this.#mixer = new THREE.AnimationMixer(this.#rig);

        // Schedule animations
        this.playAnimation('Welcome');
        setTimeout(() => this.playAnimation('Idle01'), 5000);
        setTimeout(() => this.playAnimation('Idle02'), 10000);
        setTimeout(() => this.playAnimation('Idle03'), 15000);
        setTimeout(() => this.playAnimation('Idle04'), 20000);
    }

    update(context) {
        // Update action clip
        this.#mixer.update(context.elapsedSeconds);
    }

    playAnimation(name, crossFadeTime = 0.5) {
        // Find animation
        const animation = this.#animations.find(animation => animation.name === name);
        if (animation === undefined) {
            throw new Error(`Invalid animation "${name}"`);
        }
    
        // Create action clip for animation
        const action = this.#mixer.clipAction(animation);
    
        // Cross-fade from last action clip
        if (this.#playingAction !== null) {
            this.#playingAction.crossFadeTo(action, crossFadeTime);
        }
        this.#playingAction = action;

        // Play action clip
        action.play();
    }
}
