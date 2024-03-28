import ModelManager from './modelmanager.class.js';

import * as THREE from './lib/three.js/three.module.js';

export default class Whiteboard {
    // Declare private members
    #whiteboard = null;
    #material = null;
    #angleDegrees = 270;

    constructor(context) {
        // Get the avatar GLTF scene
        const gltf = ModelManager.getModel('Avatar02.glb');
        
        // Add whiteboard and add it to the scene
        this.#whiteboard = gltf.scene.getObjectByName('Whiteboard');
        this.#whiteboard.rotation.x = Math.PI;
        context.scene.add(this.#whiteboard);
        
        // Create an image texture for the white part
        const white = this.#whiteboard.children[1];
        this.#material = new THREE.MeshStandardMaterial();
        white.material = this.#material;

        // Load example pdf file
        this._loadPdf();
    }

    update(context) {
        // Rotate whiteboard
        const t = 1 - Math.pow(0.1, context.elapsedSeconds);
        let a = this.#angleDegrees * Math.PI / 180 - this.#whiteboard.rotation.z;
        a = (a + Math.PI) % (Math.PI * 2) - Math.PI;

        this.#whiteboard.rotation.z += a * t;
    }
    
    _loadPdf() {
        const textureLoader = new THREE.TextureLoader();
        
        textureLoader.load(
            'http://127.0.0.1:7860/pdf_image', // './images/pdf.png',
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
