import * as THREE from './lib/three.js/three.module.js';
import { CCDIKSolver } from './lib/three.js/CCDIKSolver.js';

export default class HumanIK {
    // Declare private members
    #ikSolvers = null;
    
    // Declare public members
    ikTarget = null;
    ikFactor = 1;
    ikDamping = 0.2;

    constructor(context, rig) {
        // Get all skinned meshes (skeleton-driven mesh) in the rig
        const skinnedMeshes = rig.children.filter(obj => obj.isSkinnedMesh);
        
        // Create a unique IK solver for each skinned mesh (meshes may have different skeletons)
        this.#ikSolvers = skinnedMeshes.map(mesh => {
            // Helper function to find bone index in mesh
            const findBone = boneName => {
                const i = mesh.skeleton.bones.findIndex(bone => bone.name === boneName);
                if (i === -1) {
                    throw new Error(`Invalid bone "${boneName}" for mesh "${mesh.name}"`);
                }
                return i;
            };

            // Target bone
            const target = findBone('targetR');
            
            // Store the target bone object for later use
            this.ikTarget = mesh.skeleton.bones[target];
            
            // End effector bone which tries to reach the target bone
            const effector = findBone('pointR');

            // The IK bone chain excluding the end effector
            const linkIndices = ['handR', 'forearmR', 'upper_armR'].map(boneName => findBone(boneName));
            
            // Define limits for the links (comments from the perspective of your right arm)
            const d2r = Math.PI / 180;
            
            const linkRotationMin = [
                // Wrist limits (rotate right, rotate CCW, rotate up)
                new THREE.Vector3(-10 * d2r, -20 * d2r, -50 * d2r),
                // Forearm limits (rotate right, rotate CCW, rotate up, usually minimal to none for twist)
                new THREE.Vector3(0 * d2r, -60 * d2r, 1 * d2r),
                // Upper arm limits (rotate right, rotate CCW, rotate up)
                new THREE.Vector3(0 * d2r, -90 * d2r, 0 * d2r),
            ];
            const linkRotationMax = [
                // Wrist limits (rotate left, rotate CW, rotate down)
                new THREE.Vector3(10 * d2r, 20 * d2r, 50 * d2r),
                // Forearm limits (rotate left, rotate CW, rotate down, usually minimal to none for twist)
                new THREE.Vector3(0 * d2r, 60 * d2r, 160 * d2r),
                // Upper arm limits (rotate left, rotate CW, rotate down)
                new THREE.Vector3(80 * d2r, -30 * d2r, 80 * d2r),
            ];
            
            // Create link objects for IK chain
            const links = linkIndices.map((index, i) => ({
                index,
                rotationMin: linkRotationMin[i],
                rotationMax: linkRotationMax[i],
            }));

            // Get the bones for use in update
            const bones = [effector, ...linkIndices].map(i => {
                const bone = mesh.skeleton.bones[i];

                // Used to temporarily store poses
                bone.originalQuaternion = bone.quaternion.clone();
                bone.fkQuaternion = bone.quaternion.clone();
                bone.ikQuaternion = bone.quaternion.clone();

                return bone;
            });

            // Create a solver with the IK chains
            return new CCDIKSolver(mesh, [{
                iteration: 5, // The number of iterations to run per solve
                target,
                effector,
                links,
                bones,
            }]);
        });
    }

    update(context) {
        if (this.ikFactor <= 0) {
            return;
        }

        // Apply inverse kinematics
        this.#ikSolvers.forEach(solver => {
            solver.iks.forEach(ik => {
                ik.bones.forEach(bone => {
                    // Save the Forward Kinematics pose (animation)
                    bone.fkQuaternion.copy(bone.quaternion);
                    
                    // Reset the IK-affected bones back to the default pose
                    bone.quaternion.copy(bone.originalQuaternion);
                });
            });
            
            // Solve the IK chains
            solver.update();
            
            solver.iks.forEach(ik => {
                ik.bones.forEach(bone => {
                    // Smoothly interpolate from the last IK pose towards the solved IK pose
                    bone.ikQuaternion.slerp(bone.quaternion, 1 - Math.pow(this.ikDamping, context.elapsedSeconds));
                    
                    // Interpolate between the FK and IK poses
                    bone.quaternion.copy(bone.fkQuaternion).slerp(bone.ikQuaternion, this.ikFactor);
                });
            });
        });
    }
}
