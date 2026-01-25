import argparse
import os
import json
import time
import pandas as pd
from google.cloud import storage
import torch

def download_blob(bucket_name, source_blob_name, destination_file_name):
    """Downloads a blob from the bucket."""
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(source_blob_name)
    blob.download_to_filename(destination_file_name)
    print(f"Downloaded {source_blob_name} to {destination_file_name}.")

def upload_blob(bucket_name, source_file_name, destination_blob_name):
    """Uploads a file to the bucket."""
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(destination_blob_name)
    blob.upload_from_filename(source_file_name)
    print(f"Uploaded {source_file_name} to {destination_blob_name}.")

def main(args):
    print("🚀 Starting Training Task...")
    print(f"🔧 Configuration: {args}")

    # Setup directories
    os.makedirs("data/images", exist_ok=True)
    os.makedirs("model_output", exist_ok=True)

    # 1. Download Metadata
    print(f"📥 Downloading metadata from gs://{args.bucket_name}/metadata.jsonl")
    download_blob(args.bucket_name, "metadata.jsonl", "data/metadata.jsonl")

    # 2. Parse Metadata and Download Images
    print("🔍 Parsing metadata and downloading training images...")
    with open("data/metadata.jsonl", 'r') as f:
        lines = f.readlines()

    image_count = 0
    for line in lines:
        entry = json.loads(line)
        gcs_uri = entry.get("imageGcsUri")
        if gcs_uri:
            # Extract blob path from gs://bucket/path
            # URI: gs://lj-stone-vertex-data/training_samples/sample_X.jpg
            parts = gcs_uri.replace("gs://", "").split("/")
            # bucket = parts[0] # Should match args.bucket_name
            blob_path = "/".join(parts[1:])
            filename = parts[-1]
            local_path = f"data/images/{filename}"
            
            try:
                download_blob(args.bucket_name, blob_path, local_path)
                image_count += 1
            except Exception as e:
                print(f"⚠️ Failed to download {gcs_uri}: {e}")

    print(f"✅ Downloaded {image_count} images.")

    # 3. Training Loop (Mock/Placeholder)
    # REPLACE THIS SECTION with actual Diffusers training logic
    # e.g., train_text_to_image_lora.py
    print("🧠 Initializing Model (Mock)...")
    # Simulate loading model
    time.sleep(2) 
    
    print(f"🔄 Starting Training for {args.epochs} epochs...")
    for epoch in range(args.epochs):
        print(f"  Epoch {epoch+1}/{args.epochs}: Loss = {0.5 - (epoch * 0.01):.4f}")
        time.sleep(0.5) # Simulate compute

    # 4. Save Model Artifacts
    print("💾 Saving Model Artifacts...")
    # Create a dummy model file
    with open("model_output/model.safetensors", "w") as f:
        f.write("DUMMY MODEL CONTENT")
    
    # Upload artifacts to GCS
    # Vertex AI Custom Job expects output in specific GCS location if 'base_output_dir' is set,
    # but we can also manually upload to our specific bucket.
    timestamp = int(time.time())
    output_blob_path = f"models/experiment_{timestamp}/model.safetensors"
    upload_blob(args.bucket_name, "model_output/model.safetensors", output_blob_path)
    
    print(f"✅ Training Complete. Model saved to gs://{args.bucket_name}/{output_blob_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--bucket-name", type=str, required=True, help="GCS Bucket Name")
    parser.add_argument("--epochs", type=int, default=5, help="Number of epochs")
    parser.add_argument("--model-dir", type=str, help="Output directory for model (Vertex AI arg)")
    
    args = parser.parse_args()
    main(args)
