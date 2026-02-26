# Specification

## Summary
**Goal:** Fix three bugs in Cemetery Manager: prevent data loss when changing a grave's plot number, enforce consistent alley sorting everywhere, and add a confirmation safeguard before plot number changes.

**Planned changes:**
- Fix backend grave number change logic to be atomic: copy all grave data (deceased persons, owner, status, payment info) to the new key, remove the old key, and keep the parent alley fully intact with updated grave references
- Reject plot number changes if the new number already exists, returning an error instead of overwriting
- Apply consistent alphabetical/numerical sorting to all backend endpoints that return alley lists
- Apply client-side alphabetical/numerical sorting of alleys in AdminGraveTileMap, CemeteryLayoutManager, GraveTileMap, and GraveResultsList as a reliable fallback
- Add a confirmation dialog in GraveEditDialog that appears specifically when the plot number field is changed, warning the admin before the save is executed

**User-visible outcome:** Admins can safely change a grave's plot number without losing alley data or other graves. Alleys always appear in a predictable sorted order across all views. A confirmation prompt prevents accidental plot number changes.
