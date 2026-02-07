# Specification

## Summary
**Goal:** Make the four homepage navigation tiles the only primary entry points to Map, Search, Prayer for the deceased, and Our cemetery; ensure tile clicks open full section views; and enable admin editing of Prayer/Our cemetery content.

**Planned changes:**
- Update the public homepage to remove any duplicate Map/Search call-to-action buttons outside the four main navigation tiles.
- Implement tile click behavior so each tile opens its corresponding full view/section:
  - Map tile opens the full map view.
  - Search tile opens the full grave search view.
  - Prayer for the deceased and Our cemetery sections are not rendered by default and only appear after clicking their tiles, with the page scrolling to the revealed section.
- Restyle the four tiles to the requested look (large, readable, rounded corners, subtle shadow, and hover brightening with gold accent), with consistent light/dark mode palette and responsive layout.
- Extend the management panel (post Internet Identity login) to support editing and saving (without full page reload) the titles and rich HTML bodies (including quotes) for Prayer for the deceased and Our cemetery, and reflect updates on the public homepage.

**User-visible outcome:** Visitors use the four homepage tiles as the sole entry points to Map/Search and to reveal Prayer/Our cemetery content; managers can edit Prayer and Our cemetery titles and HTML content (including quotes) and save changes without reloading the page.
