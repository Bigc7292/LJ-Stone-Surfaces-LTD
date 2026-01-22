import os
import json

HUB = r"./data_science/training_hub"
MANIFEST = os.path.join(HUB, "training_manifest.jsonl")

def rank_data():
    print("🥇 Ranking Data: Identifying Jack's Work vs. Material Reference...")
    
    updated_entries = []
    with open(MANIFEST, 'r') as f:
        for line in f:
            item = json.loads(line)
            path = item['path'].lower()
            
            # Logic: If it's in the portfolio folder, it's 'Primary' (Jack's Work)
            # If it's from the textures folder, it's 'Reference' (High Quality Data)
            if "portfolio" in path or "whatsapp" in path:
                item['data_rank'] = "PRIMARY_BRAND_SOUL"
                item['weight'] = 1.0  # High importance for style
            else:
                item['data_rank'] = "MATERIAL_REFERENCE"
                item['weight'] = 0.5  # Used for texture detail, not layout
                
            updated_entries.append(item)

    with open(MANIFEST, 'w') as f:
        for entry in updated_entries:
            f.write(json.dumps(entry) + "\n")

    print(f"✅ Data Ranked. AI will now prioritize Jack's portfolio for 'The Look'.")

if __name__ == "__main__":
    rank_data()