import ModelManager from './modelmanager.class.js';

import * as THREE from './lib/three.js/three.module.js';

export default class Whiteboard {
    // Declare private members
    #whiteboard = null;
    #material = null;
    #angleDegrees = 0;

    constructor(context) {
        // Get the avatar GLTF scene
        const gltf = ModelManager.getModel('Avatar02.glb');
        
        // Add whiteboard and add it to the scene
        this.#whiteboard = gltf.scene.getObjectByName('Whiteboard');
        context.scene.add(this.#whiteboard);

        // Create an image texture for the white part
        const white = this.#whiteboard.children[1];
        this.#material = new THREE.MeshStandardMaterial();
        white.material = this.#material;

        // Load example pdf file
        this._loadPdf();
    }

    update(context) {
        const t = Math.pow(0.5, context.elapsedSeconds);

        this.#whiteboard.rotation.z = this.#whiteboard.rotation.x * t + this.#angleDegrees * Math.PI / 180 * (1 - t);
    }
    
    _loadPdf() {
        const textureLoader = new THREE.TextureLoader();
        
        textureLoader.load(
            './images/pdf.png',
            texture => {
                texture.repeat.set(-1, 1);
                texture.offset.setX(1);
                this.#material.map = texture;
                this.#material.needsUpdate = true;
            }
        );
    }
    
    getImageWorldPosition(x, y, depth, target) {
        const width = 0.84 * 2;
        const height = 0.63 * 2;
        target.set((x - 0.5) * width, (y - 0.5) * height, depth);
        return this.#whiteboard.localToWorld(target);
    }
    
    getAngleDegrees() {
        return this.#angleDegrees;
    }
    
    spin(newAngleDegrees) {
        this.#angleDegrees = newAngleDegrees;
    }
}
