# Specification

## Summary
**Goal:** Show grave location (alley + plot/grave number) alongside status and deceased name in both public and admin grave search results.

**Planned changes:**
- Extend the backend public grave search result type and API response to include location fields (alley and plot/grave number) in addition to existing name and status.
- Update the public grave search results UI to display name, status badge, and a clear location line (alley + grave/plot number) for each result.
- Adjust the public in-memory search index builder (if needed) to handle the extended result shape without breaking filtering or rendering.
- Update the admin grave search results UI to prominently show location and status plus at least one deceased person’s name; show a clear placeholder when no deceased persons exist.

**User-visible outcome:** When searching for graves (public or admin), each result shows the deceased name, grave status, and the grave’s location (alley and plot/grave number) at a glance.
