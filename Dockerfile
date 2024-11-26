# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Copy the current directory contents into the container at /usr/src/app
COPY . /ai-helper-avatar

# Working dir
WORKDIR /ai-helper-avatar/sample/app/

# Update the package lists, install git, and clean up in one RUN statement to keep the image size small
RUN apt-get update && \
    apt-get install -y git && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install custom pdf query library
RUN pip install git+https://github.com/Novia-RDI-Seafaring/pdf-data-extractor.git

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Make port 7860 available to the world outside this container
EXPOSE 7860

# Run main.py when the container launches
CMD ["python", "main.py"]
