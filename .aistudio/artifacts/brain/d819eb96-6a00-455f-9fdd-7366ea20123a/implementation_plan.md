# Sticky Sub-Tab Transparent Floating Navigation

Eliminate the full-width rectangular dark strip behind the sticky sub-tabs by making the container background completely transparent, allowing the pill navigation to float seamlessly above the view content.

### User Review & Critical Decisions

> [!IMPORTANT]
> The exact visual source of the persistent black bar has been confirmed: the full-width rectangular dark strip generated behind the sticky sub-tab bar.

- **Confirmed Decision (Background)**: The sticky sub-tab bar wrapper will be completely transparent (`bg-transparent`), stripping out the rectangular dark backdrop (`bg-slate-950/95`) and blur layer so no dark band spans the screen.
- **Confirmed Decision (Capsule & Indicator)**: The rounded capsule track and the active tab's soft inner pill indicator (rounded border with soft shadow) will be preserved, ensuring clear visual selection without rigid outer borders.

---

### 1. Overview & Core Concept

- **What It Does**: Transposes the sticky sub-tab bar into a floating, transparent navigation header. The segmented control capsule floats directly over the main view content without any dark rectangular background strip or outer boundary lines.
- **Target Audience / Persona**: Mobile and tablet health tracking users switching between view segments (e.g., Overview, Trends, History).
- **Key Value**: Delivers an organic, borderless modern mobile aesthetic with zero visual clutter or contrasting black strips.

---

### 2. User Experience & Visual Design

- **Key User Flows**: When scrolling down the page, the segmented control smoothly sticks to the top of the viewport. Because the container is completely transparent, the page background flows naturally underneath the floating capsule.
- **Visual Identity & Theme**:
  - *Container Posture*: Completely transparent sticky header (`bg-transparent`, zero outer borders, zero background opacity).
  - *Capsule Track*: Centered floating capsule (`rounded-full`) with soft neutral backdrop (`bg-slate-200/60 dark:bg-slate-900/70`) and subtle boundary.
  - *Active Tab Indicator*: Clean pill highlight (`bg-white dark:bg-slate-800 rounded-full shadow-xs border border-slate-200/70 dark:border-slate-700/60`) providing depth and tactile feedback.
- **Interactive Feedback**: Touch-friendly tap targets, smooth animated indicator transitions, and natural drag/scroll physics without visual artifacting.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Complete Transparency vs. Translucent Blur Bar**
  - *Chosen Approach*: Completely transparent container without full-width background color or backdrop filter.
  - *Why*: Eliminates the dark band reported in screenshots while letting the capsule float with maximum visual lightness.
  - *Alternatives Considered*: Retaining a semi-transparent dark tint (`bg-slate-950/40`), which created the rectangular dark strip.

- **Decision 2: Pill Contrast & Hierarchy**
  - *Chosen Approach*: Maintain the active pill's soft rounded border and elevation shadow.
  - *Why*: Preserves accessibility and high affordance so users clearly know which sub-tab is active even over varying content.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│ App Global Header (Brand, Badges, Dark Mode)          │
├────────────────────────────────────────────────────────┤
│ Sticky Sub-Tab Zone (Completely Transparent Wrapper)   │
│   ┌──────────────────────────────────────────────────┐ │
│   │ [ Active Pill ]   [ Inactive Tab ]   [ Tab 3 ]   │ │  <- Floating capsule
│   └──────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────┤
│ Active View Content (Metrics, Timeline, Panels)        │
└────────────────────────────────────────────────────────┘
```

- **Interactive Mapping**: The sticky wrapper applies pure layout positioning (`sticky top-0 z-30 py-2.5 px-4 bg-transparent`) without color fills or borders. The child track manages horizontal scrolling and pill geometry.
