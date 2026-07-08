# ChatGPT System Context

This folder is the onboarding pack for a fresh ChatGPT or Codex window working on NextShift OS.

Start here before proposing architecture, engineering workflow, capability plans, or AI orchestration changes.

## Fast Start

1. Read [CHATGPT_BOOTSTRAP_PROMPT.md](CHATGPT_BOOTSTRAP_PROMPT.md).
2. Read [CURRENT_STATE.md](CURRENT_STATE.md).
3. Read [DUPLICATE_PREVENTION.md](DUPLICATE_PREVENTION.md).
4. Read [VERSION_AUTHORITY_POLICY.md](VERSION_AUTHORITY_POLICY.md) before proposing any new version number.
5. Read `docs/nextshift-os-3/system-authority/README.md` before proposing architecture, governance, engineering workflow, or source-of-truth changes.
6. Read `docs/nextshift-os-3/docs-hygiene/MARKDOWN_AUTHORITY_AUDIT.md` when the task involves duplicate Markdown files or version drift.
7. Use [SYSTEM_MAP.md](SYSTEM_MAP.md) to choose the right source files.
8. Use [SOURCE_INDEX.md](SOURCE_INDEX.md) when you need the original docs.

## Most Important Guardrail

Do not propose a new `Engineering Orchestrator v1.0` or invent engineering playbook versions.

NextShift already has an approved engineering governance system. The source of truth is `docs/nextshift-os-3/engineering/ENGINEERING_PLAYBOOK.md`.

Engineering Playbook v1.2 has approved release evidence on `planning/os-3.3-runtime-platform`: release commit `6dec2e4` and audit commit `f442e4a`. If the current checkout still shows v1.1, the branch has not incorporated that authority yet; sync or inspect the target branch before advising.

## Repository Identity

- GitHub: `https://github.com/sohoteam88/NextShift-OS-2.0`
- Local repo: `/Users/stevenmacmini/Documents/Codex/2026-07-02/status-draft-approved/work/nextshift-std005`
- Product: NextShift, an AI Guided Business Operating System for entrepreneurs.
- Architecture: Cognitive Architecture centered on the Business Twin.
- Current development layer: business capability development on top of frozen Blueprint and Core Runtime layers.

## How To Use This Folder

When opening a new ChatGPT window, paste the bootstrap prompt from [CHATGPT_BOOTSTRAP_PROMPT.md](CHATGPT_BOOTSTRAP_PROMPT.md), then attach or reference this folder. If the model proposes a duplicate v1.0 system, point it to [DUPLICATE_PREVENTION.md](DUPLICATE_PREVENTION.md).
