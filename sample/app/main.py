import configparser
import json
import os
import sys
import time

from types import SimpleNamespace

from pdf_data_extractor import SearchablePDF
from webserver import WebServer

# Check Python version to ensure compatibility
class UnsupportedVersion(Exception):
    pass

MIN_VERSION, VERSION_LESS_THAN = (3, 5), (4, 0)
if sys.version_info < MIN_VERSION or sys.version_info >= VERSION_LESS_THAN:
    raise UnsupportedVersion('requires Python %s,<%s' % ('.'.join(map(str, MIN_VERSION)), '.'.join(map(str, VERSION_LESS_THAN))))

# Initialize a simple namespace object to hold the application context
context = SimpleNamespace()

# Define common paths
context.script_directory = os.path.dirname(os.path.abspath(__file__))
context.static_directory = os.path.join(context.script_directory, 'static')
context.data_directory = os.path.join(context.script_directory, 'data')

# Load configuration from 'config.ini'
config_path = os.path.join(context.script_directory, 'config.ini')

context.config = configparser.ConfigParser()
context.config.read(config_path)

# Create searchable PDF instance

pdf_path = os.path.join(context.static_directory, 'demo_data/he-specification.pdf')
json_path = os.path.join(context.static_directory, 'demo_data/he-specification.json')
json_schema_path = os.path.join(context.static_directory, 'demo_data/he-specification_schema.json')

with open(json_path) as f:
    json_value_string = json.dumps(json.load(f))

with open(json_schema_path) as f:    
    json_schema_string = json.dumps(json.load(f))

context.searchable_pdf = SearchablePDF(
    pdf_path,
    json_value_string,
    json_schema_string
)

# Create the webserver
context.webserver = WebServer(context)

# Start the web server and open the default web page
context.webserver.start_server()
context.webserver.open_page()

print('Press ctrl-c to quit')

# Main loop to keep the application running
try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print('Quitting...')

# Cleanup and shutdown procedures
context.webserver.stop_server()

time.sleep(1)

print('Program stopped')
