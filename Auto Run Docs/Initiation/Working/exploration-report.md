---
type: research
title: PAI Codebase Exploration Report
created: 2026-02-01
tags:
  - onboarding
  - architecture
  - exploration
related:
  - "[[Packs-Overview]]"
  - "[[Skills-Overview]]"
  - "[[Hooks-Overview]]"
---

# PAI Codebase Exploration Report

This document provides a comprehensive overview of the Personal AI Infrastructure (PAI) codebase structure, architecture, and key entry points.

---

## Project Overview

**PAI (Personal AI Infrastructure)** is an open-source platform designed to magnify human capabilities through personalized AI systems. Unlike simple chatbots that forget context between conversations, PAI creates a persistent, learning AI assistant that:

- Knows your goals, preferences, and history
- Gets better at helping you over time
- Has specialized skills and intelligent routing
- Self-improves based on feedback signals

### Mission

1. **Activate as many people as possible** — Help people identify, articulate, and pursue their purpose through AI-augmented self-discovery
2. **Democratize best-in-class AI** — Make quality AI infrastructure accessible to everyone, not just the technical elite

### Current Version

- **PAI v2.4.0** — "The Algorithm" release
- 29 skills, 131 workflows, 20 hooks, 340 signals
- Introduces ISC (Ideal State Criteria) tracking and Euphoric Surprise metrics

---

## Top-Level Directory Structure

| Directory/File | Purpose |
|----------------|---------|
| **`Packs/`** | Self-contained, AI-installable capability modules (23 packs total) |
| **`Bundles/`** | Curated collections of packs designed to work together |
| **`Releases/`** | Complete pre-configured releases (v2.3, v2.4) |
| **`Tools/`** | Templates and utilities for contributors |
| **`.github/`** | GitHub workflows, issue templates, CI/CD automation |
| **`images/`** | Visual assets for documentation |
| **`Plans/`** | Planning documents and roadmaps |
| **`Auto Run Docs/`** | Maestro automation documents for autonomous tasks |

### Key Files

| File | Purpose |
|------|---------|
| **`README.md`** | Main project documentation, principles, installation paths |
| **`INSTALL.md`** | AI-first installation guide with wizard flow |
| **`PLATFORM.md`** | Platform compatibility matrix (macOS/Linux/Windows) |
| **`SECURITY.md`** | Security policies and vulnerability reporting |
| **`LICENSE`** | MIT License |
| **`.env.example`** | Environment variable template |
| **`.pai-protected.json`** | Protected file registry |

---

## Installation Patterns

PAI supports three installation paths:

### Option 1: Full Release Install (Recommended)

```bash
git clone https://github.com/danielmiessler/PAI.git
cd PAI/Releases/v2.4
cp -r .claude ~/
cd ~/.claude && bun run PAIInstallWizard.ts
```

**Best for:** First-time users, fresh setups, immediate working system

### Option 2: Bundle + Manual Packs

```bash
cd PAI/Bundles/Official
bun run install.ts
# Then install packs in order: hook-system → core-install → statusline → skills
```

**Best for:** Learning the system while building it

### Option 3: Individual Packs

Install specific packs by giving them to your DA with the pack directory path.

**Best for:** Experienced users adding specific capabilities

### AI-First Philosophy

PAI is designed to be installed by your AI assistant, not by manually copying commands. The DA reads documentation, understands your system, asks questions, and customizes the installation for your needs.

---

## Platform Compatibility

| Platform | Status | Notes |
|----------|--------|-------|
| **macOS** | ✅ Fully Supported | Primary development platform |
| **Linux** | ✅ Fully Supported | Ubuntu/Debian tested, community support for others |
| **Windows** | ❌ Not Supported | Community contributions welcome |

### Platform Detection Patterns

**Shell scripts:**
```bash
OS_TYPE="$(uname -s)"
if [ "$OS_TYPE" = "Darwin" ]; then
  # macOS
elif [ "$OS_TYPE" = "Linux" ]; then
  # Linux
fi
```

**TypeScript/Bun:**
```typescript
if (process.platform === 'darwin') { /* macOS */ }
else if (process.platform === 'linux') { /* Linux */ }
```

---

## The PAI Principles

The 16 guiding principles:

1. **User Centricity** — Built around you, not tooling
2. **The Foundational Algorithm** — Observe → Think → Plan → Build → Execute → Verify → Learn
3. **Clear Thinking First** — Clarify the problem before writing the prompt
4. **Scaffolding > Model** — System architecture matters more than model choice
5. **Deterministic Infrastructure** — Use templates and patterns
6. **Code Before Prompts** — If bash can solve it, don't use AI
7. **Spec / Test / Evals First** — Write specs and tests before building
8. **UNIX Philosophy** — Do one thing well, make tools composable
9. **ENG / SRE Principles** — Treat AI infrastructure like production software
10. **CLI as Interface** — Command-line interfaces are faster and more reliable
11. **Goal → Code → CLI → Prompts → Agents** — Decision hierarchy
12. **Skill Management** — Modular capabilities with intelligent routing
13. **Memory System** — Everything worth knowing gets captured
14. **Agent Personalities** — Specialized agents with unique voices
15. **Science as Meta-Loop** — Hypothesis → Experiment → Measure → Iterate
16. **Permission to Fail** — Explicit permission to say "I don't know"

---

## PAI Primitives (Core Systems)

| Primitive | Purpose |
|-----------|---------|
| **TELOS** | Deep goal understanding (10 files: MISSION, GOALS, PROJECTS, etc.) |
| **User/System Separation** | USER/ for customizations, SYSTEM/ for infrastructure |
| **Skill System** | Deterministic outcomes: CODE → CLI → PROMPT → SKILL |
| **Memory System** | Continuous learning with hot/warm/cold tiers |
| **Hook System** | Event-driven automation (8 event types) |
| **Security System** | Default policies without skipping permissions |
| **Notification System** | Push notifications, Discord, duration-aware routing |
| **Voice System** | ElevenLabs TTS with prosody enhancement |
| **Terminal UI** | Dynamic status lines and command center |

---

## Key Entry Points

### For Installation
- `Releases/v2.4/.claude/` — Complete pre-configured system
- `Bundles/Official/install.ts` — Bundle wizard
- Individual packs in `Packs/*/INSTALL.md`

### For Understanding Architecture
- `README.md` — Overview and principles
- `Packs/pai-core-install/` — Core identity and skills routing
- `Packs/pai-hook-system/` — Event-driven foundation

### For Contributing
- `Tools/PAIPackTemplate.md` — Pack creation template
- `Tools/PAIBundleTemplate.md` — Bundle creation template
- `.github/` — Workflow and contribution guidelines

---

## Technology Stack

- **Runtime:** Bun (TypeScript/JavaScript)
- **AI Platform:** Built with Claude (Anthropic), platform-agnostic design
- **Language:** TypeScript, Python, Bash
- **Voice:** ElevenLabs TTS, Google Cloud TTS
- **Dependencies:** Playwright (browser), ntfy (notifications)

---

## Pack Structure

Understanding the standard pack structure is essential for contributing to PAI. This section documents the canonical layout derived from analyzing reference implementations (`pai-core-install`, `pai-browser-skill`) and the official `PAIPackTemplate.md`.

### Standard File Layout

Every pack is a **directory** containing three mandatory files plus a `src/` folder:

```
pack-name/
├── README.md           # Pack overview, architecture, what it solves
├── INSTALL.md          # Step-by-step installation instructions (AI-friendly)
├── VERIFY.md           # Mandatory verification checklist with pass/fail
└── src/                # Actual source code files
    ├── hooks/          # Hook implementations (if applicable)
    ├── tools/          # CLI tools and utilities
    ├── skills/         # Skill definitions and workflows
    └── config/         # Configuration files
```

**Why this structure?**

- **Real code files** — TypeScript, YAML, etc. can be linted and tested
- **Clear separation** — README for context, INSTALL for steps, VERIFY for validation
- **Verbatim copying** — AI agents copy actual files instead of extracting from markdown
- **Token efficiency** — Avoids single-file packs exceeding context limits

### YAML Frontmatter Requirements

Every `README.md` must include YAML frontmatter with these fields:

```yaml
---
name: Pack Name                              # Human-readable (24 words max)
pack-id: author-pack-name-variant-v1.0.0     # Unique identifier
version: 1.0.0                               # SemVer format
author: danielmiessler                       # GitHub username
description: One-line description            # 128 words max
type: skill | hook | concept | workflow      # Pack type
purpose-type: [security, productivity, ...]  # Multi-value purpose tags
platform: claude-code                        # Target platform
dependencies: []                             # Required pack-ids
keywords: [searchable, tags]                 # 24 tags max
---
```

### Icon Requirement

Every pack must have a **256x256 transparent PNG icon** in the `Packs/icons/` directory:

- Transparent background (use `--remove-bg` flag when generating)
- Blue (#4a90d9) primary color
- Purple (#8b5cf6) accent only (10-15%)
- Simple enough to recognize at 64x64

### src/ Subdirectory Organization

The `src/` directory mirrors the installation target structure:

| Subdirectory | Purpose | Example Files |
|--------------|---------|---------------|
| `skills/` | Skill definitions and workflows | `SKILL.md`, `Workflows/*.md` |
| `hooks/` | Event hook implementations | `stop-hook.ts`, `lib/observability.ts` |
| `tools/` | CLI utilities | `Browse.ts`, `Inference.ts` |
| `config/` | Configuration templates | `settings.json`, `.env.example` |

### Infrastructure Pack Example: `pai-core-install`

| Component | Location | Purpose |
|-----------|----------|---------|
| SKILL.md | `skills/CORE/SKILL.md` | Main skill definition with routing |
| SYSTEM docs | `skills/CORE/SYSTEM/` | 19 architecture documentation files |
| USER templates | `skills/CORE/USER/` | Empty user customization structure |
| WORK templates | `skills/CORE/WORK/` | Sensitive work directory placeholder |
| Workflows | `skills/CORE/Workflows/` | 4 core workflows (Delegation, SessionContinuity, etc.) |
| Tools | `skills/CORE/Tools/` | 4 CLI tools (Inference, SessionProgress, etc.) |

**Total: 34 files created, 0 dependencies**

### Skill Pack Example: `pai-browser-skill`

| Component | Location | Purpose |
|-----------|----------|---------|
| SKILL.md | `skills/Browser/SKILL.md` | Skill definition |
| index.ts | `skills/Browser/index.ts` | PlaywrightBrowser class |
| Tools/ | `skills/Browser/Tools/` | Browse.ts, BrowserSession.ts |
| Workflows/ | `skills/Browser/Workflows/` | Extract, Interact, Screenshot, VerifyPage |
| examples/ | `skills/Browser/examples/` | Working code examples |

**Dependencies:** pai-core-install, bun, playwright

### Installation Wizard Pattern

The `INSTALL.md` files follow a **wizard-style** pattern designed for AI agents:

1. **Phase 1: System Analysis** — Detect existing installations, conflicts, dependencies
2. **Phase 2: User Questions** — Use `AskUserQuestion` for decisions (upgrade vs fresh, identity config)
3. **Phase 3: Backup** — Create timestamped backup if upgrading
4. **Phase 4: Installation** — Create directories, copy files, configure settings
5. **Phase 5: Verification** — Run all checks from `VERIFY.md`
6. **Phase 6: Personalization** — Optional customization prompts

### Verification Checklist Pattern

The `VERIFY.md` files provide:

- **Quick verification** — All-in-one bash script for pass/fail
- **Detailed verification** — Individual checks with expected outputs
- **Functional tests** — End-to-end behavior validation
- **Troubleshooting** — Common issues and resolution steps

Example verification structure:

```bash
# Quick verification
test -f ~/.claude/skills/CORE/SKILL.md && echo "PASS" || echo "FAIL"
test -d ~/.claude/skills/CORE/SYSTEM && echo "PASS" || echo "FAIL"
```

### Key Design Principles

1. **End-to-End Complete** — Every component in a data flow must be included (no "beyond scope")
2. **AI-Installable** — Instructions written for AI agents, not humans copying commands
3. **Never Block** — Hooks and tools fail gracefully, never interrupt work
4. **SYSTEM/USER Separation** — SYSTEM files can be updated; USER files are never overwritten

---

## Next Steps

This exploration report covers the top-level structure. Subsequent phases will document:

- [[Packs-Overview]] — All 23 packs cataloged with categories
- [[Skills-Overview]] — Skill system deep dive
- [[Hooks-Overview]] — Hook system and event types
- Bundles and composition patterns
- CI/CD workflows

---

*Generated by PAI Maestro agent during Phase 01 exploration.*
