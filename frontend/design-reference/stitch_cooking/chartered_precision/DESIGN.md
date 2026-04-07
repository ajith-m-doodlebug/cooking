# Design System Specification: The Architectural Authority

## 1. Overview & Creative North Star
**Creative North Star: "The Modern Archivist"**
This design system moves beyond the standard corporate template to create a high-end, editorial experience for the Chartered Accountancy (CA) sector. It rejects the "lightweight" feel of typical SaaS platforms in favor of a dense, authoritative aesthetic that communicates precision, legacy, and unwavering professional rigor. 

The visual identity is defined by **Intellectual Density**. We utilize a sophisticated interplay of Newsreader (Serif) for narrative authority and Manrope (Sans) for data-driven clarity. By favoring tonal layering over structural lines, we create a UI that feels carved from a single block of marble—solid, permanent, and premium.

---

## 2. Color & Tonal Architecture
The palette is rooted in Slate Green and Terracotta, balanced by a sophisticated Warm Grey. To maintain a "strict" and "pure" feel, we adhere to a rigid execution of surface hierarchy.

### The Palette
- **Primary (#607B7D - Slate Green):** The color of stability. Used for primary actions and key structural headers.
- **Secondary (#595F61 - Dark Slate):** The color of authority. Used for high-level navigation and dense information blocks.
- **Tertiary (#E76C39 - Terracotta):** The "Precision Accent." Used sparingly for high-value CTAs or critical status indicators.
- **Neutral (#9E8F80 - Warm Grey):** Used for metadata, secondary labels, and de-emphasized content.

### The "No-Line" Rule
**Explicit Instruction:** Traditional 1px solid borders are prohibited for sectioning. Boundaries must be defined through background color shifts.
- **Surface-to-Surface Transition:** To separate a "Client Portal" section from the "Main Dashboard," move from `surface` (#FFFFFF) to `surface-container-low` (#FFF1E6). 
- **The "Glass & Gradient" Rule:** For hero sections, use a subtle linear gradient from `primary` (#486264) to `primary-container` (#607B7D) at a 135-degree angle. This provides a "brushed steel" texture that feels more expensive than flat color.

---

## 3. Typography
The typographic system is designed for high readability in dense financial contexts. **Italics and cursive variants are strictly forbidden.**

| Level | Token | Font | Size | Weight/Style |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | `display-lg` | Newsreader | 3.5rem | Semi-Bold, No Italics |
| **Headline** | `headline-md` | Newsreader | 1.75rem | Medium |
| **Title** | `title-lg` | Manrope | 1.375rem | Bold |
| **Body** | `body-md` | Manrope | 0.875rem | Regular |
| **Label** | `label-sm` | Manrope | 0.6875rem | Extra-Bold (All Caps) |

**Editorial Intent:** Use `display-lg` for value propositions. The Serif (Newsreader) provides the "Trust" factor, while the Sans (Manrope) handles the "Data" execution.

---

## 4. Elevation & Depth: Tonal Layering
In this design system, we do not use shadows to create "pop"; we use them to create "presence."

- **The Layering Principle:** Depth is achieved by stacking surface tiers. A card component (`surface-container-lowest`) should sit on a section background of `surface-container-low`. The 0.1rem color shift is enough to define the edge without a harsh line.
- **Ambient Shadows:** For floating modals or "Large SaaS-style" components, use a shadow with a 40px blur and 4% opacity, tinted with the `on-surface` (#231a10) color. This mimics natural light filtered through an office window.
- **The "Ghost Border":** If a data table requires containment, use the `outline-variant` token at **15% opacity**. It should be felt, not seen.
- **Glassmorphism:** For top navigation bars, use `surface` at 80% opacity with a `backdrop-filter: blur(20px)`. This keeps the "Pure White" background visible while providing a premium, layered feel.

---

## 5. Components & Primitive Styling

### Large SaaS Buttons
- **Primary:** Background `primary` (#486264), Text `on-primary` (#FFFFFF). Radius `md` (0.375rem). Use a 2px bottom "press" shadow of a darker shade for a tactile, heavy feel.
- **Secondary:** Background `surface-container-high`, Text `primary`. No border.

### Editorial Cards & Lists
- **Rule:** Forbid the use of divider lines between list items.
- **Implementation:** Separate financial line items using `spacing-4` (0.9rem) and a subtle hover state shift to `surface-container`. 
- **Rounding:** Use `lg` (0.5rem) for cards to maintain a professional, soft-but-sturdy corner.

### Sophisticated Inputs
- **Field Styling:** Inputs should be large (`spacing-12` height). Instead of a full border, use a "heavy bottom" approach—a 2px baseline in `outline-variant` that shifts to `primary` on focus.
- **Dense Labels:** Labels use `label-sm` (Manrope, Extra-Bold, All Caps) positioned 0.4rem above the input field to create a "form-ledger" look.

### The "Audit" Chip
- Used for status (e.g., "Pending," "Verified"). Use `surface-container-highest` with `on-surface-variant` text. High contrast, no border, `full` radius.

---

## 6. Do’s and Don’ts

### Do:
- **Use Asymmetry:** Place a large `display-lg` headline on the left with a dense `body-md` paragraph tucked into a narrow column on the right. This mimics high-end financial broadsheets.
- **Respect White Space:** Use `spacing-24` (5.5rem) between major sections to let the "Pure White" background feel intentional and expensive.
- **Embrace Density:** In data views, use `body-sm` with increased line-height (1.6) to fit more information without sacrificing legibility.

### Don't:
- **No Italics:** Never use italics for emphasis. Use Font-Weight (Bold) or the Tertiary color (#E76C39) instead.
- **No 1px Black Borders:** These are the hallmark of amateur design. Use color-tiering to define edges.
- **No Cursive/Script Fonts:** These undermine the "Strict and Authoritative" tone required for a CA firm.
- **No Floating "Islands":** Avoid components that look like they are drifting. Every element should feel anchored to the grid or a parent surface container.