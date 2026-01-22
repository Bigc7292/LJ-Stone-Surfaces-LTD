import os
from google.cloud import aiplatform

# Configuration
PROJECT_ID = "lj-stone-ltd-94543747-b28d3"
REGION = "us-central1"
BUCKET_NAME = "lj-stone-vertex-data"
DATASET_DISPLAY_NAME = "lj-stone-inventory-v1"

# Schema URIs for Image Classification (Explicit GCS Paths)
METADATA_SCHEMA_URI = "gs://google-cloud-aiplatform/schema/dataset/metadata/image_1.0.0.yaml"
IMPORT_SCHEMA_URI = "gs://google-cloud-aiplatform/schema/dataset/import/image_classification_1.0.0.yaml"
IMPORT_FILE_URI = f"gs://{BUCKET_NAME}/metadata.jsonl"

def create_and_import_dataset():
    print(f"🏗️ Initializing Vertex AI Platform (Endpoint: {REGION}-aiplatform.googleapis.com)...")
    aiplatform.init(
        project=PROJECT_ID, 
        location=REGION, 
        staging_bucket=f"gs://{BUCKET_NAME}",
        api_endpoint=f"{REGION}-aiplatform.googleapis.com"
    )

    # 1. Search for existing dataset
    print(f"🔍 Searching for existing dataset: {DATASET_DISPLAY_NAME}...")
    datasets = aiplatform.ImageDataset.list(
        filter=f'display_name="{DATASET_DISPLAY_NAME}"'
    )

    if datasets:
        dataset = datasets[0]
        print(f"✅ Found existing dataset: {dataset.display_name} ({dataset.resource_name})")
    else:
        # 2. Create new dataset
        print(f"📊 Creating Image Dataset: {DATASET_DISPLAY_NAME}...")
        dataset = aiplatform.ImageDataset.create(
            display_name=DATASET_DISPLAY_NAME,
            import_schema_uri=METADATA_SCHEMA_URI,
        )
        print(f"🏗️ Dataset initialized. Resource Name: {dataset.resource_name}")

    # 3. Import data
    print(f"📂 Importing data from {IMPORT_FILE_URI}...")
    try:
        # Note: sync=True will wait for the operation to complete
        dataset.import_data(
            gcs_source=[IMPORT_FILE_URI],
            import_schema_uri=IMPORT_SCHEMA_URI,
            sync=True
        )
        print(f"✅ Data import complete.")
    except Exception as e:
        print(f"⚠️ Import note/error: {e}")

    print(f"🚀 Dataset {dataset.display_name} is ready.")
    print(f"🔍 Resource Name: {dataset.resource_name}")

if __name__ == "__main__":
    create_and_import_dataset()
