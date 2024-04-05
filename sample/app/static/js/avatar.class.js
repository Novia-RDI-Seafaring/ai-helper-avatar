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
    #pointing = false;
    #pointUV = new THREE.Vector2();
    #stillThinking = false;

    constructor(context) {
        // Get the avatar GLTF scene
        const gltf = ModelManager.getModel('Avatar26.glb');
        gltf.scene.traverse(function (child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        // Get the rig and add it to the scene
        this.#rig = gltf.scene.getObjectByName('Rig');
        this.#rig.rotation.set(0, -0.3, 0);
        context.scene.add(this.#rig);

        // Save animations
        this.#animations = gltf.animations;

        // Create an animation mixer for the rig
        this.#mixer = new THREE.AnimationMixer(this.#rig);
        this.#mixer.addEventListener('finished', e => {
            if (e.action.finishedCallback !== null) {
                e.action.finishedCallback();
            }
        });

        // Add human inverse kinematics
        this.#ik = new HumanIK(context, this.#rig);

        // Schedule animations
        this.playAnimation('Welcome');
    }

    update(context) {
        // Update action clip (animation)
        this.#mixer.update(context.elapsedSeconds);

        // Smoothly enable/disable inverse kinematics
        if (this.#pointing) {
            this.#ik.ikFactor = Math.min(1, this.#ik.ikFactor + context.elapsedSeconds * 2);
        } else {
            this.#ik.ikFactor = Math.max(0, this.#ik.ikFactor - context.elapsedSeconds * 2);
        }

        if (this.#ik.ikFactor > 0) {
            // Get world point position
            context.whiteboard.getImageWorldPosition(this.#pointUV, -0.1, this.#ik.ikTarget.position);

            // Convert world to a local point position
            this.#ik.ikTarget.parent.worldToLocal(this.#ik.ikTarget.position);
        }

        // Update IK
        this.#ik.update(context);
    }

    startThinking(context) {
        // Clear pointing
        this.#pointing = false;

        // Clear whiteboard focus
        context.whiteboard.clearFocus();

        // Play a random thinking animation
        this.#stillThinking = true;
        this.playAnimation(`Thinking0${Math.floor(Math.random() * 2) + 1}`, 0.5, false, 1, () => {
            if (this.#stillThinking) {
                this.playAnimation('Idle03', 0.5, true);
            }
        });
    }

    startIdling() {
        this.#stillThinking = false;
        this.playAnimation(`Idle0${Math.floor(Math.random() * 4) + 1}`, 0.5, false, 1, () => {
            this.playAnimation('Idle01', 0.5, false);
        });
    }

    // Handle message
    async handleMessage(context, data) {
        this.#stillThinking = false;
        if (data.status !== 'success') {
            throw new Error(`Error calling API: ${data.status}`);
        }

        // Check if whiteboard needs to spin
        const spin = data.direction !== null && data.direction !== context.whiteboard.getAngleDegrees();

        // Clear pointing
        let pointingLast = this.#pointing;
        this.#pointing = false;

        // Clear whiteboard focus
        context.whiteboard.clearFocus();

        // Stop pointing
        if (pointingLast) {
            this.playAnimation('Idle03');

            await Avatar.#wait(1000);
        }

        // Spin whiteboard
        if (spin) {
            this.playAnimation('WhiteboardCW');

            await Avatar.#wait(100);

            context.whiteboard.spin(data.direction);

            await Avatar.#wait(1000);
        }

        if (data.focus_point) {
            // Start pointing
            this.#pointing = true;

            this.#pointUV.set(data.focus_point[0], data.focus_point[1]);

            // Focus on the whiteboard
            context.whiteboard.focus(this.#pointUV);

            // Play point animation
            this.playAnimation('Idlepoint');
        } else {
            // Start random idea and idle animations
            this.playAnimation(`Idea0${Math.floor(Math.random() * 2) + 2}`, 0.5, false, 1, () => this.startIdling());
        }
    }

    playAnimation(name, crossFadeSeconds = 0.5, loop = false, timeScale = 1, finishedCallback = null) {
        // Find animation
        const animation = this.#animations.find(animation => animation.name === name);
        if (animation === undefined) {
            throw new Error(`Invalid animation "${name}"`);
        }

        // Create action clip for animation
        const action = this.#mixer.clipAction(animation);
        action.finishedCallback = finishedCallback;
        action.timeScale = timeScale;
        action.repetitions = loop ? Infinity : 1;
        action.clampWhenFinished = true;
        action.stop();

        // Cross-fade from last action clip
        if (this.#playingAction !== null) {
            if (crossFadeSeconds > 0) {
                this.#playingAction.crossFadeTo(action, crossFadeSeconds);
            } else {
                this.#playingAction.stop();
            }
        }
        this.#playingAction = action;

        // Play action clip
        action.play();
    }

    // Wait promise
    static #wait(milliseconds){
        return new Promise(resolve => {
            setTimeout(resolve, milliseconds);
        });
    }
}
