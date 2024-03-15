import ModelManager from './modelmanager.class.js';

import * as THREE from './lib/three.js/three.module.js';

export default class Avatar {
    // Declare private members
    #rig = null;
    #mixer = null;

    constructor(context) {
        // Get the avatar GLTF scene
        const gltf = ModelManager.getModel('Avatar01.glb');

        // Get the rig and add it to the scene
        this.#rig = gltf.scene.getObjectByName('Rig');
        this.#context.scene.add(this.#rig);

        // Create an animation mixer for the rig
        this.#mixer = new THREE.AnimationMixer(this.#rig);

        // Start an animation
        const animation = gltf.animations.find(animation => animation.name === 'Welcome');
        
        this.#mixer.clipAction(animation).play();
    }

    update(context) {
        // Update animation
        this.#mixer.update(#context.elapsedSeconds);
    }
}