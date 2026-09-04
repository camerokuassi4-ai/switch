import re
import os

html_path = 'index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update CSS for optimal image rendering
css_needle = '.real-mockup-screen img {'
css_replace = '''.real-mockup-screen img,
    .real-mockup-screen picture {
      width: 100%;
      height: 100%;
      display: block;
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
    }
    .real-mockup-screen img {'''

if css_needle in content and 'image-rendering: -webkit-optimize-contrast;' not in content:
    content = content.replace(css_needle, css_replace, 1)
    print("✅ CSS image-rendering mis à jour.")

# 2. Update openLightbox calls to use .webp
content, lb_count = re.subn(
    r"openLightbox\('assets/images/real_screens/([a-zA-Z0-9_]+)\.png'",
    r"openLightbox('assets/images/real_screens/\1.webp'",
    content
)
print(f"✅ {lb_count} appels openLightbox mis à jour vers WebP HD.")

# 3. Update img tags in real-mockup-screen to use <picture> with webp + png fallback
def replace_img_with_picture(match):
    screen_id = match.group(1)
    alt = match.group(2)
    return (
        f'<picture class="w-full h-full block">\n'
        f'                    <source srcset="assets/images/real_screens/{screen_id}.webp" type="image/webp">\n'
        f'                    <img src="assets/images/real_screens/{screen_id}.png" alt="{alt}" loading="lazy" class="w-full h-full object-cover object-top">\n'
        f'                  </picture>'
    )

pattern = r'<img src="assets/images/real_screens/([a-zA-Z0-9_]+)\.png" alt="([^"]+)" loading="lazy">'
new_content, count = re.subn(pattern, replace_img_with_picture, content)
print(f"✅ {count} balises <img> converties en balises <picture> WebP HD avec fallback PNG.")

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("🎉 index.html entièrement mis à jour avec les captures Ultra-HD !")
