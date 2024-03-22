# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Copy the current directory contents into the container at /usr/src/app
COPY . /ai-helper-avatar

# Working dir
WORKDIR /ai-helper-avatar/sample/app/

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Make port 8000 available to the world outside this container
EXPOSE 8000

# Run main.py when the container launches
CMD ["python", "main.py"]
