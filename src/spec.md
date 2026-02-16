# Specification

## Summary
**Goal:** Improve the color contrast and readability of the grave tile hover tooltip on the public “Map” tab in both light and dark themes.

**Planned changes:**
- Update the Map tab grave-hover tooltip styling (colors/typography/background) to ensure high-contrast, readable text in light mode and dark mode.
- Ensure the tooltip’s primary grave identifier line uses a stronger, high-contrast treatment, while secondary text remains clearly legible but visually secondary.
- Apply changes via UI composition/markup and local styling (without modifying Shadcn UI component source files and without any backend changes).

**User-visible outcome:** On the public Map tab, hovering a grave tile shows a tooltip whose grave identification and details are clearly readable in both light and dark themes.
