import ModelManager from './modelmanager.class.js';

import * as THREE from './lib/three.js/three.module.js';

export default class Whiteboard {
    // Declare private members
    #whiteboard = null;
    #startPosition = null;
    #material = null;
    #angleDegrees = 270;
    #focusing = false;
    #focusUV = new THREE.Vector2();

    // Re-usable vectors to prevent run-time allocations
    #tmpV30 = new THREE.Vector3();
    #tmpV31 = new THREE.Vector3();

    constructor(context) {
        // Get the avatar GLTF scene
        const gltf = ModelManager.getModel('Avatar26.glb');

        // Add whiteboard and add it to the scene
        this.#whiteboard = gltf.scene.getObjectByName('Whiteboard');
        this.#whiteboard.rotation.x = Math.PI;
        this.#startPosition = this.#whiteboard.position.clone();
        this.#startPosition.z -= 0.2;
        context.scene.add(this.#whiteboard);

        // Create an image texture for the white part
        const white = this.#whiteboard.children[1];
        this.#material = new THREE.MeshBasicMaterial();
        white.material = this.#material;

        // Load example pdf file
        this.loadPdf(context);
    }

    update(context) {
        // Rotate whiteboard

        const tRotate = 1 - Math.pow(0.1, context.elapsedSeconds);
        let a = this.#angleDegrees * Math.PI / 180 - this.#whiteboard.rotation.z;
        a = (a + Math.PI) % (Math.PI * 2) - Math.PI;

        this.#whiteboard.rotation.z += a * tRotate;
        this.#whiteboard.rotation.y = -0.05;

        // Focus on an area

        const tFocus = 0.05;

        // Scale the whiteboard
        const scaleTarget = this.#focusing
            ? this.#tmpV30.set(1.8, 1.8, 1.8)
            : this.#tmpV30.set(1.2, 1.2, 1.2);
        this.#whiteboard.scale.lerp(scaleTarget, tFocus);

        if (this.#focusing) {
            // Get the focus position in world space
            const imagePosition = this.getImageWorldPosition(this.#focusUV, 0.3, this.#tmpV30);

            // Get the expected world position where the focus should be
            const screenFocusPosition = this.#tmpV31.set(-0.2, 0, 0.92);
            const cameraFocusPosition = screenFocusPosition.unproject(context.camera);

            // Apply an offset
            const offset = cameraFocusPosition.sub(imagePosition);
            this.#whiteboard.position.addScaledVector(offset, Math.max(0, tFocus - Math.max(0, 1 - offset.length()) * 0.1));
        } else {
            // Return to the original position
            this.#whiteboard.position.lerp(this.#startPosition, tFocus);
        }
    }

    loadPdf(context, bboxes = null) {
        console.log('Loading pdf with bounding box', bboxes);

        const textureLoader = new THREE.TextureLoader();
        const query = bboxes === null ? '' : `?bboxes=${JSON.stringify(bboxes)}`;

        textureLoader.load(
            './pdf_image' + query,
            texture => {
                texture.repeat.set(-1, 1);
                texture.offset.setX(1);

                // Make the image sharper
                texture.generateMipmaps = false;
                texture.anisotropy = context.renderer.capabilities.getMaxAnisotropy();
                texture.minFilter = THREE.LinearFilter;

                this.#material.map = texture;
                this.#material.needsUpdate = true;
            }
        );
    }

    // Returns the world position in which the image UV coordinates are located (positive depth is in front of the board)
    getImageWorldPosition(uv, depth, target) {
        const width = 0.84 * 2;
        const height = 0.63 * 2;
        target.set((uv.x - 0.5) * width, (uv.y - 0.5) * height, depth);
        return this.#whiteboard.localToWorld(target);
    }

    getAngleDegrees() {
        return this.#angleDegrees;
    }

    spin(newAngleDegrees) {
        this.#angleDegrees = newAngleDegrees;
    }

    focus(uv) {
        this.#focusing = true;
        this.#focusUV.copy(uv);
    }

    clearFocus() {
        this.#focusing = false;
    }
}
