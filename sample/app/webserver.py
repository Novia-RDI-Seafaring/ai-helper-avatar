import logging
import requests
import secrets
import threading
import webbrowser

from flask import Flask, request, abort, jsonify
from flask_cors import CORS
from termcolor import cprint

from searchable_pdf import SearchablePDF

PRINT_COLOR = 'light_blue'

class WebServer:
    '''A web server class for serving static files and handling API calls.'''

    def __init__(self, context):
        self._context = context

        # Create searchable PDF instance
        self._searchable_pdf = SearchablePDF('path/to/the/file.pdf', "the schema as string...")

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

        # HTTP route handlers

        @self._server.route('/')
        def handle_index():
            return self._server.send_static_file('index.html')

        @self._server.route('/ask', methods=['GET'])
        def handle_message():
            query = request.args.get('query', '') # Default to empty string if not provided
            result = self._searchable_pdf.query(query)
            return jsonify(result)

        @self._server.route('/shutdown')
        def handle_shutdown():
            if request.remote_addr == '127.0.0.1':
                try:
                    self._server.stop()
                except:
                    cprint('Failed to stop server', PRINT_COLOR)
                return 'OK', 200
            else:
                abort(404)

    def start_server(self):
        '''Starts the web server on a separate thread for non-blocking operations.'''

        self._server_thread = threading.Thread(target=self._run)
        self._server_thread.start()

        cprint(f'WebServer: Webserver started at URL http://127.0.0.1:{self._port}', PRINT_COLOR)

    def _run(self):
        '''The internal method to run the Flask app.'''

        self._server.run(host='127.0.0.1', port=self._port)

    def stop_server(self):
        '''Stop the web server by making a shutdown request via HTTP.'''

        requests.get(f'http://127.0.0.1:{self._port}/shutdown')

    def open_page(self):
        '''Open the web server's main page in the default web browser.'''

        cprint('WebServer: Opening web page...', PRINT_COLOR)

        webbrowser.open_new(f'http://127.0.0.1:{self._port}')
