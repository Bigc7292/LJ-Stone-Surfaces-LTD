import os
import pandas as pd
import base64
import re
import io
from PIL import Image
from google.cloud import storage

# GCP Configuration
PROJECT_ID = "lj-stone-ltd-94543747-b28d3"
BUCKET_NAME = "lj-stone-vertex-data"
CSV_PATH = r"c:\Users\toplo\Desktop\ai_stuff\clients\jack_davis_big_jack\LJ-Stone-Surfaces-LTD\client\public\exported_replit_data\visualizer_generations.csv"
TEXTURES_DIR = r"c:\Users\toplo\Desktop\ai_stuff\clients\jack_davis_big_jack\LJ-Stone-Surfaces-LTD\client\public\textures"
TEMP_DATA_DIR = "temp_training_data"

def extract_base64_image(base64_str, output_path):
    """Extracts base64 image data and saves it to a file."""
    try:
        if not base64_str or not isinstance(base64_str, str):
            return False
        
        # Remove data:image/...;base64, prefix if present
        if "base64," in base64_str:
            base64_str = base64_str.split("base64,")[1]
        
        img_data = base64.b64decode(base64_str)
        img = Image.open(io.BytesIO(img_data))
        img.save(output_path)
        return True
    except Exception as e:
        print(f"Error extracting image to {output_path}: {e}")
        return False

def sync_to_gcs():
    print(f"🚀 Starting Ingestion Pipeline for Project: {PROJECT_ID}")
    
    # 1. Initialize Storage Client
    client = storage.Client(project=PROJECT_ID)
    
    # 2. Ensure Bucket Exists (Attempt to create or get)
    try:
        bucket = client.get_bucket(BUCKET_NAME)
        print(f"✅ Found existing bucket: {BUCKET_NAME}")
    except Exception:
        print(f"📦 Creating new bucket: {BUCKET_NAME}")
        bucket = client.create_bucket(BUCKET_NAME, location="us-central1")

    # 3. Process CSV Ground Truth Data
    print("\n🔍 Processing CSV Ground Truth Data...")
    os.makedirs(os.path.join(TEMP_DATA_DIR, "training_samples"), exist_ok=True)
    df = pd.read_csv(CSV_PATH)
    
    ingested_count = 0
    for idx, row in df.iterrows():
        gen_id = row['id']
        orig_img_b64 = row['original_image_url']
        stone_name = row['stone_selected']
        
        # We only care about rows with valid base64 data
        if isinstance(orig_img_b64, str) and orig_img_b64.startswith("data:image"):
            local_path = os.path.join(TEMP_DATA_DIR, "training_samples", f"sample_{gen_id}.jpg")
            if extract_base64_image(orig_img_b64, local_path):
                # Upload to GCS
                blob = bucket.blob(f"training_samples/sample_{gen_id}.jpg")
                blob.upload_from_filename(local_path)
                # Store metadata for Vertex AI JSONL (placeholder for now)
                ingested_count += 1
    
    print(f"✅ Ingested {ingested_count} training samples from CSV.")

    # 4. Sync Stone Textures
    print("\n💎 Syncing Stone Textures (Core Inventory)...")
    core_categories = ['quartz', 'marble', 'granite']
    texture_count = 0
    
    for cat in core_categories:
        cat_dir = os.path.join(TEXTURES_DIR, cat)
        if not os.path.exists(cat_dir): continue
        
        for root, dirs, files in os.walk(cat_dir):
            for file in files:
                if file.lower().endswith(('.jpg', '.png', '.jpeg', '.webp')) and 'Color' in file:
                    local_file_path = os.path.join(root, file)
                    # Create relative path for GCS
                    rel_path = os.path.relpath(local_file_path, TEXTURES_DIR).replace("\\", "/")
                    blob = bucket.blob(f"products/{rel_path}")
                    blob.upload_from_filename(local_file_path)
                    texture_count += 1

    print(f"✅ Synced {texture_count} core texture assets to GCS.")
    print("\n🎉 GCS Synchronization Complete.")

if __name__ == "__main__":
    sync_to_gcs()
