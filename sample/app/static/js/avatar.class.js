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

    constructor(context) {
        // Get the avatar GLTF scene
        const gltf = ModelManager.getModel('Avatar02.glb');
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
        
        // Add human inverse kinematics
        this.#ik = new HumanIK(context, this.#rig);
        
        // Schedule animations
        this.playAnimation('Welcome');
    }

    update(context) {
        // Update action clip (animation)
        this.#mixer.update(context.elapsedSeconds);

        // Update IK
        if (this.#pointing) {
            this.#ik.ikFactor = Math.min(1, this.#ik.ikFactor + context.elapsedSeconds * 0.5);
        } else {
            this.#ik.ikFactor = Math.max(0, this.#ik.ikFactor - context.elapsedSeconds);
        }
        this.#ik.update(context);
    }
    
    // Handle answer
    handleAnswer(context, data) {
        if (data.status !== 'success') {
            throw new Error(`Error calling API: ${data.status}`);
        }

        // Check if whiteboard needs to spin
        const spin = data.direction !== null && data.direction !== context.whiteboard.getAngleDegrees();

        let pointingLast = this.#pointing;
        this.#pointing = false;

        // Spin whiteboard
        if (spin) {
            this.playAnimation('WhiteboardCW');
            
            setTimeout(() => {
                context.whiteboard.spin(data.direction);
            }, 3000);
        }
        
        // Wait for whiteboard to spin
        setTimeout(() => {
            if (data.focus_point !== null) {
                // Start pointing at whiteboard
                this.#pointing = true;                
                
                // Get world point position
                context.whiteboard.getImageWorldPosition(data.focus_point[0], data.focus_point[1], -0.1, this.#ik.ikTarget.position);
                
                // Convert world to a local point position
                this.#ik.ikTarget.parent.worldToLocal(this.#ik.ikTarget.position);

                // Play point animation
                this.playAnimation('Idlepoint');
            } else {
                // Start random idle animation
                this.playAnimation(`Idea0${Math.floor(Math.random() * 3) + 1}`);
            }
        }, 3000 * spin);         
    }
    
    playAnimation(name, crossFadeSeconds = 0.5, loop = false) {
        // Find animation
        const animation = this.#animations.find(animation => animation.name === name);
        if (animation === undefined) {
            throw new Error(`Invalid animation "${name}"`);
        }
    
        // Create action clip for animation
        const action = this.#mixer.clipAction(animation);
        if (action === this.#playingAction) {
            return;
        }
        action.setLoop(loop ? THREE.LoopForever : THREE.LoopOnce);
        action.clampWhenFinished = !loop;
    
        // Cross-fade from last action clip
        if (this.#playingAction !== null) {
            this.#playingAction.crossFadeTo(action, crossFadeSeconds);
        }
        this.#playingAction = action;

        // Play action clip
        action.play();
    }
}
