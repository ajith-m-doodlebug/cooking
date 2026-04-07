# Design System: Editorial Authority

## 1. Overview & Creative North Star
**The Creative North Star: "The Architectural Ledger"**

This design system moves away from the sterile, "template-driven" look of traditional financial services. Instead, it adopts an **Editorial Authority** aesthetic—blending the prestige of a high-end business journal with the precision of modern architecture. 

We break the "standard" web layout by utilizing **intentional asymmetry** and **tonal layering**. Elements should feel like they are curated on a physical desk: heavy paper stocks (surfaces) layered with semi-transparent vellum (glassmorphism). We prioritize breathing room over borders, using white space as a structural element to convey a sense of calm, calculated confidence.

---

## 2. Colors & Surface Philosophy
The palette is rooted in Earth-toned professionalism. We avoid "digital pure blacks" and "pure whites" to maintain a sophisticated, organic feel.

### The Palette
- **Primary (`#486264`):** Our anchor. Used for high-level branding and serious structural elements.
- **Secondary (`#a53c09`):** The "Highlight." Used sparingly for high-impact CTAs. It represents the "pen stroke" on a balanced ledger.
- **Neutral/Surface (`#fff8f4`):** A warm, off-white base that prevents eye strain and feels more premium than standard white.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders for sectioning or card containment. Boundaries must be defined solely through:
1. **Background Color Shifts:** Placing a `surface-container-low` section against a `surface` background.
2. **Tonal Transitions:** Using subtle shifts in the neutral scale to denote content blocks.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Use the `surface-container` tiers to create depth:
- **Base Level:** `surface` (The desk).
- **Secondary Level:** `surface-container-low` (A large blotter or section).
- **Primary Content Level:** `surface-container-lowest` (The "white paper" or primary card).
- **Raised Level:** `surface-container-high` (Active elements or navigation).

### The "Glass & Gradient" Rule
To add "soul," use subtle linear gradients (e.g., `primary` to `primary_container`) on hero backgrounds. For floating navigation or modal overlays, use **Glassmorphism**: apply a semi-transparent surface color with a `backdrop-blur` of 12px–20px to allow the sophisticated palette to bleed through.

---

## 3. Typography
We use a high-contrast pairing to balance "The Authority" (Serif) with "The Precision" (Sans-Serif).

- **Headings (Newsreader):** A sophisticated serif. This conveys the history and trustworthiness of a Chartered Accountant. 
    - *Usage:* `display-lg` through `headline-sm`. Use tight letter-spacing for large displays to feel like a premium magazine header.
- **Body & UI (Manrope):** A modern, geometric sans-serif. This represents the modern, tech-forward side of the practice.
    - *Usage:* `body-lg` for readability, `label-md` for data-heavy tables.

**Hierarchy Note:** Always lead with a serif headline. Use the `secondary` (Terracotta) color for small `label-md` accents above headlines to create an "Editorial Tag" look.

---

## 4. Elevation & Depth
Depth is achieved through **Tonal Layering**, not structural lines.

- **The Layering Principle:** Stack `surface-container-lowest` cards on top of `surface-container-low` backgrounds. This creates a soft "lift" that feels integrated.
- **Ambient Shadows:** When a card must float (e.g., a hover state), use an ultra-diffused shadow:
    - `Box-shadow: 0 20px 40px rgba(35, 26, 16, 0.06);` (Note the use of `on_surface` color for the shadow tint rather than pure black).
- **The "Ghost Border" Fallback:** If accessibility requires a border, use `outline-variant` at **15% opacity**. Never use a 100% opaque border.
- **Geometric Patterns:** Incorporate subtle, low-opacity geometric line art (based on the `outline-variant`) behind hero sections to mimic the structure of a graph or ledger.

---

## 5. Components

### Buttons
- **Primary:** Background `secondary`, text `on_secondary`. Use `md` (0.375rem) roundedness. No shadow; use a subtle scale-up on hover.
- **Secondary:** Background `primary`, text `on_primary`. 
- **Tertiary (The "Editorial" Link):** No background. Text `primary`, bold weight. Use a 2px `secondary` underline that spans only 50% of the text width, moving to 100% on hover.

### Cards & Information Blocks
- **Forbid Dividers:** Use vertical white space (Spacing scale `8` or `12`) to separate items.
- **Layout:** Use asymmetric padding. For example, `padding-left: 2.75rem (8)` and `padding-right: 4rem (12)` to create a modern, off-center professional feel.

### Input Fields
- **Style:** Underline-only or subtle `surface-container-highest` fills.
- **Focus State:** Transition the underline to `secondary` (Terracotta).

### Signature Component: The "Data Ledger"
A custom list component for financial summaries. Use `surface-container-lowest` for the container. Instead of lines, use alternating background tints (`surface-container-low`) for every second row to ensure readability.

---

## 6. Do’s and Don'ts

### Do:
- **Do** use large amounts of `surface` space. The design should feel "expensive" through its refusal to clutter.
- **Do** align serif typography to the left, but consider right-aligning specific "call-out" stats for an asymmetrical balance.
- **Do** use `secondary_container` for soft highlights behind specific words in a headline.

### Don’t:
- **Don’t** use standard "Icon boxes" with heavy borders. Use a simple icon in `primary` color sitting freely on the grid.
- **Don’t** use pure black `#000000` for text. Always use `on_background` (`#231a10`) to maintain the warm, sophisticated tone.
- **Don’t** use harsh 90-degree corners. Stick to the `md` (0.375rem) roundedness scale to keep the "Modern" feel.
- **Don't** use generic stock photography of handshakes. Use architectural shots of modern office structures or high-end textures (marble, fine paper, slate).

---

## 7. Spacing Scale
Utilize the Spacing Scale to create "Rhythm":
- **Section Gaps:** Use `20` (7rem) or `24` (8.5rem) to separate major service areas.
- **Internal Card Padding:** Use `6` (2rem) or `8` (2.75rem) to give data plenty of room to breathe.