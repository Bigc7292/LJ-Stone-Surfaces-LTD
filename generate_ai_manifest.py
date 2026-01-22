import os
import json

HUB = r"C:\Users\toplo\Desktop\ai_stuff\clients\jack_davis_big_jack\LJ-Stone-Surfaces-LTD\data_science\training_hub"
MANIFEST_PATH = os.path.join(HUB, "training_manifest.jsonl")

def create_manifest():
    print("🧠 Generating AI Intelligence Manifest...")
    
    if not os.path.exists(HUB):
        print(f"❌ Error: HUB folder not found at {HUB}")
        return

    manifest_data = []
    
    # Walk through the hub to find all moved assets
    for root, dirs, files in os.walk(HUB):
        for file in files:
            if file.lower().endswith(('.jpg', '.png', '.jpeg')):
                # Determine category based on folder name
                category = "Stone Surface"
                if "marble" in root.lower(): category = "Premium Marble"
                elif "granite" in root.lower(): category = "Architectural Granite"
                elif "onyx" in root.lower(): category = "Luxury Onyx"
                elif "public" in root.lower(): category = "Portfolio Installation"
                
                # Create a professional secret label
                clean_name = file.replace("_", " ").split(".")[0]
                secret_label = f"LJ Stone {category}: {clean_name} - High-End Architectural Grade"
                
                entry = {
                    "file": file,
                    "type": category,
                    "secret_label": secret_label,
                    "path": os.path.relpath(os.path.join(root, file), HUB)
                }
                manifest_data.append(entry)

    # Write the JSONL file
    with open(MANIFEST_PATH, 'w') as f:
        for entry in manifest_data:
            f.write(json.dumps(entry) + "\n")

    print(f"✅ Success! Created manifest with {len(manifest_data)} intelligence points.")
    print(f"📍 Location: {MANIFEST_PATH}")

if __name__ == "__main__":
    create_manifest()