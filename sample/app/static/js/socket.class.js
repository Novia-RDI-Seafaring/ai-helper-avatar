import { io } from './lib/socket.io.esm.min.js';

export default class Socket extends EventTarget {
    // Declare private members
    #socket = null;

    constructor() {
        // Call the constructor of the parent class (EventTarget is used for event throwing)
        super();

        // Initialize the Socket.IO client
        this.#socket = io('/', {
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
        });

        // Event listener for when the socket connects successfully
        this.#socket.on('connect', this.#handleConnect.bind(this));

        // Event listener for handling socket disconnections
        this.#socket.on('disconnect', this.#handleDisconnect.bind(this));

        // Event listeners for specific Socket.IO namespaces
        this.#socket.on('test', this.#handleMessageTest.bind(this));
    }

    #handleConnect() {
        console.info('Socket.IO: Socket connected');

        this.dispatchEvent(new CustomEvent('connected'));
    }

    #handleDisconnect(reason) {
        console.warn('Socket.IO: Socket disconnected', reason);

        this.dispatchEvent(new CustomEvent('disconnected'));

        // Attempt to reconnect if the server disconnects the socket
        if (reason === 'io server disconnect') {
            this.#socket.connect();
        }
    }

    #handleMessageTest(data) {
        // Dispatch the "test" event from this class
        this.dispatchEvent(new CustomEvent('test', { detail: data }));

        // Emit a reply in the "test_reply" namespace
        this.#socket.emit('test_reply', { 'data': 'some_data' });
    }
}
