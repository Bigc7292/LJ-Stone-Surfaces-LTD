FROM us-docker.pkg.dev/vertex-ai/training/pytorch-gpu.2-1.py310:latest

WORKDIR /app

# Upgrade pip
RUN pip install --upgrade pip

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# THE CRITICAL FIX: Overwrite the bad NumPy version
# This command runs AFTER the other installs to ensure 1.26.4 is the winner.
RUN pip install --no-cache-dir --force-reinstall numpy==1.26.4

# Copy training script
COPY task.py .

# Entry point
ENTRYPOINT ["python", "task.py"]
