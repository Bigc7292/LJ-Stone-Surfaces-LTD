import os
import json
from PIL import Image, ImageOps

HUB = r"./data_science/training_hub"
OUTPUT = r"./data_science/processed_training_set"
TARGET_SIZE = (1024, 1024)

def process_library():
    print(f"⚙️ Starting Stage 4: Resizing {TARGET_SIZE[0]}px...")
    os.makedirs(OUTPUT, exist_ok=True)
    
    count = 0
    # Walk through the Hub
    for root, dirs, files in os.walk(HUB):
        for file in files:
            if file.lower().endswith(('.jpg', '.jpeg', '.png')):
                try:
                    img_path = os.path.join(root, file)
                    with Image.open(img_path) as img:
                        # Convert to RGB (removes transparency/alpha channels that crash training)
                        img = img.convert("RGB")
                        
                        # Resize and Pad (keeps aspect ratio)
                        # This fills empty space with black/white so the stone isn't distorted
                        img.thumbnail(TARGET_SIZE, Image.Resampling.LANCZOS)
                        
                        # Create a square canvas
                        new_img = Image.new("RGB", TARGET_SIZE, (255, 255, 255))
                        # Center the image on the square canvas
                        upper_left = (
                            (TARGET_SIZE[0] - img.size[0]) // 2,
                            (TARGET_SIZE[1] - img.size[1]) // 2
                        )
                        new_img.paste(img, upper_left)
                        
                        # Save to processed folder
                        # We use a flat structure for the trainer, but keep the name
                        save_path = os.path.join(OUTPUT, file)
                        new_img.save(save_path, "JPEG", quality=95)
                        count += 1
                        
                        if count % 100 == 0:
                            print(f"✅ Processed {count} images...")
                            
                except Exception as e:
                    print(f"⚠️ Skipping {file}: {e}")

    print(f"\n✨ DONE! {count} images standardized in {OUTPUT}")

if __name__ == "__main__":
    process_library()