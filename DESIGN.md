# Design

This document details the visual style, design token parameters, typography scale, and layout guidelines for the temporary email administrative console.

## Register & Strategy
- **Register**: product (Administrative shell and Webmail console)
- **Palette Strategy**: Restrained Slate & Emerald. The surface is built on clean slate neutrals, using high-chroma emerald green as a precise primary accent to draw attention to statuses and actions.

## Palette
All color values are defined using OKLCH custom properties for wide gamut support and perceptual linearity.

| Role | Token Name | OKLCH Value | HEX Fallback | Purpose |
|---|---|---|---|---|
| Primary Accent | `--primary-color` | `oklch(0.68 0.17 154)` | `#10b981` | Emerald Green branding, buttons, success indicators |
| Accent Hover | `--primary-hover` | `oklch(0.62 0.16 154)` | `#059669` | Interactive hover states |
| Accent Active | `--primary-active` | `oklch(0.55 0.14 154)` | `#047857` | Button active press state |
| Accent Tint | `--primary-tint` | `oklch(0.96 0.03 154)` | `#ecfdf5` | Subtle badge or background highlight tints |
| App Background | `--bg-app` | `oklch(0.98 0.005 240)` | `#f8fafc` | Clean slate light background |
| Sidebar Background | `--bg-sidebar` | `oklch(0.12 0.02 240)` | `#09090b` | Dark slate navigation sidebar |
| Card Border | `--border-color` | `oklch(0.91 0.01 240)` | `#e2e8f0` | Slate dividers, grids, and boundaries |

## Typography

- **Font Family**: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif.
- **Hierarchy Scale**:
  - H1 Display heading: `24px` / `1.5rem`, weight `700` (Outfit/Inter)
  - H2 Subtitle: `18px` / `1.125rem`, weight `600`
  - Body text: `14px` / `0.875rem`, weight `400`
  - Small labels/meta text: `12px` / `0.75rem`, weight `500`

## Components

### Buttons
- **Primary Buttons**: Bound to `--primary-color`. Dark text (`#09090b`) is applied to guarantee a >= 4.5:1 contrast against the bright green emerald tone.
- **Secondary / Outlined Buttons**: Bound to Slate borders (`--slate-200` / `--slate-300`) with primary text.

### Dialog Modals
- Stylized using clean dark-bordered containers (`border: 1px solid var(--slate-800)`) with clear header divisions. Native Popovers or Fixed Portals prevent stacking context clipping.

## Spacing & Rhythm
- Spacing values follow standard 4px/8px grid scale factors (4px, 8px, 12px, 16px, 20px, 24px, 32px, 48px).
- Maximum body content width is restricted to `900px` for optimal reading scan line width.
