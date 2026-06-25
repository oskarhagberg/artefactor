export class DomainError extends Error {}

// Raised when an aggregate invariant would be violated.
export class InvariantViolation extends DomainError {}
