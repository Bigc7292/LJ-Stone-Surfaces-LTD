import os
import pandas as pd
import json
from google.cloud import storage

# Configuration
PROJECT_ID = "lj-stone-ltd-94543747-b28d3"
BUCKET_NAME = "lj-stone-vertex-data"
CSV_PATH = r"c:\Users\toplo\Desktop\ai_stuff\clients\jack_davis_big_jack\LJ-Stone-Surfaces-LTD\client\public\exported_replit_data\visualizer_generations.csv"
OUTPUT_JSONL = "metadata.jsonl"

def generate_metadata():
    print(f"📄 Generating metadata.jsonl for Vertex AI...")
    
    df = pd.read_csv(CSV_PATH)
    metadata_entries = []

    for idx, row in df.iterrows():
        gen_id = row['id']
        stone_name = row['stone_selected']
        
        # Path format in GCS: gs://lj-stone-vertex-data/training_samples/sample_{id}.jpg
        gcs_uri = f"gs://{BUCKET_NAME}/training_samples/sample_{gen_id}.jpg"
        
        # Vertex AI Image Classification (Single Label) expects singular "classificationAnnotation"
        entry = {
            "imageGcsUri": gcs_uri,
            "classificationAnnotation": {
                "displayName": stone_name
            }
        }
        metadata_entries.append(entry)

    with open(OUTPUT_JSONL, 'w') as f:
        for entry in metadata_entries:
            f.write(json.dumps(entry) + "\n")
            
    print(f"✅ Metadata generation complete. Saved to {OUTPUT_JSONL}")
    
    # Upload to GCS
    client = storage.Client(project=PROJECT_ID)
    bucket = client.bucket(BUCKET_NAME)
    blob = bucket.blob("metadata.jsonl")
    blob.upload_from_filename(OUTPUT_JSONL)
    print(f"✅ metadata.jsonl uploaded to GCS.")

if __name__ == "__main__":
    generate_metadata()
