---
name: Fluid Benin Fintech
colors:
  surface: '#fdf8ff'
  surface-dim: '#ddd8e5'
  surface-bright: '#fdf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f7f1ff'
  surface-container: '#f1ebf9'
  surface-container-high: '#ebe6f3'
  surface-container-highest: '#e6e0ee'
  on-surface: '#1c1a24'
  on-surface-variant: '#484555'
  inverse-surface: '#312f39'
  inverse-on-surface: '#f4eefc'
  outline: '#797586'
  outline-variant: '#c9c4d7'
  surface-tint: '#613ede'
  primary: '#5e3bdc'
  on-primary: '#ffffff'
  primary-container: '#7758f6'
  on-primary-container: '#fffbff'
  inverse-primary: '#cabeff'
  secondary: '#5f5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e5e2e1'
  on-secondary-container: '#656464'
  tertiary: '#5a5c5d'
  on-tertiary: '#ffffff'
  tertiary-container: '#737576'
  on-tertiary-container: '#fcfdfe'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e6deff'
  primary-fixed-dim: '#cabeff'
  on-primary-fixed: '#1c0062'
  on-primary-fixed-variant: '#481ac7'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474646'
  tertiary-fixed: '#e1e3e4'
  tertiary-fixed-dim: '#c5c7c8'
  on-tertiary-fixed: '#191c1d'
  on-tertiary-fixed-variant: '#454748'
  background: '#fdf8ff'
  on-background: '#1c1a24'
  surface-variant: '#e6e0ee'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-margin: 20px
  gutter: 16px
  card-padding: 24px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

This design system is crafted for a Beninese fintech audience, prioritizing speed, modern aesthetics, and localized financial trust. The brand personality is **progressive yet accessible**, blending the efficiency of global SaaS products with a local touch relevant to Cotonou and beyond. 

The visual style is **Corporate Modern with a "Fluid Silk" twist**. It utilizes high-quality gradients and organic textures within the hero elements (like balance cards) to create a premium, tactile feel. The interface remains strictly light-themed to ensure maximum readability under varying lighting conditions, using heavy whitespace and ultra-rounded corners to feel inviting and safe.

The primary emotional response should be **effortless control**. By using floating navigation and circular action buttons, the UI minimizes friction for everyday tasks like MTN MoMo or Moov Money transfers.

## Colors

The palette is anchored by a **Vibrant Saturated Purple (#7B5CFA)**, serving as the primary signature for all "active" states and primary buttons. 

- **Backgrounds:** Use a very pale grey (#F8F9FA) for the main app background to allow white cards (#FFFFFF) to pop with soft shadows.
- **The Gradient:** Hero balance cards must use a linear or radial gradient from deep purple to light purple, overlaying a "fluid silk" abstract texture.
- **Accents:** Use standard semantic colors for financial status: Green for MoMo/Celtiis gains and Red for expenses, but keep them slightly desaturated to not compete with the primary purple.
- **Typography:** Headlines and body text use deep charcoal or black for high contrast.

## Typography

This design system uses **Hanken Grotesk** across all roles. It offers a sharp, contemporary geometric feel that aligns with the "tech-forward" nature of a modern fintech app while remaining highly legible in French.

- **Scale:** High contrast between balance amounts (Display) and supporting labels.
- **Context:** Large numbers (currency) should use the Bold weight to emphasize financial clarity.
- **Localization:** Ensure line-heights accommodate French accents (é, è, ê) without clipping, especially in tight list views for transaction history.

## Layout & Spacing

The layout follows a **fluid grid model** with a focus on mobile-first interaction. 

- **Safe Zones:** Maintain a consistent 20px horizontal margin for the main container.
- **Vertical Rhythm:** Use an 8px base grid. Components are typically separated by 16px (stack-md) or 32px (stack-lg) for section breaks.
- **Floating Nav:** The navigation bar is an oval-shaped floating element. It requires a bottom "safe area" padding of at least 16px from the device edge and should not span the full width of the screen.
- **Cards:** Financial cards should have a consistent aspect ratio (approx 1.58:1) to mimic physical bank cards.

## Elevation & Depth

Hierarchy is established through **Ambient Shadows** and **Tonal Layering**.

- **Level 0:** The pale grey background (#F8F9FA).
- **Level 1:** White surface cards with a very soft, diffused shadow (Blur: 20px, Y: 10px, Opacity: 4% Black). This makes the cards feel like they are resting lightly on the surface.
- **Level 2:** Floating Navigation. This requires a more distinct shadow to indicate it is "above" the content (Blur: 30px, Y: 15px, Opacity: 15% Black).
- **Interactive:** Avoid heavy bevels or neomorphism. Depth should feel airy and clean.

## Shapes

The shape language is defined by **Ultra-Rounded Corners**.

- **Standard Cards:** 24px corner radius to create a friendly, soft aesthetic.
- **Buttons:** Circular (50% / Pill) for primary actions. 
- **Floating Nav:** Fully rounded ends (Oval/Pill shape).
- **Input Fields:** 16px corner radius to match the overall softness while maintaining structural integrity.
- **Icon Backdrops:** Always use perfect circles for action-oriented icons.

## Components

### Buttons
- **Primary Action:** Solid Purple (#7B5CFA) circle with a white icon. Used for core tasks like "Top up" (+).
- **Secondary Action:** White circular button with a thin light grey border and a purple icon.
- **Labeling:** In the French context, use concise labels below the icons (e.g., "Envoyer", "Convertir", "Retrait").

### Navigation Bar
- **Style:** Floating black oval bar centered at the bottom.
- **Icons:** Minimalist white stroke icons. The "Active" state can be indicated by a small purple dot below the icon or by changing the icon to the primary purple.

### Balance Cards
- **Visuals:** Must include the "Fluid Silk" mesh gradient.
- **Content:** Large white "Total balance" figure, a small chip for "Active" status, and the network logo (MTN/Moov) in the corner.

### Transaction Lists
- **Item Styling:** White background card with a small circular icon on the left (showing the service logo, e.g., Celtiis).
- **Typography:** Merchant name in Primary Text weight; date/time in Secondary Text. Amount on the far right, colored green for credit or black for debit.

### Input Fields
- **Design:** Minimalist white fields with a subtle 1px border (#E9ECEF). Focus state should highlight the border in Primary Purple (#7B5CFA) with a soft outer glow.