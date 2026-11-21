# 0004 — Offline evaluation

## Context

Evaluation must be possible without production accounts or billable provider requests.

## Decision

Include synthetic fixtures, a local editor preview and offline build commands. Make network access fail in engine tests and block external connections in offline server processes.

## Consequences

Offline checks establish transform and build behavior. They do not certify connected services or all browser flows.

## Alternatives considered

Requiring live accounts adds setup cost and introduces external state into deterministic checks.
