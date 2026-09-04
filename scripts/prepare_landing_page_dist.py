import os
import shutil
import re

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dist_dir = os.path.join(base_dir, "dist")

def prepare_dist():
    print("🚀 Préparation du dossier de production 'dist/' pour l'hébergement web...")
    
    if os.path.exists(dist_dir):
        shutil.rmtree(dist_dir)
    os.makedirs(dist_dir, exist_ok=True)

    # 1. Copy index.html and download.html
    shutil.copy2(os.path.join(base_dir, "index.html"), os.path.join(dist_dir, "index.html"))
    shutil.copy2(os.path.join(base_dir, "download.html"), os.path.join(dist_dir, "download.html"))

    # 2. Copy download folder
    src_download = os.path.join(base_dir, "download")
    dst_download = os.path.join(dist_dir, "download")
    if os.path.exists(src_download):
        shutil.copytree(src_download, dst_download)

    # 3. Copy assets folder
    src_assets = os.path.join(base_dir, "assets")
    dst_assets = os.path.join(dist_dir, "assets")
    if os.path.exists(src_assets):
        shutil.copytree(src_assets, dst_assets)

    # 4. Ensure downloads directory exists with APK binaries
    dst_downloads = os.path.join(dst_assets, "downloads")
    os.makedirs(dst_downloads, exist_ok=True)
    src_downloads = os.path.join(base_dir, "assets", "downloads")

    # Copy all APK files to dist/assets/downloads/
    for fname in os.listdir(src_downloads):
        if fname.endswith(".apk"):
            src_f = os.path.join(src_downloads, fname)
            dst_f = os.path.join(dst_downloads, fname)
            shutil.copy2(src_f, dst_f)
            size_mb = os.path.getsize(dst_f) / (1024 * 1024)
            print(f"  ✅ APK de production copié dans dist: {fname} ({size_mb:.2f} Mo)")

    # Also place APKs in direct download subfolders for direct route links
    sub_map = {
        "user": "switch-beta-user-v2.1.0.apk",
        "merchant": "switch-beta-merchant-v2.1.0.apk",
        "agent": "switch-beta-agent-v2.1.0.apk",
        "hybrid": "switch-beta-hybrid-v2.1.0.apk"
    }
    for sub, apk_name in sub_map.items():
        sub_dir = os.path.join(dst_download, sub)
        os.makedirs(sub_dir, exist_ok=True)
        src_apk = os.path.join(dst_downloads, apk_name)
        if os.path.exists(src_apk):
            shutil.copy2(src_apk, os.path.join(sub_dir, f"{sub}-beta.apk"))
            shutil.copy2(src_apk, os.path.join(sub_dir, apk_name))

    # 5. Sanitize & Verify Relative Paths in HTML files
    print("\n🔍 Vérification des chemins relatifs dans les fichiers HTML de 'dist/'...")
    local_path_pattern = re.compile(r'(file:///|(?:^|[^a-zA-Z0-9_])[a-zA-Z]:[/\\])', re.IGNORECASE)
    
    html_files = []
    for root, dirs, files in os.walk(dist_dir):
        for file in files:
            if file.endswith('.html'):
                html_files.append(os.path.join(root, file))

    has_errors = False
    for hfile in html_files:
        rel_path = os.path.relpath(hfile, dist_dir)
        with open(hfile, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

        matches = local_path_pattern.findall(content)
        if matches:
            print(f" ⚠️ Attention: Chemins local Windows trouvés dans {rel_path}: {len(matches)}")
            has_errors = True
        else:
            print(f" ✅ {rel_path} -> 100% Prêt pour le Web (0 chemin local Windows)")

    if not has_errors:
        print(f"\n🎉 TOUS LES FICHIERS DE 'dist/' SONT 100% RELATIFS ET PRÊTS POUR NETLIFY / VERCEL / GITHUB PAGES !")
        print(f"Emplacement complet du dossier à déployer : {dist_dir}")

prepare_dist()
