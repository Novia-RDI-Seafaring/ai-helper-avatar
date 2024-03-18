import ModelManager from './modelmanager.class.js';

import * as THREE from './lib/three.js/three.module.js';

export default class Avatar {
    // Declare private members
    #rig = null;
    #mixer = null;
	#playingAction = null;

    constructor(context) {
        // Get the avatar GLTF scene
        const gltf = ModelManager.getModel('Avatar01.glb');

        // Get the rig and add it to the scene
        this.#rig = gltf.scene.getObjectByName('Rig');
        context.scene.add(this.#rig);

        // Create an animation mixer for the rig
        this.#mixer = new THREE.AnimationMixer(this.#rig);

        this.playAnimation('Welcome');
    }

    update(context) {
        // Update animation
        this.#mixer.update(context.elapsedSeconds);
    }

    playAnimation(name, crossFadeTime = 0.5) {
		// Find animation
		const animation = gltf.animations.find(animation => animation.name === 'Welcome');
        if (animation === undefined) {
			throw new Error(`Invalid animation "${name}"`);
        }
    
        // Create action for animation
        const action = this.#mixer.clipAction(animation);
    
        // Cross-fade from last action
        if (this.#playingAction !== null) {
			this.#playingAction.crossFadeTo(action, crossFadeTime);
        }
        this.#playingAction = action;

		// Play action
		action.play();
    }
}
