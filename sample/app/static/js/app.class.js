import ModelManager from './modelmanager.class.js';

import Socket from './socket.class.js';
import Spinner from './spinner.class.js';

import * as THREE from './lib/three.js/three.module.js';
import { FlyControls } from './lib/three.js/FlyControls.js';

export default class App {
    // Static constructor
    static _init() {
        // After the window loads, pre-load all content and start the app
        window.addEventListener('load', () => {
            ModelManager.asyncLoadGltfModels(['Susanne.glb', 'Avatar01.glb'])
            .then(() => {
                // Instantiate the application.
                new App();
            });
        });
    }

    // Timestep min and max seconds
    static #elapsedSecondsMin = 0.0001;
    static #elapsedSecondsMax = 1;

    // Declare private members
    #context = null;
    #avatar = null;
    #spinner = null;
    #flyControls = null;
    #lastTime = null;

    constructor() {
        // Create the application context (better than relying on singletons)
        this.#context = {
            app: this,
            elapsedSeconds: 0,
            totalSeconds: 0,
        };
        
        // Setup Three.JS renderer and scene
        this.#setupThreeJs();

        // Create the socket
        this.#context.socket = new Socket();

        // Create an example spinner
        this.#spinner = new Spinner(this.#context);

        // Create an avatar
        this.#avatar = new Avatar(this.#context);

        // For calculating delta time
        this.#lastTime = null;

        // Initial resize
        this.#handleResize();
    }

    #setupThreeJs() {
        // Create a WebGL renderer for the canvas
        const renderer = new THREE.WebGLRenderer({
            canvas: document.querySelector('canvas'),
            antialias: true,
            powerPreference: 'high-performance',
            alpha: true,
        });
        this.#context.renderer = renderer;

        // Set the renderer's pixel ratio for high-resolution displays
        renderer.setPixelRatio(window.devicePixelRatio);

        // Set the color encoding for the renderer for the sRGB color space
        renderer.outputEncoding = THREE.sRGBEncoding;

        // Setup main loop
        renderer.setAnimationLoop(this.#update.bind(this));

        // Add an event listener to handle window resize events
        window.addEventListener('resize', this.#handleResize.bind(this));

        // Create the main scene object
        this.#context.scene = new THREE.Scene();

        // Add a simple directional light to the scene
        this.#context.scene.add(new THREE.DirectionalLight(0xffffff, 3));

        // Create a typical perspective camera
        this.#context.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 10);
        this.#context.camera.position.set(0, 2, 5)

        // Create fly controls for easier debugging
        this.#flyControls = new FlyControls(this.#context.camera, renderer.domElement);
        this.#flyControls.movementSpeed = 3;
        this.#flyControls.rollSpeed = Math.PI / 2;
        this.#flyControls.dragToLook = true;
    }

    // Method to update the renderer size when the window is resized
    #handleResize() {
        // Update canvas size
        this.#context.renderer.setSize(window.innerWidth, window.innerHeight);

        // Update camera projection matrix for the new screen dimensions
        this.#context.camera.aspect = window.innerWidth / window.innerHeight;
        this.#context.camera.updateProjectionMatrix();
    }

    // Method called on each frame to update the application's state
    #update(time, frame = null) {
        // Calculate a constrained delta time to avoid extreme values
        const dt = Math.max(App.#elapsedSecondsMin, Math.min(App.#elapsedSecondsMax,
            this.#lastTime === null ? 0 : (time - this.#lastTime) / 1000));
        this.#lastTime = time;

        this.#context.elapsedSeconds = dt;
        this.#context.totalSeconds += dt;

        // Update spinner
        this.#spinner.update(this.#context);

        // Update avatar
        this.#avatar.update(this.#avatar);

        // Update fly controls
        this.#flyControls.update(dt);

        // Render the scene using the camera
        this.#context.renderer.render(this.#context.scene, this.#context.camera);
    }
}

// Initialize the application
App._init();
