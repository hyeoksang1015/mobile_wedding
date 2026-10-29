---
name: 'Yeon: Korean Editorial Wedding Invitation'
colors:
  surface: '#fdf9f3'
  surface-dim: '#dddad4'
  surface-bright: '#fdf9f3'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f7f3ed'
  surface-container: '#f1ede7'
  surface-container-high: '#ebe8e2'
  surface-container-highest: '#e6e2dc'
  on-surface: '#1c1c18'
  on-surface-variant: '#524440'
  inverse-surface: '#31302d'
  inverse-on-surface: '#f4f0ea'
  outline: '#84736f'
  outline-variant: '#d7c2bd'
  surface-tint: '#855143'
  primary: '#855143'
  on-primary: '#ffffff'
  primary-container: '#c98b7b'
  on-primary-container: '#51261b'
  inverse-primary: '#fab6a5'
  secondary: '#655d59'
  on-secondary: '#ffffff'
  secondary-container: '#ede0db'
  on-secondary-container: '#6b625f'
  tertiary: '#645d56'
  on-tertiary: '#ffffff'
  tertiary-container: '#a29991'
  on-tertiary-container: '#37312b'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbd2'
  primary-fixed-dim: '#fab6a5'
  on-primary-fixed: '#341007'
  on-primary-fixed-variant: '#693a2d'
  secondary-fixed: '#ede0db'
  secondary-fixed-dim: '#d0c4bf'
  on-secondary-fixed: '#201a17'
  on-secondary-fixed-variant: '#4d4542'
  tertiary-fixed: '#ebe1d8'
  tertiary-fixed-dim: '#cfc5bc'
  on-tertiary-fixed: '#201b15'
  on-tertiary-fixed-variant: '#4c463f'
  background: '#fdf9f3'
  on-background: '#1c1c18'
  surface-variant: '#e6e2dc'
typography:
  display:
    fontFamily: Noto Serif
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 44px
    letterSpacing: 0.04em
  headline-lg:
    fontFamily: Noto Serif
    fontSize: 26px
    fontWeight: '400'
    lineHeight: 38px
    letterSpacing: 0.02em
  headline-md:
    fontFamily: Noto Serif
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 30px
    letterSpacing: 0.01em
  poetry-lead:
    fontFamily: Noto Serif
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 30px
    letterSpacing: 0.03em
  body-lg:
    fontFamily: Noto Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Noto Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: -0.01em
  body-sm:
    fontFamily: Noto Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  label-md:
    fontFamily: Noto Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.06em
  label-sm:
    fontFamily: Noto Sans
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.08em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system establishes a quiet, literary atmosphere inspired by premium Korean stationery, bespoke letterpress printing, and traditional paper (*hanji*) textures. The aesthetic rejects commercial urgency, vibrant saturated fills, and heavy elevation in favor of intentional stillness, refined editorial verticality, and literary cadence. 

Primary characteristics:
- **Atmosphere**: Reverent, warm, tactile, and poetic. The experience mirrors opening an artisanal paper envelope rather than browsing a web utility.
- **Rhythm**: Generous vertical intervals, deliberate pauses between verse and logistic information, and unhurried visual pacing.
- **Graphic Restraint**: Structural definition is maintained through delicate 1px hairline rules, tonal paper shifts, and subtle shifts between lyrical serif headlines and precise, utilitarian sans-serif captions.

## Colors

The palette is anchored in muted earth pigments, sun-bleached mulberry paper, and delicate powdered terracotta. 

- **Primary (`#C98B7B`)**: Dusty rose / muted terracotta. Reserved for focal points, monograms, interactive state indicators, and key dates.
- **Secondary (`#F4E7E2`)**: Soft rose blush tint. Used for subtle selection states, accent pills, and tinted backing panels.
- **Neutral Canvas (`#FAF6F0`)**: Base ivory parchment tone. Establishes the foundational canvas, reducing screen glare to emulate matte rag paper.
- **Surface Elevation (`#FFFFFF` & `#FDFBF7`)**: Off-white stationery layers applied to distinct content modules (ceremony details, interactive RSVP form, transport guides).
- **Ink Tones**:
  - `Text Primary` (`#3B2F2A`): Deep warm umber ink. Delivers softer optical contrast than harsh digital black while exceeding accessibility requirements on ivory surfaces.
  - `Text Secondary` (`#7A6E67`): Muted warm gray-brown for supporting narrative, verse, and contextual annotations.
  - `Text Tertiary` (`#A89F97`): Delicate sand-gray for metadata, timestamps, and subtle field labels.
- **Hairlines & Dividers (`#EFE7DC`)**: Whispering 1px separator lines that suggest creased card stock rather than digital boundaries.

## Typography

The typographic balance relies on a dual-hierarchy structure:
1. **Noto Serif**: Serves as the literary voice. Dedicated to names of the couple, family announcements, introductory greetings, and poetic dedications. The line height is intentionally spacious (`1.8`–`1.9`) to let the prose breathe naturally.
2. **Noto Sans**: Delivers crisp, utilitarian clarity for event coordinates, calendar dates, transit guides, interactive button targets, and RSVP form inputs. Tracking is slightly expanded on small labels (`letterSpacing: 0.06em` to `0.08em`) to mirror luxury stationery stamping.

## Layout & Spacing

Designed fundamentally around a single-column, centered mobile viewport (390px base width, scaling up to 430px maximum readable container width on larger viewports).

- **Container Centering**: On desktop or tablet viewports, the application is strictly confined to a centered 420px max-width reading column framed by soft neutral margins, preserving the intimate portrait aspect ratio of a folded wedding card.
- **Vertical Pacing**: Generous section spacing (`3.5rem` to `4.5rem`) separates narrative anchors (Hero / Photo Showcase / Poem / Calendar / Venue & Map / RSVP / Account Details).
- **Margins & Gutters**: Outer viewport margin is set to `1.25rem` (`20px`), ensuring content does not touch device edges while giving cards sufficient breathing room. Element gaps within card groups follow an 8px vertical rhythm.

## Elevation & Depth

In line with bespoke stationery design, dramatic drop shadows and glossy plastic layers are strictly forbidden. Depth is tactile, physical, and restrained:

- **Flat Tonal Layering**: Content modules rely on flat surface shifts (e.g., `#FFFFFF` or `#FDFBF7` cards placed directly over the `#FAF6F0` ivory canvas).
- **Hairline Framing**: Structural separation is achieved via `1px solid #EFE7DC` borders rather than box shadows.
- **Ambient Micro-Elevation**: For floating bottom navigation (RSVP quick-bar) or elevated photo frames, only a soft whisper shadow is permitted:
  - `box-shadow: 0 4px 20px -2px rgba(59, 47, 42, 0.05)`
  This mimics natural light softly diffusing under heavy matte paper stock.

## Shapes

The design uses balanced, gentle curvature corresponding to roundedness tier `2`. 

- **Primary Cards & Containers**: Fixed at `12px` (`0.75rem` / `rounded-lg`) corner radii to soften screen bounds while keeping an architectural, tailored feel.
- **Interactive Buttons & Inputs**: Standardized at `8px` (`0.5rem`) for form inputs, calendar day selectors, and secondary action buttons.
- **Badges & Micro-Pills**: Small status chips (e.g., "D-Day", "신랑측", "신부측") may utilize full pill radii (`9999px`) to visually separate metadata badges from card containers.
- **Botanical / Decorative Motifs**: Fine single-stroke vector flourishes, floral line engravings, or subtle seal stamps maintain organic curves with hairlines under 1.25px.

## Components

### Buttons
- **Primary Action (e.g., RSVP Submit, Add to Calendar)**:
  - Background: `#C98B7B` (Dusty rose)
  - Text: `#FFFFFF`, Noto Sans 14px medium, letter spacing `0.02em`
  - Padding: `14px 24px`
  - Border radius: `8px`
  - Hover / Active: `#B6796A`
  - Shadows: None; rely entirely on solid pigment fill.
- **Secondary / Ghost (e.g., Copy Account Number, Call Venue)**:
  - Background: `#FDFBF7`
  - Border: `1px solid #EFE7DC`
  - Text: `#3B2F2A`, Noto Sans 13px medium
  - Hover: Background `#FAF6F0`, border color `#C98B7B`

### Cards
- Surface: `#FFFFFF` or `#FDFBF7`
- Border: `1px solid #EFE7DC`
- Radius: `12px`
- Padding: `24px 20px`
- Content Layout: Vertical stack, centered or left-aligned typography depending on context (editorial poetry centered; schedule and transit guides left-aligned).

### Calendar & D-Day Module
- Grid: 7-column calendar, minimal typographic layout.
- Selected / Event Day: Filled circle `#C98B7B` with white text, or soft blush circle `#F4E7E2` with `#3B2F2A` text.
- D-Day Pill: Background `#F4E7E2`, text `#C98B7B`, font size `11px`, bold, uppercase, padding `4px 10px`, pill shape.

### Input Fields & Selectors
- Background: `#FFFFFF`
- Border: `1px solid #EFE7DC`
- Border radius: `8px`
- Padding: `12px 14px`
- Focus State: Border color `#C98B7B`, outline none.
- Placeholder text: `#A89F97`

### Radios & Checkboxes
- Size: `18px` by `18px`
- Unchecked: `1px solid #EFE7DC` over `#FFFFFF`
- Checked: `#C98B7B` fill with crisp ivory center dot or check glyph.
- Label: `#3B2F2A`, Noto Sans 14px regular.

### Accordions (e.g., Bank Account Details)
- Closed State: Clean row with delicate downward chevron, subtle divider line `#EFE7DC`.
- Expanded State: Soft wash background `#FDFBF7` revealing account numbers and "Copy" ghost button.

### Botanical & Divider Motifs
- Section breaks: `1px` horizontal hairline `#EFE7DC` with a centered modest floral emblem or four-point star ornament in `#C98B7B` with `16px` padding surrounding the icon.