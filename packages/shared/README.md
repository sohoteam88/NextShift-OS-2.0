# @nextshift/shared

Shared engineering kernel for NextShift OS.

This package contains shared primitive types, branded identifiers, result types, errors, metadata, context, and pagination utilities.

## Rules

- This package must remain business-agnostic.
- This package must not depend on business packages.
- Business packages may depend on this package.
- Do not implement business logic here.
