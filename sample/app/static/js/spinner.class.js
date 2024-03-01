import ModelManager from './modelmanager.class.js';

// A simple example class
export default class Spinner {
    // Declare private members
    #model = null;

    constructor(context) {
        // Load the susanne model and add a copy to the scene
        this.#model = ModelManager.getModel('susanne.glb').scene.clone();

        context.scene.add(this.#model);
    }

    update(context) {
        // Spin the model
        this.#model.rotateY(context.elapsedSeconds);
    }
}
