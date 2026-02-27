# Specification

## Summary
**Goal:** Replace the existing tile-based navigation on the public page with a sticky top navigation bar containing four labeled sections.

**Planned changes:**
- Add a sticky horizontal navigation bar below the existing Header component in `PublicPage.tsx` with four items: "Mapa grobów", "Wyszukiwanie", "Modlitwa za zmarłych", "Nasz cmentarz"
- Active navigation item is visually distinguished from inactive items
- Clicking a nav item smoothly reveals/scrolls to the corresponding content section
- Remove the existing `PublicSectionsTiles` grid component from the public page
- Navigation bar is responsive and works on both desktop and mobile

**User-visible outcome:** Users can quickly switch between the four cemetery sections (Grave Map, Search, Prayer, Cemetery Info) using a clean sticky navigation bar at the top of the page, replacing the old large tile grid.
