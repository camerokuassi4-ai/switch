import os
import re

root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
index_path = os.path.join(root_dir, 'index.html')

with open(index_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace the old CSS with the new realistic phone mockup CSS
new_css_block = """    /* ========================================================================= */
    /* VRAI MOCKUP DE SMARTPHONE RÉALISTE (CADRE TITANE MÉTALLISÉ & ÉCRAN HD)     */
    /* ========================================================================= */
    .real-mockup-device {
      position: relative;
      width: 100%;
      aspect-ratio: 1000 / 2050;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      justify-content: center;
      filter: drop-shadow(0 15px 30px rgba(0, 0, 0, 0.65));
    }

    /* Survol et halo de couleur par profil */
    @media (hover: hover) {
      .group:hover .real-mockup-device {
        transform: translateY(-6px) scale(1.025);
      }
      .group:hover .real-mockup-device.user-device {
        filter: drop-shadow(0 20px 40px rgba(16, 185, 129, 0.45));
      }
      .group:hover .real-mockup-device.merchant-device {
        filter: drop-shadow(0 20px 40px rgba(59, 130, 246, 0.45));
      }
      .group:hover .real-mockup-device.agent-device {
        filter: drop-shadow(0 20px 40px rgba(245, 158, 11, 0.45));
      }
      .group:hover .real-mockup-device.hybrid-device {
        filter: drop-shadow(0 20px 40px rgba(20, 184, 166, 0.45));
      }
    }

    /* Écran in-app intérieur (s'insère sous le bezel transparent) */
    .real-mockup-screen {
      position: absolute;
      top: 3.31%;
      left: 7.8%;
      width: 84.4%;
      height: 93.36%;
      border-radius: 38px;
      overflow: hidden;
      background: #000;
      z-index: 1;
    }

    .real-mockup-screen img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: top;
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
    }

    /* Cadre photoréaliste PNG transparent (titane, caméra optique, îlot tactile, boutons) */
    .real-mockup-overlay {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 10;
      user-select: none;
      -webkit-user-drag: none;
    }
"""

# Replace old .phone-mockup CSS up to .phone-mockup::after
old_css_regex = re.compile(r'\.phone-mockup\s*\{[\s\S]*?\.phone-mockup::after\s*\{[\s\S]*?\}', re.MULTILINE)
if old_css_regex.search(content):
    content = old_css_regex.sub(new_css_block, content)
    print("✅ CSS des vieux mockups remplacé par les styles du vrai mockup réaliste.")
else:
    print("⚠️ Ancien bloc CSS phone-mockup non trouvé par regex, tentative de remplacement alternatif...")
    # Alternative insertion
    if '.real-mockup-device' not in content:
        content = content.replace('.phone-mockup {', new_css_block + '\n    .phone-mockup {')

# 2. Replace the HTML mockup card structure across all 4 sections
# Replace user-phone, merchant-phone, agent-phone, hybrid-phone blocks
def replace_mockup_html(match):
    device_class = match.group(1) # user-phone, merchant-phone, etc.
    img_src = match.group(2)      # assets/images/real_screens/...
    alt_text = match.group(3)     # Alt text

    # Map to new device class
    mapped_class = device_class.replace('-phone', '-device')

    return f"""<div class="real-mockup-device {mapped_class}">
                <div class="real-mockup-screen">
                  <img src="{img_src}" alt="{alt_text}" loading="lazy">
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 z-20">
                    <span class="material-symbols-outlined text-white text-3xl drop-shadow-md">zoom_in</span>
                    <span class="text-[11px] font-bold text-white bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-sm">Agrandir HD</span>
                  </div>
                </div>
                <img src="assets/images/mockups/realistic_iphone_frame.png" class="real-mockup-overlay" alt="Mockup Smartphone Réaliste" draggable="false">
              </div>"""

card_pattern = re.compile(
    r'<div class="phone-mockup\s+([a-zA-Z0-9_-]+)">\s*<div class="phone-dynamic-island">[\s\S]*?</div>\s*<div class="phone-screen">\s*<img src="([^"]+)" alt="([^"]+)"[\s\S]*?</div>\s*<div class="phone-home-indicator"></div>\s*</div>',
    re.MULTILINE
)

matches_found = len(card_pattern.findall(content))
print(f"🔍 Trouvé {matches_found} mockups téléphones à remplacer.")
content = card_pattern.sub(replace_mockup_html, content)

# 3. Replace Lightbox Mockup Structure
old_lightbox_phone = re.compile(
    r'<div class="phone-mockup\s+w-full[\s\S]*?id="lightbox-img"[\s\S]*?</div>\s*<div class="phone-home-indicator"></div>\s*</div>',
    re.MULTILINE
)

new_lightbox_phone = """<div class="real-mockup-device w-full max-w-[340px] sm:max-w-[380px] max-h-[82vh] mx-auto">
        <div class="real-mockup-screen">
          <img id="lightbox-img" src="" alt="Aperçu application" class="w-full h-full object-contain">
        </div>
        <img src="assets/images/mockups/realistic_iphone_frame.png" class="real-mockup-overlay" alt="Mockup Smartphone Réaliste" draggable="false">
      </div>"""

if old_lightbox_phone.search(content):
    content = old_lightbox_phone.sub(new_lightbox_phone, content)
    print("✅ Lightbox modal mis à jour avec le vrai mockup réaliste.")
else:
    print("⚠️ Lightbox modal non trouvé par regex.")

with open(index_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("🎉 index.html entièrement mis à jour avec les vrais mockups réalistes !")
