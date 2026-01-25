# 1. Start with the Vertex AI base
FROM us-docker.pkg.dev/vertex-ai/training/pytorch-gpu.2-1.py310:latest

WORKDIR /app

# 2. Upgrade pip first
RUN pip install --no-cache-dir --upgrade pip

# 3. Copy and install your requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. THE CRITICAL FIX: Overwrite the bad NumPy version
# This command runs AFTER the other installs to ensure 1.26.4 is the winner.
RUN pip install --no-cache-dir --force-reinstall numpy==1.26.4

# 5. Copy your stone intelligence code
COPY . .

# 6. Set the entrypoint
ENTRYPOINT ["python", "task.py"]