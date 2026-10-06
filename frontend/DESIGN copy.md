---
name: Lumina Events
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#464555'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#006c4a'
  on-secondary: '#ffffff'
  secondary-container: '#82f5c1'
  on-secondary-container: '#00714e'
  tertiary: '#703a00'
  on-tertiary: '#ffffff'
  tertiary-container: '#934e00'
  on-tertiary-container: '#ffd2b1'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#85f8c4'
  secondary-fixed-dim: '#68dba9'
  on-secondary-fixed: '#002114'
  on-secondary-fixed-variant: '#005137'
  tertiary-fixed: '#ffdcc3'
  tertiary-fixed-dim: '#ffb77d'
  on-tertiary-fixed: '#2f1500'
  on-tertiary-fixed-variant: '#6e3900'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-sm:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-sm: 0.75rem
  margin: 1rem
  margin-md: 1.5rem
  margin-lg: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

The design system embodies a modern, welcoming, and high-trust community atmosphere. Designed specifically for an event community platform, the aesthetic balances structural clarity with refined social warmth. The target audience encompasses active community organizers, professionals, and attendees who demand frictionless event management and RSVP workflows.

The visual style is **Corporate / Modern** elevated by tactile digital craftsmanship. It pairs crisp, airy surfaces with vibrant indigo accents, conveying momentum, authority, and collective energy. High contrast is preserved across all informational states, ensuring accessibility while retaining an editorial, premium mobile-first feel.

## Colors

The palette establishes an intentional hierarchy driven by utility and community feedback states:

- **Primary (`#4F46E5` - Vibrant Indigo):** Drives dominant interactive cues, key action triggers, focused states, and community branding anchors.
- **Secondary (`#059669` - Emerald):** Reserved strictly for confirmed states, active memberships, paid ticket confirmations, and success affirmations.
- **Tertiary (`#D97706` - Amber):** Applied to pending reservations, waitlists, action-required warnings, and payment review states.
- **Neutral (`#0F172A` - Slate Neutral):** Provides crisp typography rendering and structured surface definition over light foundation tones.

Canvas surfaces rely on clean, ultra-light slate foundations (`#F8FAFC` background with pure `#FFFFFF` structural elevated cards) to keep content scanning effortless.

## Typography

Typography pairs the approachable, geometric curves of **Plus Jakarta Sans** for titles and headers with the systematic legibility of **Inter** for informational tables, lists, and body copy.

All display titles employ tight letter spacing to project modernity and editorial confidence. Body text favors open line heights to maximize readability on high-density mobile screens during motion. Badge labels use uppercase styling with positive tracking strictly at `label-sm` to ensure immediate status recognition.

## Layout & Spacing

The layout is built upon a fluid mobile-first column model with responsive boundary constraints:
- **Mobile (default, up to 639px):** 4-column layout with `1rem` (16px) margins and `0.75rem` (12px) gutters. Content spans full width or symmetric halves.
- **Tablet (640px - 1023px):** 8-column layout with `1.5rem` (24px) margins and `1rem` (16px) gutters. Event grids scale to 2-column configurations.
- **Desktop (1024px+):** 12-column layout capped at a maximum width of `1200px`, centered with fluid auto margins.

The spacing rhythm strictly uses multiples of `0.25rem` (4px base unit). Card stack layouts rely on `space-md` gaps, while nested metadata pairs use `space-xs` and `space-sm`.

## Elevation & Depth

Visual depth is achieved through subtle, neutral surface tinting coupled with diffused ambient shadows:

- **Level 0 (Flat / Canvas):** Neutral background (`#F8FAFC`) with no shadow.
- **Level 1 (Card & List Tile):** Surface `#FFFFFF`, border `1px solid #E2E8F0`, shadow `0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)`.
- **Level 2 (Interactive Hover / Floating Action Bar):** Surface `#FFFFFF`, border `1px solid #CBD5E1`, shadow `0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04)`.
- **Level 3 (Modal Sheet / Avatar Customization Dialog):** Surface `#FFFFFF`, shadow `0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.06)`, framed over a `rgba(15, 23, 42, 0.4)` backdrop blur overlay.

## Shapes

The design system implements **Roundedness 2**:
- Base components (buttons, input fields, badges): `0.5rem` (8px) radius.
- Medium containers and cards (`rounded-lg`): `1rem` (16px) radius.
- Large bottom sheets and prominent dialog surfaces (`rounded-xl`): `1.5rem` (24px) radius.
- User avatars and pill tags utilize continuous circular borders (`rounded-full`).

## Components

### Buttons
- **Primary:** Filled `#4F46E5` with `#FFFFFF` text. Minimum touch target `44px` height, horizontal padding `1.25rem`, radius `0.5rem`.
- **Secondary:** Surface `#EEF2FF`, text `#4F46E5`, border `1px solid transparent`.
- **Outline / Ghost:** Background transparent, text `#0F172A`, border `1px solid #E2E8F0`.

### Status Badges & Chips
- **Confirmed / Paid:** Surface `#ECFDF5`, text `#065F46`, border `1px solid #A7F3D0`.
- **Pending / Unpaid:** Surface `#FFFBEB`, text `#92400E`, border `1px solid #FDE68A`.
- **Category Filter Chips:** Neutral inactive `#F1F5F9` with `#475569` text. Active state uses `#4F46E5` fill with white text.

### Cards
- **Event Card:** White surface, `1rem` rounded corners, subtle `1px solid #E2E8F0` border, `1rem` internal padding. Features an aspect ratio thumbnail, status badge placed in the upper-right corner, bold title, and attendee avatar pile at the bottom.

### Inputs & Form Elements
- **Input Fields:** Base height `44px`, background `#FFFFFF`, border `1px solid #CBD5E1`, text `#0F172A`, radius `0.5rem`. Focused state shifts border to `#4F46E5` accompanied by a `2px` concentric ring in `rgba(79, 70, 229, 0.15)`.

### Avatar Customization Modal
- Bottom sheet layout on mobile (`rounded-t-[1.5rem]`), centered modal on desktop.
- Displays a central preview avatar (`80px` or `96px` circle with an edit ring badge).
- Preset picker provides a grid of interchangeable accessory/color swatches with a prominent active border (`#4F46E5`).
- Includes integrated sticky CTA button pinned to the sheet base.