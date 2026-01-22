import os
import json
import pathlib

def generate():
    categories = ['quartz', 'marble', 'granite', 'onyx', 'travertine', 'floor_tiles']
    library = []
    base_path = pathlib.Path('client/public/textures')
    
    if not base_path.exists():
        print(f"Error: {base_path} not found")
        return

    for cat in categories:
        cat_path = base_path / cat
        if not cat_path.exists(): continue
        
        for folder in cat_path.iterdir():
            if not folder.is_dir(): continue
            
            stone_id = folder.name
            # Simplified cleaning for name
            clean_name = stone_id.replace('_', ' ').replace('-', ' ')
            # Remove common suffixes
            for suffix in [' 2K JPG', ' 2K PNG', ' 2K', ' Polished', ' Honed']:
                clean_name = clean_name.replace(suffix, '')
            stone_name = clean_name.title().strip()
            
            # Look for preview image
            preview = None
            # Priority patterns for Base Color
            patterns = ['Color', 'Diffuse', 'Albedo', 'BaseColor', 'Base_Color']
            
            # Find all images
            images = list(folder.rglob('*'))
            images = [img for img in images if img.suffix.lower() in ['.jpg', '.png', '.jpeg', '.webp']]
            
            if not images: continue
            
            # Search by priority
            for pattern in patterns:
                for img in images:
                    if pattern.lower() in img.name.lower():
                        preview = str(img.relative_to(base_path.parent.parent)).replace('\\', '/')
                        break
                if preview: break
                
            if not preview:
                preview = str(images[0].relative_to(base_path.parent.parent)).replace('\\', '/')
            
            if preview:
                library.append({
                    'id': stone_id,
                    'name': stone_name,
                    'category': cat.replace('_', ' ').capitalize(),
                    'swatchUrl': '/' + preview,
                    'texturePath': '/textures/' + cat + '/' + stone_id
                })

    # Sort library by category then name
    library.sort(key=lambda x: (x['category'], x['name']))

    # Write as TypeScript
    ts_content = f"export const STONE_LIBRARY_3D = {json.dumps(library, indent=2)};\n"
    ts_content += "\nexport type StoneMaterial3D = typeof STONE_LIBRARY_3D[0];\n"
    
    output_file = pathlib.Path('client/src/data/stoneLibrary3D.ts')
    output_file.write_text(ts_content, encoding='utf-8')
    print(f"✅ Generated {output_file} with {len(library)} stones.")

if __name__ == "__main__":
    generate()
