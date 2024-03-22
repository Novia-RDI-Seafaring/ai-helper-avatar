import logging
import requests
import secrets
import threading
import webbrowser

from flask import Flask, request, abort
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from termcolor import cprint

PRINT_COLOR = 'light_blue'

class WebServer:
    '''A web server class for serving static files and handling WebSocket connections.'''

    def __init__(self, context):
        self._context = context

        self._server_thread = None

        self._port = self._context.config.getint('webserver', 'port')

        # Setup the Flask app with static file serving
        self._server = Flask(
            context.config.get('webserver', 'name'),
            static_url_path='/',
            static_folder=context.static_directory
        )

        # Enable CORS for the server to accept requests from different origins
        CORS(self._server)

        # Secure the Flask session with a random secret key
        self._server.config['SECRET_KEY'] = secrets.token_hex(16)

        # Only log errors to console
        log = logging.getLogger('werkzeug')
        log.setLevel(logging.ERROR)

        # Setup SocketIO using 'threading' for asynchronous handling
        self._socketio = SocketIO(self._server, async_mode='threading', cors_allowed_origins='*')

        # Multithreading event flags for signaling when a reply has been received
        self._test_reply_event = threading.Event()

        # HTTP route handlers

        @self._server.route('/')
        def handle_index():
            return self._server.send_static_file('index.html')

        @self._server.route('/shutdown')
        def handle_shutdown():
            if request.remote_addr == '127.0.0.1':
                try:
                    self._socketio.stop()
                except:
                    cprint('Failed to stop server', PRINT_COLOR)
                return 'OK', 200
            else:
                abort(404)

        # Socket.IO handlers

        @self._socketio.on('connect')
        def handle_connect():
            cprint(f'WebServer: Socket.IO client connected ({request.sid})', PRINT_COLOR)

        @self._socketio.on('disconnect')
        def handle_disconnect():
            cprint(f'WebServer: Socket.IO client disconnected ({request.sid})', PRINT_COLOR)

        @self._socketio.on('test_reply')
        def handle_test_reply(data=None):
            cprint('WebServer: Got message on "test_reply" namespace')

            self._test_reply_event.set()

    def send_message_test(self):
        '''Send 'test' to JavaScript via Socket.IO.'''

        self._test_reply_event.clear()

        with self._server.app_context():
            self._socketio.emit('test', { 'data': 'some_data' })

    def wait_for_test_reply(self, timeout=None):
        '''Wait for a reply on the 'test_reply' namespace.'''

        if self._test_reply_event.is_set():
            return
        self._test_reply_event.wait(timeout)

    def start_server(self):
        '''Starts the web server on a separate thread for non-blocking operations.'''

        self._server_thread = threading.Thread(target=self._run)
        self._server_thread.start()

        cprint(f'WebServer: Webserver started at URL http://127.0.0.1:{self._port}', PRINT_COLOR)

    def _run(self):
        '''The internal method to run the Flask app.'''

        self._socketio.run(self._server, host='0.0.0.0', port=self._port, allow_unsafe_werkzeug=True)

    def stop_server(self):
        '''Stop the web server by making a shutdown request via HTTP.'''

        requests.get(f'http://127.0.0.1:{self._port}/shutdown')

    def open_page(self):
        '''Open the web server's main page in the default web browser.'''

        cprint('WebServer: Opening web page...', PRINT_COLOR)

        webbrowser.open_new(f'http://127.0.0.1:{self._port}')
