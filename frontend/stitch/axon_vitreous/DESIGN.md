# Design System: Liquid Glass Editorial

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Ethereal Workspace."** 

In a world of cluttered, boxy SaaS interfaces, this system treats the UI not as a collection of containers, but as a fluid, atmospheric environment. We are moving away from "Material" and toward "Atmospheric." The goal is to create a chat-centric AI workspace that feels like a high-end digital sanctuary—where information doesn't just sit on a screen, but floats within a deep, obsidian-glass medium.

By prioritizing **tonal depth over structural lines** and **asymmetric breathing room over rigid grids**, we achieve a signature look that feels premium, futuristic, and intentionally "un-templated."

---

## 2. Colors & Surface Philosophy
The palette is a sophisticated dark-mode study in midnight blues and soft grays, anchored by pure white highlights.

### The "No-Line" Rule
Traditional 1px borders are a relic of low-fidelity design. In this system, **sectioning via solid lines is prohibited.** Boundaries must be defined through:
- **Tonal Shifts:** A `surface-container-low` sidebar against a `surface` background.
- **Negative Space:** Using the spacing scale to create mental boundaries.
- **Backdrop Blurs:** Using the glass effect to "lift" an element out of the background.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers of frosted glass.
- **Base Layer:** `surface` (#0b1326) – The deep foundation.
- **Mid-Ground:** `surface-container` (#171f33) – For persistent navigation or sidebars.
- **Foreground (Floating):** `surface-container-high` (#222a3d) or `surface-container-highest` (#2d3449).

### The "Glass & Gradient" Rule
Floating elements (Modals, Hover Cards, Chat Bubbles) must utilize the **Liquid Glass** effect:
- **Background:** `rgba(255, 255, 255, 0.05)`
- **Backdrop-Filter:** `blur(24px) saturate(180%)`
- **Inner Glow:** A subtle `0.5px` inner-shadow using `primary` at 15% opacity to simulate light catching the edge of the glass.

---

## 3. Typography
We utilize **Inter** for its mathematical precision and neutral character, allowing the glass effects to take center stage.

- **Display (L/M/S):** Large, airy, and low-contrast. Use `display-lg` (3.5rem) with `-0.02em` letter-spacing for hero moments.
- **Headline & Title:** Use `headline-sm` (1.5rem) for chat headers. These should feel authoritative yet quiet.
- **Body:** `body-md` (0.875rem) is the workhorse. High readability is maintained by using `on-surface-variant` (#c4c7c9) to reduce harsh contrast.
- **Labels:** `label-sm` (0.6875rem) should be set in all-caps with `+0.05em` tracking to denote "Meta" information or AI statuses.

---

## 4. Elevation & Depth
Depth is not an effect; it is the primary navigation language of this system.

### The Layering Principle
Stacking containers creates logic. An AI preview card should be `surface-container-lowest` placed inside a `surface-container-high` message bubble. This "inverse nesting" creates a sense of recessed focus.

### Ambient Shadows
Forget "Drop Shadows." Use **Ambient Glows**:
- **Color:** A tinted version of the surface (#0b1326) or a soft `primary` glow for active AI states.
- **Values:** `0px 20px 40px rgba(0, 0, 0, 0.4)` – extremely diffused.

### The "Ghost Border" Fallback
Where accessibility requires a container edge, use the `outline-variant` (#444749) at **15% opacity**. This creates a suggestion of a border that only appears when light hits it.

---

## 5. Components

### Floating Chat Bubbles
- **Style:** Glassmorphism (`rgba(255, 255, 255, 0.05)`).
- **Rounding:** `xl` (1.5rem) to maintain the "Liquid" feel.
- **Interaction:** On hover, increase `saturate(180%)` to `saturate(250%)` to simulate "active energy."

### Glass Buttons
- **Primary:** `primary` (#ffffff) background with `on-primary` text. No shadow, but a subtle `4px` outer glow of its own color.
- **Secondary:** Transparent background with a `Ghost Border` and `backdrop-blur`.

### Input Fields
- **State:** `surface-container-lowest` background. 
- **Active:** Instead of a border color change, use a **Light-Leak** effect: a subtle gradient glow appearing at the bottom-edge of the input.

### Integrated Preview Cards
- **Rule:** Forbid divider lines. Separate metadata from content using `label-sm` typography and `8px` vertical gaps. Use `surface-bright` (#31394d) for hover states.

### AI Pulse (Signature Component)
A custom component for AI processing. A soft, breathing radial gradient using `secondary` (#b9c8de) at 10% opacity that expands and contracts behind the active glass container.

---

## 6. Do’s and Don'ts

### Do:
- **Do** use `9999px` (full) rounding for chips and small status indicators to emphasize the "Liquid" personality.
- **Do** lean into **Asymmetry**. Align text to the left but allow floating preview cards to offset slightly to the right to create a "canvas" feel.
- **Do** use Spring-based animations (`stiffness: 120, damping: 20`) for all glass movements.

### Don't:
- **Don't** use `#000000` (Pure Black). It kills the glass effect. Always use `surface` (#0b1326).
- **Don't** use standard `1px` dividers. If you need to separate content, use a 24px-48px vertical gap.
- **Don't** use high-saturation accent colors. Stick to the muted, monochromatic tones provided to ensure the "Premium" feel.