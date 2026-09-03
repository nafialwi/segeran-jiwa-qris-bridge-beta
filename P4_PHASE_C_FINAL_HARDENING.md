# P4 Final Hardening — Android QA Candidate

Status: **FINAL HARDENING LOCAL QA CANDIDATE — NOT YET P4 LOCKED — NOT DEPLOYED**

This candidate closes the two remaining RC5-D Android UI hardening items without changing finance semantics or persistence:

1. Bottom navigation now reconciles both REF01 and legacy active state so only one primary tab is visibly active after late Operational rendering.
2. LOCAL QA reconciliation mutation actions remain visible for audit but render explicitly as locked READ ONLY controls.

Safety remains unchanged: production untouched, LOCAL QA read-only, exact three-writer SC04 allowlist, destructive remove forbidden, P3 rollback unchanged.
