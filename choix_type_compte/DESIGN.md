---
name: 'Fluid Benin Fintech: Espace Agent'
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
  secondary-container: '#e2dfdf'
  on-secondary-container: '#636262'
  tertiary: '#8d4b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#b15f00'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e6deff'
  primary-fixed-dim: '#cabeff'
  on-primary-fixed: '#1c0062'
  on-primary-fixed-variant: '#481ac7'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c6'
  on-secondary-fixed: '#1c1b1c'
  on-secondary-fixed-variant: '#474647'
  tertiary-fixed: '#ffdcc3'
  tertiary-fixed-dim: '#ffb77d'
  on-tertiary-fixed: '#2f1500'
  on-tertiary-fixed-variant: '#6e3900'
  background: '#fdf8ff'
  on-background: '#1c1a24'
  surface-variant: '#e6e0ee'
  surface-agent: '#fdf8ff'
  liquidity-high: '#22c55e'
  liquidity-low: '#ef4444'
  commission-accent: '#f59e0b'
  otp-border: '#c9c4d7'
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
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
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
  otp-display:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
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
  otp-gap: 8px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The "Espace Agent" (Agent Space) extension maintains the core identity of the design system while shifting the emotional tone from consumer-centric "ease" to professional "efficiency and reliability." It is designed for Beninese agents who manage high-frequency transactions, liquidity, and customer verifications.

The visual style remains **Corporate Modern with a Fluid Silk twist**, but introduces more structured data visualization and high-visibility status indicators. It emphasizes **operational clarity**—ensuring agents can distinguish between liquidity levels and transaction types at a glance. The aesthetic is clean and high-contrast, utilizing the signature light surface to ensure visibility during outdoor operations under bright daylight in Cotonou.

## Colors

The Agent Space utilizes the primary **Violet (#7B5CFA)** for all core actions, maintaining brand continuity. 

- **Liquidity Status:** Specifically uses **Liquidity High (#22c55e)** and **Liquidity Low (#ef4444)** for float management indicators. These should be paired with low-opacity backgrounds of the same hue for badges.
- **Commission Indicators:** An **Amber (#f59e0b)** is introduced specifically for commission-related earnings to distinguish them from standard balance credit/debit.
- **Surface:** The background remains a soft **#fdf8ff** to maintain a sense of airiness, while container surfaces use pure white to separate operational modules.

## Typography

The typography leverages **Hanken Grotesk** to maintain a sharp, technical appearance. 

For the Agent context, a new **OTP Display** style is introduced for 6-digit verification codes, ensuring maximum legibility during customer interactions. Transaction amounts within commission cards should use the **Headline-SM** weight to ensure the agent's primary KPI (earnings) is always prominent. Functional labels (e.g., "FLOAT LOW") must always use **Label-Caps** for a professional, system-alert feel.

## Layout & Spacing

The layout follows a **fluid grid model** with specific adaptations for the Agent Space dashboard.

- **Dashboard Grid:** Agent metrics (Float vs. Commission) are displayed in a 2-column grid on desktop/tablet and a vertical stack on mobile.
- **OTP Input:** The 6-digit verification section uses a specific **otp-gap (8px)** between individual digit containers to prevent input errors.
- **Floating Navigation:** The signature oval bar remains centered at the bottom but includes an "Agent Profile/Status" toggle, requiring a slightly wider horizontal footprint than the consumer version.

## Elevation & Depth

Hierarchy in the Agent Space is strictly functional:

- **Surface Level:** The base light violet surface (#fdf8ff).
- **Operational Cards:** Commission cards and transaction items use Level 1 shadows (Blur: 20px, Opacity: 4%) to appear as interactable tactile layers.
- **Critical Alerts:** Liquidity status badges use a subtle inner glow rather than a drop shadow to indicate they are "embedded" status indicators rather than floating elements.
- **Floating Nav:** Retains the highest elevation (Level 2) with a 15% opacity shadow to ensure it is never lost behind transaction list scrolling.

## Shapes

The Agent Space uses a mix of the system's defined roundedness levels to balance friendliness with professional structure:

- **Action Cards:** Use 16px (rounded-lg) for the main container to match the consumer aesthetic.
- **Status Badges:** Use 9999px (Pill-shaped) for liquidity indicators to make them distinct from square-ish buttons.
- **Verification Inputs:** Individual boxes for the 6-digit code use 8px (rounded-md) corners to provide a sturdy, input-focused feel.
- **Floating Nav:** Maintains the 100% pill/oval shape for the signature "Fluid" look.

## Components

### Liquidity Status Badges
- **High Float:** A pill-shaped badge with a light green background and dark green text/icon.
- **Low Float:** A pill-shaped badge with a light red background and dark red text/icon, intended to trigger an immediate visual "refill" cue.

### Commission Transaction Cards
- **Structure:** A standard transaction item but with a dedicated "Earnings" slot. 
- **Visuals:** Uses the Amber (#f59e0b) color for the amount to distinguish "Commission Earned" from "Money In." Includes a small percentage icon to signify the agent fee.

### 6-Digit Verification Input
- **Design:** Six individual boxes (approx 48px x 56px). 
- **Active State:** The active box gains a 2px primary violet border and a soft glow.
- **Validation:** Boxes turn green upon successful verification or red if the code is invalid.

### Agent Floating Nav
- **Adaptation:** The oval bar is adapted to include an "Available/Offline" toggle on the far left, using the primary violet for the "Available" state. The central action button in the nav remains the signature (+) but is specifically mapped to "New Transaction/Cash-In."

### List Items (Agent Specific)
- **KYC Status:** Transaction rows in the agent view include a small verification tick next to the customer name to confirm identity has been checked.