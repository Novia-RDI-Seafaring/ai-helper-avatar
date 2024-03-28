import ModelManager from './modelmanager.class.js';

import Avatar from './avatar.class.js';
import Lighting from './lighting.class.js';
import Prompt from './prompt.class.js';
import Whiteboard from './whiteboard.class.js';

import * as THREE from './lib/three.js/three.module.js';
import { FlyControls } from './lib/three.js/FlyControls.js';

export default class App {
    // Static constructor
    static _init() {
        // After the window loads, pre-load all content and start the app
        window.addEventListener('load', () => {
            ModelManager.asyncLoadGltfModels(['Avatar02.glb'])
            .then(() => {
                // Instantiate the application.
                new App();
            });
        });
    }

    // Timestep min and max seconds
    static #ELAPSED_SECONDS_MIN = 0.0001;
    static #ELAPSED_SECONDS_MAX = 1;

    // Declare private members
    #context = null;
    #avatar = null;
    #prompt = null;
    #flyControls = null;
    #lastTime = null;
    #helper = null;

    constructor() {
        // Create the application context (better than relying on singletons)
        this.#context = {
            app: this,
            elapsedSeconds: 0,
            totalSeconds: 0,
        };

        // Setup Three.JS renderer and scene
        this.#setupThreeJs();

        // Create the prompt
        this.#context.prompt = new Prompt(this.#context);

        // Create an avatar
        this.#context.avatar = new Avatar(this.#context);

        // Create the whiteboard
        this.#context.whiteboard = new Whiteboard(this.#context);

        // Create lighting for the scene
        this.#context.lighting = new Lighting(this.#context);

        // For calculating delta time
        this.#lastTime = null;

        // Initial resize
        this.#handleResize();

        // Simulate messages
        /*setTimeout(() => this.#context.avatar.handleMessage(this.#context, {
            status: 'success',
            focus_point: [0.9, 0.1],
            direction: 180,
        }), 3000);

        setTimeout(() => this.#context.avatar.handleMessage(this.#context, {
            status: 'success',
            focus_point: [0.2, 0.2],
            direction: 90,
        }), 6000);

        setTimeout(() => this.#context.avatar.handleMessage(this.#context, {
            status: 'success',
            focus_point: [0.1, 0.9],
            direction: null,
        }), 9000);

        setTimeout(() => this.#context.avatar.handleMessage(this.#context, {
            status: 'success',
            focus_point: [0.3, 0.5],
            direction: 0,
        }), 12000);

        setTimeout(() => this.#context.avatar.handleMessage(this.#context, {
            status: 'success',
            direction: null,
        }), 15000);*/
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

        // Add tonemapping
        renderer.toneMapping = THREE.ReinhardToneMapping;
        renderer.toneMappingExposure = 1.8;

        // Add shadowmap
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Setup main loop
        renderer.setAnimationLoop(this.#update.bind(this));

        // Add an event listener to handle window resize events
        window.addEventListener('resize', this.#handleResize.bind(this));

        // Create the main scene object
        const scene = new THREE.Scene();
        this.#context.scene = scene;

        // Create a typical perspective camera
        this.#context.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 10);
        this.#context.camera.position.set(-.45, 1.6, 1.15)
        this.#context.camera.rotation.set(-.10, 0, 0);

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
        const dt = Math.max(App.#ELAPSED_SECONDS_MIN, Math.min(App.#ELAPSED_SECONDS_MAX,
            this.#lastTime === null ? 0 : (time - this.#lastTime) / 1000));
        this.#lastTime = time;

        this.#context.elapsedSeconds = dt;
        this.#context.totalSeconds += dt;

        // Update avatar
        this.#context.avatar.update(this.#context);

        // Update whiteboard
        this.#context.whiteboard.update(this.#context);

        // Update fly controls
        // this.#flyControls.update(dt);

        // Render the scene using the camera
        this.#context.renderer.render(this.#context.scene, this.#context.camera);
    }
}

// Initialize the application
App._init();
