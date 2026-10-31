# ADR 004 — Free-tier sizing vs production sizing

## Context

The assignment asks for a realistic AWS-shaped system while controlling cost for a demo.

## Decision

**Deploy** Atlas M0, EC2 micro, Redis in Docker on the instance, S3 + CloudFront. **Document** larger sizes (Atlas M10, ElastiCache, more API capacity) as the production target without paying for them in the demo.

## Alternatives

- Always deploy “production” sizes — expensive for an assessment.
- Skip AWS realism — weaker system-design signal.

## Consequences

- Live architecture matches the HLD shape at small scale.
- Capacity claims must stay tied to k6 **local** evidence, not the demo tier.
