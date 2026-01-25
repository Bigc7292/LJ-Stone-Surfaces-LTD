import os
from google.cloud import aiplatform

PROJECT_ID = "lj-stone-ltd-94543747-b28d3"
REGION = "us-central1"
BUCKET_NAME = "lj-stone-vertex-data"
REPOSITORY = "stone-images" # This is the folder we created in Artifact Registry
APP_NAME = "lj-stone-trainer"

# UPDATED: Using the us-central1 Artifact Registry path
IMAGE_URI = f"{REGION}-docker.pkg.dev/{PROJECT_ID}/{REPOSITORY}/{APP_NAME}:latest"

def submit_job():
    print(f"🚀 Submitting Custom Job to Vertex AI...")
    print(f"    Project: {PROJECT_ID}")
    print(f"    Image Path: {IMAGE_URI}")
    
    # Initialize Vertex AI SDK
    aiplatform.init(
        project=PROJECT_ID, 
        location=REGION,
        staging_bucket=f"gs://{BUCKET_NAME}"
    )

    # Define the Custom Training Job
    job = aiplatform.CustomContainerTrainingJob(
        display_name="lj-stone-fine-tune-pipeline-test",
        container_uri=IMAGE_URI,
    )

    # Note: Running with n1-standard-4 (4 CPUs). 
    # If you need GPU later, add: 
    # accelerator_type="NVIDIA_TESLA_T4", accelerator_count=1
    MACHINE_TYPE = "n1-standard-4"
    
    print(f"⏳ Submitting job with machine type: {MACHINE_TYPE}...")
    
    # Submit the job
    try:
        job.run(
            args=["--bucket-name", BUCKET_NAME, "--epochs", "5"],
            replica_count=1,
            machine_type=MACHINE_TYPE,
            sync=False 
        )
        print(f"✅ Job submitted successfully.")
        print(f"🔍 Check console for progress: https://console.cloud.google.com/vertex-ai/training/custom-jobs?project={PROJECT_ID}")
    except Exception as e:
        print(f"❌ Job submission failed: {e}")

if __name__ == "__main__":
    submit_job()