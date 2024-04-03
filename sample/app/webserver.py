import logging
import requests
import secrets
import threading
import webbrowser
import os

import json
from PIL import Image, ImageDraw

from flask import Flask, request, abort, jsonify, send_file
from flask_cors import CORS
from termcolor import cprint

from pdf_data_extractor import SearchablePDF
from io import BytesIO

PRINT_COLOR = 'light_blue'

class WebServer:
    '''A web server class for serving static files and handling API calls.'''

    def __init__(self, context):
        self._context = context


        # print("This is from the Webserver ", self._searchable_pdf.pdf.image)
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
        # HTTP route handlers
        
        @self._server.route('/')
        def handle_index():
            return self._server.send_static_file('index.html')
        
        @self._server.route('/pdf_image')
        def pdf_image():
            original_img = context.searchable_pdf.pdf.image
            print(original_img.size)
            img_bytes = BytesIO()
            original_img.save(img_bytes, format='PNG')  # Use the appropriate format (e.g., 'JPEG', 'PNG')
            img_bytes.seek(0)
            cloned_img = Image.open(img_bytes)

            bboxes_str = request.args.get('bboxes', '[]')
            try:
                # Parse the bboxes string to a Python list
                bboxes = json.loads(bboxes_str.replace("'", '"'))
                draw = ImageDraw.Draw(cloned_img)
                for bbox in bboxes:
                    x_min, y_min, x_max, y_max = bbox
                    width = x_max - x_min
                    height = y_max - y_min
                    draw.rectangle([x_min, y_min, x_max, y_max], outline='blue', width=2)

            except json.JSONDecodeError:
                return "Invalid format for bboxes.", 400


            # Check if the image is in landscape mode (width > height)
            if cloned_img.width > cloned_img.height:
                # Rotate the image to make it portrait
                cloned_img = cloned_img.rotate(90, expand=True)
            
            cloned_img_io = BytesIO()
            cloned_img.save(cloned_img_io, 'PNG')
            cloned_img_io.seek(0)
            return send_file(cloned_img_io, mimetype='image/png')

        # print("The image is saved as ", self._searchable_pdf.pdf.image)

        @self._server.route('/ask', methods=['GET'])
        def handle_message():
            # Default to empty string if not provided
            query = request.args.get('query', '')
            cprint(f'WebServer: we are asking: {query}', PRINT_COLOR)

            result = context.searchable_pdf.query(query)

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

        self._server.run(host='127.0.0.1', port=self._port, debug=False, use_reloader=False)

    def stop_server(self):
        '''Stop the web server by making a shutdown request via HTTP.'''

        requests.get(f'http://127.0.0.1:{self._port}/shutdown')

    def open_page(self):
        '''Open the web server's main page in the default web browser.'''

        cprint('WebServer: Opening web page...', PRINT_COLOR)

        webbrowser.open_new(f'http://127.0.0.1:{self._port}')
