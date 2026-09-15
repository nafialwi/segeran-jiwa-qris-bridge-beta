# CUP-02 Authorization Incident

Status: candidate fix only; **not published**.

Production anchor: `8018c40ae74f0b01d8b31d558828d26cd867bca2`

Actual deployed rules export SHA-256:
`8e0e9fc7868a2a741128324f057d7a4ba338545486dff2f4a60c97f8930f8c74`

Evidence from the 15 Sep 2026 live incident isolates the failure boundary to
Inventory V2 reservation lifecycle after a successful `PREPARING` create and
successful balance reserve/rollback evidence.

The deployed reservation rule compares the structured `consumption` map with
`RuleDataSnapshot.val()`. The CUP-02 candidate removes post-create parent
write authority and grants only explicit lifecycle child transitions. It adds
no write authority under `consumption`.

Emulator gate for this run: **PASS**.

- Production Firebase writes performed by this package: **none**
- Firebase Rules published by this package: **no**
- POS runtime source changed: **no**
- Existing Inventory V2 writer remains canonical.
