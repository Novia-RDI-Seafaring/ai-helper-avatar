import { GLTFLoader } from './lib/three.js/GLTFLoader.js';

// The ModelManager class is a helper for loading models
export default class ModelManager {
    // Models by model name
    static #models = new Map();

    // Load an array of models from GLTF and return a promise
    static asyncLoadGltfModels(filenames) {
        const loader = new GLTFLoader();

        return Promise.all(filenames.map(filename => {
            const url = `./models/${filename}?time=${new Date().getTime()}`;

            return new Promise((resolve, reject) => {
                loader.load(url, model => {
                    ModelManager.#models.set(filename, model);

                    resolve();
                }, undefined, () => {
                    reject(new Error(`Error loading model file "${url}"`));
                });
            });
        }));
    }

    // Get a loaded model
    static getModel(filename) {
        const model = ModelManager.#models.get(filename);
        if (model === undefined) {
            throw new Error(`Model "${filename}" does not exist`);
        }
        return model;
    }
}
