import json
import requests
import secrets
import threading
import webbrowser

from io import BytesIO
from flask import Flask, request, abort, jsonify, send_file
from flask_cors import CORS
from PIL import Image, ImageDraw
from termcolor import cprint

PRINT_COLOR = 'light_blue'

class WebServer:
    '''A web server class for serving static files and handling API calls.'''

    def __init__(self, context):
        self._context = context

        self._server_thread = None

        localhost_only = context.config.getboolean('webserver', 'localhost_only')

        self._host = '127.0.0.1' if localhost_only else '0.0.0.0'
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

        # HTTP route handlers
        
        @self._server.route('/')
        def handle_index():
            return self._server.send_static_file('index.html')
        
        @self._server.route('/pdf_image')
        def pdf_image():
            # Parse the bboxes string to a list
            bboxes_str = request.args.get('bboxes', '[]')
            try:
                bboxes = json.loads(bboxes_str.replace("'", '"'))
            except json.JSONDecodeError:
                return 'Invalid format for bboxes.', 400

            # Copy the original image
            image = context.searchable_pdf.pdf.image.copy()

            # Draw the bounding boxes
            draw = ImageDraw.Draw(image)
            for bbox in bboxes:
                x_min, y_min, x_max, y_max = bbox
                width = x_max - x_min
                height = y_max - y_min
                draw.rectangle([x_min, y_min, x_max, y_max], outline='blue', width=2)

            # Check if the image is in landscape mode (width > height)
            if image.width > image.height:
                # Rotate the image to make it portrait
                image = image.rotate(90, expand=True)
            
            # Stream the image bytes as a response

            image_bytes = BytesIO()
            image.save(image_bytes, 'PNG')
            image_bytes.seek(0)

            return send_file(image_bytes, mimetype='image/png')

        # print("The image is saved as ", self._searchable_pdf.pdf.image)

        @self._server.route('/ask', methods=['POST'])
        def handle_message():
            # Default to empty string if not provided
            query = request.data.decode('utf-8') if request.data else ''

            # Don't log requests due to privacy
            #cprint(f'WebServer: we are asking: {query}', PRINT_COLOR)

            result = context.searchable_pdf.query(query)

            return jsonify(result)

    def start_server(self):
        '''Starts the web server on a separate thread for non-blocking operations.'''

        self._server_thread = threading.Thread(target=self._run)
        self._server_thread.start()

        cprint(f'WebServer: Webserver started at URL http://{self._host}:{self._port}', PRINT_COLOR)

    def _run(self):
        '''The internal method to run the Flask app.'''

        self._server.run(host=self._host, port=self._port, debug=False, use_reloader=False)

    def stop_server(self):
        '''Stop the web server by making a shutdown request via HTTP.'''

        requests.get(f'http://{self._host}:{self._port}/shutdown')

    def open_page(self):
        '''Open the web server's main page in the default web browser.'''

        cprint('WebServer: Opening web page...', PRINT_COLOR)

        webbrowser.open_new(f'http://{self._host}:{self._port}')
