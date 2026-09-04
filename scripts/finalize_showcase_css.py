import os

root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
index_path = os.path.join(root_dir, 'index.html')

with open(index_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add showcase CSS
showcase_css = """    /* Showcase Track : Swipe ergonomique sans débordement sur mobile, Grille 2x2 grand format sur Desktop */
    .showcase-track {
      display: flex;
      overflow-x: auto;
      gap: 1.25rem;
      padding-top: 0.5rem;
      padding-bottom: 1rem;
      scroll-snap-type: x mandatory;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      -ms-overflow-style: none;
      width: 100%;
      max-width: 100%;
    }
    .showcase-track::-webkit-scrollbar {
      display: none;
    }
    .showcase-card {
      width: 285px;
      min-width: 285px;
      max-width: 285px;
      flex-shrink: 0;
      scroll-snap-align: center;
    }

    @media (min-width: 640px) {
      .showcase-track {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        overflow-x: visible !important;
        gap: 1.5rem !important;
      }
      .showcase-card {
        width: 100% !important;
        min-width: 0 !important;
        max-width: 330px !important;
        margin-left: auto !important;
        margin-right: auto !important;
      }
    }
"""

if '.showcase-track' not in content:
    content = content.replace('    .phone-mockup {', showcase_css + '\n    .phone-mockup {')
    print("✅ CSS showcase-track inséré.")

# 2. Replace the flex / sm:grid inline classes with showcase-track and showcase-card
old_container = 'class="flex sm:grid sm:grid-cols-2 gap-5 sm:gap-6 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory no-scrollbar -mx-2 px-2 sm:mx-0 sm:px-0"'
new_container = 'class="showcase-track"'
content = content.replace(old_container, new_container)

old_card = 'class="flex flex-col items-center group cursor-pointer w-[285px] xs:w-[315px] sm:w-auto shrink-0 sm:shrink snap-center"'
new_card = 'class="flex flex-col items-center group cursor-pointer showcase-card"'
content = content.replace(old_card, new_card)

# Ensure lg:col-span-7 has overflow control
content = content.replace('<div class="lg:col-span-7">', '<div class="lg:col-span-7 w-full max-w-full overflow-hidden sm:overflow-visible">')

with open(index_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("🎉 index.html mis à jour avec les classes showcase-track & showcase-card !")
