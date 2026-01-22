import os
import json

HUB = r"C:\Users\toplo\Desktop\ai_stuff\clients\jack_davis_big_jack\LJ-Stone-Surfaces-LTD\data_science\training_hub"
MANIFEST = os.path.join(HUB, "training_manifest.jsonl")

def deep_tagging():
    print("💎 Deep-Tagging Jack's Portfolio for AI Precision...")
    
    # Vocabulary for the AI
    VOCAB = {
        "KITCHEN_FEATURE": ["island", "breakfast", "counter", "worktop", "top", "bench"],
        "EDGE_DETAIL": ["waterfall", "mitre", "ogee", "bullnose", "chamfer"],
        "COLOR_PROFILE": ["white", "carrara", "calacatta", "grey", "black", "nero", "gold", "vein"]
    }

    updated_entries = []
    with open(MANIFEST, 'r') as f:
        for line in f:
            item = json.loads(line)
            text_to_scan = f"{item['file']} {item['path']}".lower()
            
            # Extract features found in text
            found_features = []
            for category, keywords in VOCAB.items():
                for word in keywords:
                    if word in text_to_scan:
                        found_features.append(word.upper())
            
            # Update the secret label with these expert tags
            tags_str = ", ".join(set(found_features)) if found_features else "ARCHITECTURAL_SURFACE"
            item['expert_tags'] = tags_str
            item['secret_label'] = f"Jack Davis Elite: [{tags_str}] - {item['file']}"
            
            updated_entries.append(item)

    with open(MANIFEST, 'w') as f:
        for entry in updated_entries:
            f.write(json.dumps(entry) + "\n")

    print(f"✅ Success! {len(updated_entries)} assets now have expert architectural tags.")

if __name__ == "__main__":
    deep_tagging()