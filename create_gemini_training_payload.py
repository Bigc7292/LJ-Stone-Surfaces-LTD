import os
import json
import base64

PROCESSED_HUB = r"./data_science/processed_training_set"
MANIFEST_PATH = r"./data_science/training_hub/training_manifest.jsonl"
FINAL_PAYLOAD = r"./data_science/gemini_training_data.jsonl"

def get_base64(path):
    with open(path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def generate_payload():
    print("🚀 Packaging Jack's Intelligence for Gemini training...")
    
    payload_entries = []
    with open(MANIFEST_PATH, 'r') as f:
        for line in f:
            item = json.loads(line)
            img_filename = item['file']
            img_path = os.path.join(PROCESSED_HUB, img_filename)
            
            if not os.path.exists(img_path):
                continue

            # Creating the Multimodal format Google requires:
            # { "contents": [ { "role": "user", "parts": [...] }, { "role": "model", "parts": [...] } ] }
            entry = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [
                            {"text": f"Generate a high-end architectural surface in the style of Jack Davis. Keywords: {item.get('expert_tags', 'Premium Stone')}"}
                        ]
                    },
                    {
                        "role": "model",
                        "parts": [
                            {"text": item['secret_label']},
                            {
                                "inlineData": {
                                    "mimeType": "image/jpeg",
                                    "data": get_base64(img_path)
                                }
                            }
                        ]
                    }
                ]
            }
            payload_entries.append(entry)

    with open(FINAL_PAYLOAD, 'w') as f:
        for entry in payload_entries:
            f.write(json.dumps(entry) + "\n")

    print(f"✅ Success! Created {len(payload_entries)} training examples.")
    print(f"📍 Final File for Upload: {FINAL_PAYLOAD}")

if __name__ == "__main__":
    generate_payload()