
import shutil
import os

base_dir = r"C:\Users\toplo\Desktop\ai_stuff\clients\jack_davis_big_jack\LJ-Stone-Surfaces-LTD"
src = os.path.join(base_dir, "fine_tuning_data")
dst = os.path.join(base_dir, "fine_tuning_data")

print(f"Zipping {src} to {dst}.zip...")
shutil.make_archive(dst, 'zip', src)
print("Done.")
