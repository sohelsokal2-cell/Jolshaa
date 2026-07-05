---
name: Jolshaa
colors:
  surface: '#f5faf8'
  surface-dim: '#d6dbd9'
  surface-bright: '#f5faf8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f5f2'
  surface-container: '#eaefed'
  surface-container-high: '#e4e9e7'
  surface-container-highest: '#dee4e1'
  on-surface: '#171d1c'
  on-surface-variant: '#3d4947'
  inverse-surface: '#2c3130'
  inverse-on-surface: '#edf2f0'
  outline: '#6d7a77'
  outline-variant: '#bcc9c6'
  surface-tint: '#006a61'
  primary: '#00685f'
  on-primary: '#ffffff'
  primary-container: '#008378'
  on-primary-container: '#f4fffc'
  inverse-primary: '#6bd8cb'
  secondary: '#4e45d5'
  on-secondary: '#ffffff'
  secondary-container: '#6860ef'
  on-secondary-container: '#fffbff'
  tertiary: '#924628'
  on-tertiary: '#ffffff'
  tertiary-container: '#b05e3d'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#89f5e7'
  primary-fixed-dim: '#6bd8cb'
  on-primary-fixed: '#00201d'
  on-primary-fixed-variant: '#005049'
  secondary-fixed: '#e3dfff'
  secondary-fixed-dim: '#c3c0ff'
  on-secondary-fixed: '#100069'
  on-secondary-fixed-variant: '#372abf'
  tertiary-fixed: '#ffdbce'
  tertiary-fixed-dim: '#ffb59a'
  on-tertiary-fixed: '#370e00'
  on-tertiary-fixed-variant: '#773215'
  background: '#f5faf8'
  on-background: '#171d1c'
  surface-variant: '#dee4e1'
typography:
  display-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.25'
  headline-lg-mobile:
    fontFamily: Be Vietnam Pro
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.25'
  headline-md:
    fontFamily: Be Vietnam Pro
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  title-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.5'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.4'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-max: 1280px
  gutter: 24px
  margin-desktop: 40px
  margin-mobile: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style
The brand personality is rooted in the concept of a "Jolshaa"—a gathering or a lively session of community connection. It is modern, warm, and inherently social, designed to resonate with a digitally savvy Bangladeshi audience. The design style follows a **Modern Corporate** aesthetic with a **Friendly** twist, emphasizing clarity, accessibility, and high trust.

The interface prioritizes a "breathable" experience through generous whitespace and a systematic approach to depth. By avoiding the cluttered density of traditional social platforms, this design system fosters an environment where content and community interactions feel intentional and high-quality.

## Colors
The palette is anchored by a **Vibrant Teal** primary color, chosen for its refreshing energy and association with growth and harmony. **Deep Indigo** serves as a sophisticated secondary color for navigation elements and interactive states, providing a grounded, professional contrast.

**Coral** is used exclusively as an accent for high-priority actions, notifications, and "live" indicators to ensure they stand out without overwhelming the primary teal brand identity. The neutral palette utilizes a soft off-white for backgrounds to reduce eye strain, while text hierarchy is established through varying shades of slate and gray to ensure maximum readability and accessibility.

## Typography
The typography strategy combines the friendly, contemporary flair of **Be Vietnam Pro** for headlines with the highly functional and neutral **Inter** for body text and interface labels. This pairing ensures that while the brand feels approachable and energetic in its messaging, the actual content consumption (posts, comments, and messages) remains effortless and legible.

Headlines use tighter letter spacing and bold weights to create a strong visual anchor. Body text utilizes a slightly increased line height (1.6) to accommodate longer Bengali or English posts comfortably. Small labels use medium to semi-bold weights to maintain clarity even at reduced scales.

## Layout & Spacing
The layout follows a **Fluid Grid** system within a max-width container to ensure a balanced look on ultra-wide monitors. A 12-column structure is used for desktop, typically organized into a 3-column layout: Navigation (Left), Main Feed (Center), and Discovery/Trending (Right).

On mobile, the layout collapses into a single-column feed with a bottom navigation bar for primary actions. Spacing is based on a 4px baseline grid, with 16px (stack-md) being the standard padding for cards and containers. Generous margins (40px) on desktop create a "floating" effect for the content area, emphasizing the clean and modern aesthetic.

## Elevation & Depth
This design system utilizes **Tonal Layers** combined with **Ambient Shadows** to create a sense of organized hierarchy. Surfaces are categorized into three levels:
1.  **Floor (Level 0):** The primary background (#F9FAFB), which remains flat.
2.  **Surface (Level 1):** White cards (#FFFFFF) used for posts and widgets, featuring a very soft, diffused shadow (0px 4px 20px rgba(0,0,0,0.04)).
3.  **Overlay (Level 2):** Modals, dropdowns, and floating action buttons, which use a more pronounced shadow (0px 10px 30px rgba(0,0,0,0.08)) to indicate they sit high above the content.

Interaction is hinted at through subtle transitions; when a user hovers over a post card, the shadow slightly deepens, providing a tactile feel of "lifting" the content.

## Shapes
The shape language is consistently **Rounded**, reflecting the friendly and community-oriented nature of the app. 
- **Standard elements** (Buttons, Input Fields): 0.5rem (8px).
- **Large containers** (Post Cards, Content Blocks): 1rem (16px).
- **Interactive accents** (Chips, Avatars, Tags): 1.5rem (24px) or fully rounded (pill-shaped) for a more organic feel.

This consistent use of rounded corners softens the interface and makes the technology feel more approachable and less "industrial."

## Components
- **Buttons:** Primary buttons use the Teal #0D9488 with white text. Secondary buttons use a light Indigo tint with Indigo text. All buttons have 8px corner radii and medium weight labels.
- **Cards:** White backgrounds with 16px rounded corners. Borders are avoided in favor of the soft ambient shadows described in the Elevation section.
- **Input Fields:** Soft gray backgrounds (#F3F4F6) with no borders until focused. On focus, they transition to a white background with a 2px Teal stroke.
- **Chips & Tags:** Small, pill-shaped elements used for categories or hashtags. They use a low-opacity version of the primary teal or secondary indigo to keep the UI light.
- **Avatars:** Strictly circular to differentiate people from content (which uses rounded squares). A 2px white border is used when avatars overlap in a list.
- **Notifications:** Use the Coral #F43F5E accent for the badge count. The notification items themselves follow the standard card styling but with a subtle Indigo side-accent to denote "unread" status.