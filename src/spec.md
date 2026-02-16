# Specification

## Summary
**Goal:** Eliminate false “server unavailable” warnings by confirming real backend connectivity via a lightweight health check, and improve reconnect UX and messaging consistency.

**Planned changes:**
- Add a fast, anonymous-safe backend health-check query method (e.g., ping/health) in the Motoko actor.
- Update frontend connection logic to treat the backend as “connected” only when the health-check succeeds (rather than relying solely on actor initialization timing).
- Improve `ConnectionStatus` UX to show a neutral “Connecting to server…” state during initial checks, avoid premature error states, and provide a “Retry” control to re-run health-check/actor connection logic without a full refresh.
- Standardize connectivity-related user-facing errors to English and align wording with the connection banner, without changing authorization error handling.
- Produce a clean rebuild/redeploy ensuring Public and Admin pages still load and function without new connection-related regressions.

**User-visible outcome:** Users see a “Connecting to server…” status during startup, do not get false “server unavailable” warnings when the backend is reachable, can retry connection from the banner, and see consistent English connectivity messages across the app.
