FROM us-docker.pkg.dev/vertex-ai/training/pytorch-gpu.2-1.py310:latest

WORKDIR /app

# Upgrade pip
RUN pip install --upgrade pip

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy training script
COPY task.py .

# Entry point
ENTRYPOINT ["python", "task.py"]
