import os
import re

base_dir = r"c:\Users\camer\OneDrive\Documents\Nouveau dossier\stitch_switch_fintech_app_benin"

def clean_file(filepath):
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    # Replace local Windows/File URLs with relative paths
    cleaned = re.sub(r'file:///c:/Users/[^"\')\s]+', '#', content, flags=re.IGNORECASE)
    cleaned = re.sub(r'c:/Users/[^"\')\s]+', '#', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'C:\\Users\\[^"\')\s]+', '#', cleaned, flags=re.IGNORECASE)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(cleaned)

def sanitize_all():
    print("🧹 Nettoyage des chemins absolus dans index.html, download.html et download/*.html...")
    
    files_to_clean = [
        os.path.join(base_dir, "index.html"),
        os.path.join(base_dir, "download.html"),
        os.path.join(base_dir, "download", "user.html"),
        os.path.join(base_dir, "download", "merchant.html"),
        os.path.join(base_dir, "download", "agent.html"),
        os.path.join(base_dir, "download", "hybrid.html")
    ]
    
    for fpath in files_to_clean:
        if os.path.exists(fpath):
            clean_file(fpath)
            print(f" ✅ Nettoyé: {os.path.basename(fpath)}")

sanitize_all()
