# Specification

## Summary
**Goal:** Publish the current successful build (version 64) to the Live environment.

**Planned changes:**
- Deploy build version 64 to Live.
- If needed to trigger redeploy, add an operational redeploy trigger file at `frontend/redeploy-trigger.build64.txt` modeled after the build 63 trigger file, with no functional changes.

**User-visible outcome:** The Live URL serves build 64 successfully without deployment errors.
