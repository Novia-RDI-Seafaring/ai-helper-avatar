# Python + Three.JS based web application

The following sample demonstrates how to use a Flask server to build a simple three-dimensional web application using THREE.js. Real-time communication is faciliated by websockets through the Socket.IO library.


## Running the demo
We need to also install the other library.

```pip install git+https://github.com/Novia-RDI-Seafaring/pdf-data-extractor.git```

The OPENAI_API_KEY needs to be an environemtnal variable, and easy way to do it is by rynning the server like this:

add it to your .env file (in sample/app)
```cp env.example.txt .env```

Then you can query the PDF via the GET endpoint

```http://127.0.0.1:7860/ask?query=what+is+the+max+temp+of+side+1```
