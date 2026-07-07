# NextShift Artifact Generator

Version: 1.0

Status: Current

Last Updated: 2026-07-06

---

## Purpose

The NextShift Artifact Generator creates standardized delivery package ZIP files from repository source Markdown files.

It makes the repository the source of truth for package generation and prevents generated ZIP artifacts from being committed.

---

## Command

Generate the default context package:

```bash
pnpm artifact:generate
```

Generate a specific package type and ID:

```bash
pnpm artifact:generate -- --type context --id OS-3.2
pnpm artifact:generate -- --type release --id OS-3.2
```

Generate a package from explicit Markdown sources:

```bash
pnpm artifact:generate -- --type release --id OS-3.2 --source docs/nextshift-os-3/releases/OS_3_2_DEVELOPER_PLATFORM/README.md
```

---

## Supported Package Types

- `context`
- `execution`
- `audit`
- `release`
- `deployment`

When no explicit `--source` values are provided, the generator packages the current Project Context source set.

---

## Output

Generated artifacts are written under `artifacts/`, which is ignored by Git.

Each run creates:

- A timestamped package directory under `artifacts/<type>/`
- A timestamped ZIP under `artifacts/<type>/`
- A latest ZIP copy under `artifacts/latest/`

Each package includes:

- Source Markdown files
- `PACKAGE_MANIFEST.md`
- `CHECKSUMS.md`
- Generated timestamp
- Source file references
- Current branch
- Current HEAD
- Package type
- Package ID

---

## Repository Rules

- Generator source code is tracked.
- Generated ZIP files are not committed.
- Runtime application code is not modified by artifact generation.
- Source files must be Markdown files inside the repository.
- Secret files such as `.env` files are not valid package sources.
