import os
import json
import pathlib
import re

def clean_stone_name(name):
    """Cleans file/folder names into human-readable stone names."""
    # Remove file extensions
    name = os.path.splitext(name)[0]
    # Remove common technical suffixes
    name = re.sub(r'(_|-)2K(-JPG|-PNG)?', '', name, flags=re.IGNORECASE)
    name = re.sub(r'(_|-)(Polished|Honed|Leathered|Color|Diffuse|Albedo|BaseColor)', '', name, flags=re.IGNORECASE)
    name = re.sub(r'(_|-)\(US\)|\(CAN-or-US\)', '', name, flags=re.IGNORECASE)
    name = re.sub(r'\(1\)', '', name) # Remove duplicate markers
    # Replace separators with spaces
    name = name.replace('_', ' ').replace('-', ' ')
    # Title Case
    return name.title().strip()

def detect_category(path_str, name):
    """Determines the category based on path or name keywords."""
    path_lower = path_str.lower()
    name_lower = name.lower()
    
    if 'marble' in path_lower or 'marble' in name_lower: return 'Marble'
    if 'quartz' in path_lower or 'quartz' in name_lower: return 'Quartz'
    if 'granite' in path_lower or 'granite' in name_lower: return 'Granite'
    if 'dekton' in path_lower or 'dekton' in name_lower: return 'Dekton'
    if 'onyx' in path_lower: return 'Onyx'
    if 'travertine' in path_lower: return 'Travertine'
    if 'tiles' in path_lower: return 'Tiles'
    
    return 'Other'

def detect_tone(name):
    """Heuristic for stone tone based on name keywords."""
    name_lower = name.lower()
    light = ['white', 'cream', 'snow', 'light', 'bianco', 'vanilla', 'cotton', 'cloud', 'pure', 'mist', 'calacatta', 'statuario', 'ivory', 'crema']
    dark = ['black', 'dark', 'charcoal', 'grey', 'gray', 'nero', 'notte', 'thunder', 'storm', 'shadow', 'graphite', 'jet', 'marquina', 'soapstone', 'noir']
    warm = ['beige', 'gold', 'brown', 'earth', 'sand', 'honey', 'oak', 'taupe', 'brass', 'dune', 'fusion']
    
    if any(k in name_lower for k in light): return 'Light'
    if any(k in name_lower for k in dark): return 'Dark'
    if any(k in name_lower for k in warm): return 'Warm'
    return 'Light' # Default

def generate():
    # All paths provided by the user
    source_paths = [
        'client/public/textures/other/stones',
        'client/public/textures/other/textures',
        'client/public/textures/quartz',
        'client/public/textures/other/public_textures',
        'client/public/textures/other/public_2K',
        'client/public/textures/other/2K',
        'client/public/textures/marble',
        'client/public/textures/granite',
        'data_science/processed_training_set',
        'data_science/training_hub/public/textures/data_science/training_hub/public',
        'data_science/training_hub/public/textures/data_science/training_hub/public/_Stone_Gallery'
    ]

    library = {}
    
    for path_str in source_paths:
        base_path = pathlib.Path(path_str)
        if not base_path.exists():
            print(f"Skipping non-existent path: {path_str}")
            continue

        print(f"Processing: {path_str}...")
        
        # Priority 1: Folders (likely PBR textures)
        for item in base_path.iterdir():
            if item.is_dir():
                stone_id = item.name
                if stone_id in library: continue
                
                # Find preview image in subfolder
                images = list(item.rglob('*'))
                images = [img for img in images if img.suffix.lower() in ['.jpg', '.png', '.jpeg', '.webp']]
                if not images: continue
                
                # Priority for base color images
                preview_path = None
                patterns = ['Color', 'Diffuse', 'Albedo', 'BaseColor', 'Base_Color']
                for pattern in patterns:
                    for img in images:
                        if pattern.lower() in img.name.lower():
                            preview_path = img
                            break
                    if preview_path: break
                
                if not preview_path: preview_path = images[0]
                
                name = clean_stone_name(stone_id)
                
                # We need a relative path from the project root for the client to use
                # But for the visualizer, images are usually served from /public
                # So we need to map correctly.
                
                # Determine swatchUrl (relative to public if possible, else root)
                swatch_url = str(preview_path).replace('\\', '/')
                if 'client/public' in swatch_url:
                    swatch_url = '/' + swatch_url.split('client/public/')[1]
                else:
                    # For data_science paths, we might need to serve them or move them.
                    # For now, we'll keep the absolute-ish path for mapping purposes.
                    swatch_url = '/' + swatch_url
                
                library[stone_id] = {
                    'id': stone_id,
                    'name': name,
                    'category': detect_category(path_str, name),
                    'swatchUrl': swatch_url,
                    'texturePath': '/' + str(item).replace('\\', '/').split('client/public/')[1] if 'client/public' in str(item) else '/' + str(item).replace('\\', '/'),
                    'tone': detect_tone(name)
                }
            
            # Priority 2: Flat files (JPG/PNG)
            elif item.suffix.lower() in ['.jpg', '.png', '.jpeg', '.webp']:
                stone_id = item.name
                if stone_id in library: continue
                
                # Skip tech maps if they are flat in a folder
                tech_keywords = ['Normal', 'Rough', 'Displacement', 'Ambient', 'AO', 'Metallic', 'Specular', 'Reflection']
                if any(tk.lower() in stone_id.lower() for tk in tech_keywords): continue
                
                name = clean_stone_name(stone_id)
                swatch_url = str(item).replace('\\', '/')
                if 'client/public' in swatch_url:
                    swatch_url = '/' + swatch_url.split('client/public/')[1]
                else:
                    swatch_url = '/' + swatch_url
                    
                library[stone_id] = {
                    'id': stone_id,
                    'name': name,
                    'category': detect_category(path_str, name),
                    'swatchUrl': swatch_url,
                    'texturePath': os.path.dirname(swatch_url),
                    'tone': detect_tone(name)
                }

    # Convert to list and sort
    final_library = list(library.values())
    final_library.sort(key=lambda x: (x['category'], x['name']))

    # Write as TypeScript
    ts_content = f"// ============================================================================\n"
    ts_content += f"// COMPREHENSIVE STONE LIBRARY\n"
    ts_content += f"// Generated by rebuild_stone_library.py\n"
    ts_content += f"// Total Stones: {len(final_library)}\n"
    ts_content += f"// ============================================================================\n\n"
    ts_content += f"import {{ shuffleStones }} from './stoneLibrary3D_utils'; // If you want to keep utils separate\n\n"
    ts_content += f"export const STONE_LIBRARY_3D = {json.dumps(final_library, indent=2)};\n"
    ts_content += "\nexport type StoneMaterial3D = typeof STONE_LIBRARY_3D[0];\n"
    
    # We should also output the metadata for debugging
    output_file = pathlib.Path('client/src/data/stoneLibrary3D.ts')
    output_file.write_text(ts_content, encoding='utf-8')
    print(f"✅ Successfully rebuilt library with {len(final_library)} stones.")

if __name__ == "__main__":
    generate()
