# 0005 — Service configuration

## Context

Credentials and deployment identifiers belong to the installing operator. Browser-safe keys have a different exposure boundary from server credentials.

## Decision

Declare application settings in one typed environment schema, document every key and reject missing values. Initialize export credentials at the adapter boundary.

## Consequences

Connected commands require complete configuration. The offline runner deliberately supplies inert values for local evaluation.

## Alternatives considered

Hardcoded deployment values obscure ownership and can expose secrets. Silent credential defaults make configuration errors harder to detect.
