# Task 001 Interview Authority Source Audit Review

## Verdict

Direction is correct.

This is the first Interview Authority task document so far that is written like an actual audit brief instead of an architecture note or inventory shell.

It is properly scoped as:

- discovery only
- runtime reality only
- evidence only

That is exactly right for this stage.

My conclusion:

`APPROVE AS EXECUTION-READY AUDIT TASK, WITH A FEW OUTPUT-CONSTRAINTS STILL WORTH TIGHTENING`

## What This Task Gets Right

### 1. It correctly forbids architecture drift

The strongest lines in the task are:

```text
This is an audit task, not an architecture task.
Do not redesign the system.
Do not create new abstractions.
Do not propose future architecture.
```

That is the correct constraint.

Earlier documents were still mixing:

- what should be audited
- what V7 should become

This task separates those cleanly.

That is a real improvement.

### 2. It asks for current runtime reality, not categories

The required output is now concrete:

- exact file path
- source name
- authority role
- read path
- write path
- data class
- active status
- migration risk

That is the right granularity.

This is the first version that is close to a repo-backed source audit rather than a planning template.

### 3. It scopes the source domain correctly

The task focuses on the correct current source areas:

- Interview Runtime
- Profile Storage
- Extraction Systems
- Slot Collection Systems

That matches the real V7.1 source problem.

It does not drift into downstream authority migration prematurely.

### 4. It includes duplicate authority detection

This is important.

The task does not just ask:

- where does data exist

It also asks:

- where is it duplicated

That is exactly what an authority audit must surface before migration starts.

### 5. It requires ownership mapping to the four target projections

This is the correct bridge from audit to migration planning:

- `InterviewProfileSnapshot`
- `BusinessModeSnapshot`
- `AudienceSnapshot`
- `BusinessContextSnapshot`

And it explicitly allows:

```text
UNRESOLVED
```

That is good. It prevents fake certainty.

### 6. The deliverables are finally concrete

These three deliverables are the right outputs:

1. `audit/interview-authority-source-inventory.md`
2. `audit/interview-authority-duplicate-authorities.md`
3. `audit/interview-authority-source-summary.md`

That is much better than generic "report" language.

It gives the audit a real endpoint.

## Why This Task Matters In This Codebase

Interview Authority is the lowest layer in the V7 stack.

If this audit is weak, everything above it inherits unstable assumptions about:

- who the user is
- who the audience is
- what business mode the system thinks they are in
- which parts are fact versus inference versus strategy

That would contaminate:

- Business State
- Journey
- AI COO
- domain consumers

So this task is foundational.

## Main Architectural Strength

The strongest aspect of this task is that it converts the earlier audit shells into a concrete repository-discovery brief.

It now tells the executor:

- what to scan
- what to record
- how to classify it
- what files to produce

That is the right level of operational specificity.

## Main Risks

### 1. "Audit the entire repository" is directionally right, but still broad

The task says:

```text
Audit the entire repository.
```

That is defensible, but still potentially too open-ended for consistent execution.

In practice, the audit should prioritize:

- `src/modules/brand-builder/**`
- `src/modules/brand-discovery/**`
- `src/modules/brand-intelligence/**`
- routes that read/write `BrandProfile` or `metadata.brand_profile`
- any service that computes audience or business context from interview-derived data

Otherwise the executor may waste time touching distant surfaces that are only incidental consumers.

### 2. It still does not define how to count "active" cleanly

The task asks for:

- `Active Status: Active / Legacy / Unknown`

That is useful, but it needs a slightly tighter standard.

For example:

- active runtime consumer
- legacy fallback still read
- dead code with zero runtime references

Those cases should not all collapse into broad labels without criteria.

### 3. `Migration Risk` is useful, but currently underdefined

The task asks for:

- Low / Medium / High

That is fine, but to keep results consistent the task should imply what drives that rating.

For example:

- number of consumers
- source duplication
- write-path complexity
- inference fragility
- fallback reliance

Without those drivers, risk scoring may become subjective.

### 4. The task does not explicitly require source precedence as a dedicated output

This is the main missing instruction.

The background work already established that source precedence is one of the hardest Interview Authority issues:

- confirmed extraction
- latest extraction
- dialogue slots
- `BrandProfile`
- metadata fallback

The task implies this through ownership mapping, but it should be more explicit that precedence findings must be documented in the output.

### 5. Consumer-side reads are mentioned, but this is still mostly a source audit

That is acceptable, but there is a subtle risk:

if the source audit only documents:

- what writes a source
- what directly reads a source

without tracing indirect consumers,

then later migration work will still discover hidden readers.

The task is mostly strong enough, but this is the area most likely to leak.

## What Should Be Tightened

### 1. Make source precedence an explicit required section

The task should effectively require:

```text
Projection Source Precedence Findings
```

for:

- profile
- audience
- business mode
- context

That keeps the audit aligned with the real blocker.

### 2. Define `Active / Legacy / Unknown` more concretely

For example:

- `Active`: currently read or written by runtime consumer paths
- `Legacy`: still present, but only fallback or transitional
- `Unknown`: cannot yet prove runtime status

That would make the audit outputs easier to compare and trust.

### 3. Add a short rule for migration risk scoring

Even one sentence would help:

- High = multiple consumers, duplicated writes, or unclear authority
- Medium = single-source but multi-consumer or inference-heavy
- Low = isolated source with clear ownership

That would improve audit consistency.

### 4. Require unresolved findings to be listed separately

The task already allows `UNRESOLVED` ownership mapping.

Good.

It should also strongly imply a final section like:

```text
Unresolved Source Findings
```

So blockers are visible without searching the whole inventory.

## Final Judgment

This is a strong task brief.

It is the first Interview Authority audit document in this sequence that is actually close to execution-ready.

It is concrete, appropriately narrow, and correctly forbids architecture drift.

My final judgment:

`APPROVE AS TASK DIRECTION`

The main remaining improvements are:

- make source precedence an explicit required output
- tighten status definitions
- tighten risk-rating criteria

But even without those, this task is already usable as a real audit brief.
