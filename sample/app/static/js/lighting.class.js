import * as THREE from './lib/three.js/three.module.js';

export default class Lighting {
    #keyLight;
    #backLight;
    #hemiLight;

    constructor(context, intensity = 1) {
        const scene = context.scene;
        
        this.#hemiLight = new THREE.HemisphereLight(0xffeeb1, 0x080820, 4)
        scene.add(this.#hemiLight);

        // Key light
        this.#keyLight = new THREE.DirectionalLight(0xffffff, intensity * 3);
        this.#keyLight.position.set(10, 10, 10);
        this.#keyLight.castShadow = true;
        this.#keyLight.receiveShadowShadow = true;
        // Additional shadow configuration for the key light
        const size = 10;
        this.#keyLight.shadow.camera.left = -size;
        this.#keyLight.shadow.camera.right = size;
        this.#keyLight.shadow.camera.top = size;
        this.#keyLight.shadow.camera.bottom = -size;
        this.#keyLight.shadow.camera.near = 0.1;
        this.#keyLight.shadow.camera.far = 50;
        this.#keyLight.shadow.mapSize.width = 2048;
        this.#keyLight.shadow.mapSize.height = 2048;
        scene.add(this.#keyLight);

        // Back light
        this.#backLight = new THREE.DirectionalLight(0xffffff, intensity * 0.2);
        this.#backLight.position.set(0, -10, -10);
        scene.add(this.#backLight);
    }

    // Method to adjust the intensity of all lights
    setIntensity(intensity) {
        this.#keyLight.intensity = intensity * 3;
        this.#backLight.intensity = intensity * 0.5;
    }

    // Method to update the position of the lights, if needed
    updatePositions(keyPosition = null, backPosition = null) {
        if (keyPosition !== null) {
            this.#keyLight.position.copy(keyPosition);
        }
        if (backPosition !== null) {
            this.#backLight.position.copy(backPosition);
        }
    }    
}
