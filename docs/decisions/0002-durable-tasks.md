# 0002 — Durable tasks

## Context

Document translation combines long external requests, retries, persisted state and progress feedback.

## Decision

Use Trigger.dev tasks for orchestration. Keep I/O and status updates at task boundaries and pure transforms in the engine.

## Consequences

A connected installation needs a task project and validated service configuration. Checkpoints support recovery without treating model correctness as guaranteed.

## Alternatives considered

Inngest provides event and durable execution primitives. A synchronous HTTP request couples the work to an application request timeout.
