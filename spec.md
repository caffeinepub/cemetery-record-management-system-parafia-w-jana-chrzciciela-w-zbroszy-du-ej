# Specification

## Summary
**Goal:** Add grave number editing and grave deletion capabilities to the admin panel, accessible from both the tile map view and the grave management list.

**Planned changes:**
- Add an edit action for graves in both `AdminGraveTileMap` and `GraveManagement` views, allowing the admin to change the plot number (and alley) via an edit dialog/form
- Validate that the plot number is not empty or duplicated within the same alley before saving
- Persist grave edits to the backend via an `updateGrave` (or equivalent) function
- Immediately reflect updated plot numbers in the map and list views after saving
- Add a delete action for graves in both `AdminGraveTileMap` and `GraveManagement` views
- Show a confirmation dialog before executing any deletion
- Remove the deleted grave from the map and list views immediately after confirmed deletion
- Expose a `deleteGrave` (or equivalent) backend function that removes a grave by its identifier

**User-visible outcome:** Admin users can edit a grave's plot number and delete graves directly from the tile map view and the management list, with confirmation required before deletion.
