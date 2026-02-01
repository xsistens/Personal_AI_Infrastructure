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

## Bundles

Bundles are **curated collections of packs** designed to work together as a harmonious system. While individual packs can be installed standalone, bundles provide tested combinations with proper installation order and documented synergies.

### Why Bundles Exist

Individual packs are powerful, but users face challenges:
- **Discovery** — Which packs work well together?
- **Dependencies** — What order to install them?
- **Integration** — How do capabilities combine?
- **Verification** — How to confirm everything works?

Bundles solve these by providing:
1. **Coherent Vision** — Packs selected for a unified goal
2. **Tested Integration** — Known to work together
3. **Documented Synergies** — How capabilities combine
4. **Reduced Friction** — No guessing about compatibility

### Bundle Types

| Type | Description | Example |
|------|-------------|---------|
| **Creator Bundle** | All packs from a specific author | Official PAI Bundle (Miessler's Kai system) |
| **Functionality Bundle** | Packs serving a specific purpose | Research Bundle |
| **Domain Bundle** | Packs for a specific field | Security Bundle |
| **Starter Bundle** | Minimal set to get started | PAI Lite |

### Bundle Tiers

| Tier | Pack Count | Description |
|------|------------|-------------|
| Starter | 2-3 | Minimal viable collection |
| Intermediate | 4-6 | Core functionality |
| Advanced | 7-10 | Extended capabilities |
| Complete | 10+ | Full experience |

### The Official PAI Bundle (v2.4.0)

The primary bundle, extracted from Daniel Miessler's production Kai system. It's a **Complete** tier bundle with 23 packs total.

#### Installation Order (Critical)

Packs must be installed **in order** due to dependencies:

**1. Required Foundation Packs:**

| # | Pack | Purpose | Dependencies |
|---|------|---------|--------------|
| 1 | `pai-hook-system` | Event-driven automation foundation | None |
| 2 | `pai-core-install` | Skills + Identity + MEMORY system | Hooks |

**2. Infrastructure Packs:**

| # | Pack | Purpose | Dependencies |
|---|------|---------|--------------|
| 3 | `pai-statusline` | 4-mode responsive status line | Core |
| 4 | `pai-voice-system` | Voice notifications via ElevenLabs | Hooks, Core |
| 5 | `pai-observability-server` | Multi-agent monitoring dashboard | Hooks |

**3. Skill Packs (18 total, install as needed):**

- Algorithm, Agents, AnnualReports, Art, BrightData, Browser
- Council, CreateCLI, CreateSkill, FirstPrinciples
- OSINT, PrivateInvestigator, Prompting, Recon
- RedTeam, Research, System, Telos

### Bundle vs Full Release

| Approach | What You Get | Best For |
|----------|--------------|----------|
| **Bundle Wizard** | Skeleton directory + manual pack installation | Learning the system while building |
| **Full Release** | Complete `.claude/` directory pre-configured | Immediate working system |

The Bundle wizard (`bun run install.ts`) only creates the directory structure. You must then install each pack manually. For a complete working system immediately, use `Releases/v2.4/`.

### Bundle Installation Process

1. **Wizard Phase** — Run `bun run install.ts` in `Bundles/Official/`
   - Detects existing AI systems (Claude Code, Cursor, Windsurf, etc.)
   - Backs up existing `~/.claude` to `~/.claude-BACKUP`
   - Asks questions (your name, DA name, timezone, voice)
   - Creates skeleton directory structure
2. **Pack Installation Phase** — Install each pack IN ORDER
   - Give pack directory to your DA
   - DA reads `README.md`, follows `INSTALL.md`, verifies with `VERIFY.md`
3. **Verification Phase** — Confirm all packs installed correctly
   - Check directory structure: `ls -la ~/.claude/`
   - Check hook registration: `cat ~/.claude/settings.json | grep -A 5 "hooks"`
   - Restart Claude Code to activate hooks

### Available Bundles

Currently, only the Official PAI Bundle is available:

| Bundle | Description | Tier | Status |
|--------|-------------|------|--------|
| [Official PAI Bundle](../../Bundles/Official/) | Complete personal AI infrastructure from Kai system | Complete | Active |

---

## Contributor Tools

The `Tools/` directory contains templates and utilities for contributors building and maintaining PAI installations. This section documents the available resources.

### Directory Contents

| File | Type | Purpose |
|------|------|---------|
| `README.md` | Documentation | AI usage guide and quick reference |
| `PAIPackTemplate.md` | Template | Complete specification for creating new packs |
| `PAIBundleTemplate.md` | Template | Complete specification for creating new bundles |
| `InstallTemplate.md` | Template | Wizard-style INSTALL.md template |
| `CheckPAIState.md` | Diagnostic | PAI installation health checker |
| `validate-pack.ts` | Validation | Pack completeness validator script |
| `validate-protected.ts` | Validation | Protected files/secrets validator |
| `BackupRestore.ts` | Utility | Backup and restore PAI installations |
| `lib/voice-selection.ts` | Library | Voice selection helper for TTS |
| `utilities-icon.png` | Asset | Icon for Tools directory |

### Templates

#### PAIPackTemplate.md — Pack Creation Specification

The complete specification for creating PAI packs. Key aspects:

**Pack Structure (v2.0):**
```
pack-name/
├── README.md           # Pack overview, architecture
├── INSTALL.md          # AI-friendly installation steps
├── VERIFY.md           # Verification checklist
└── src/                # Source code files
    ├── hooks/          # Hook implementations
    ├── tools/          # CLI utilities
    ├── skills/         # Skill definitions
    └── config/         # Configuration files
```

**Key Requirements:**
- End-to-end completeness — Every component in a data flow must be included
- 13-field YAML frontmatter (name, pack-id, version, author, etc.)
- 256x256 transparent PNG icon with `--remove-bg` flag
- Pre-installation system analysis (conflict detection, dependency checks)
- "Why This Is Different" section: 64-word paragraph + 4 eight-word bullets

**The Chain Test:** Before publishing, trace every data flow. If ANY link says "implement your own" or "beyond scope," the pack is incomplete.

#### PAIBundleTemplate.md — Bundle Creation Specification

The complete specification for creating PAI bundles (curated pack collections):

**Bundle Structure:**
```
Bundles/
└── YourBundle/
    ├── README.md             # Bundle specification (required)
    └── your-bundle-icon.png  # 256x256 transparent PNG (optional)
```

**Key Requirements:**
- AI Installation Wizard section with interactive questions
- Architecture diagram showing how packs work together
- Installation order table with dependencies
- "Why This Is Different" section (same format as packs)
- Bundle tiers: Starter (2-3), Intermediate (4-6), Advanced (7-10), Complete (10+)

**Critical Principle:** Bundles must explain not just WHAT packs to install, but WHY they work together and what emergent capabilities arise from the combination.

#### InstallTemplate.md — Wizard-Style Installation

A template for creating wizard-style INSTALL.md files that guide AI agents through installation:

**Six Phases:**
1. **System Analysis** — Detect existing installations, prerequisites
2. **User Questions** — Use `AskUserQuestion` at decision points
3. **Backup** — Create timestamped backup if needed
4. **Installation** — Create directories, copy files (tracked with `TodoWrite`)
5. **Verification** — Execute VERIFY.md checks
6. **Success/Failure** — Clear messaging with next steps

**Key Design Principles:**
- Wizard-style (guide interactively, don't dump commands)
- Conditional questions (only ask about conflicts/missing prereqs)
- `TodoWrite` for progress tracking
- Clear success/failure messages

### Diagnostic Tools

#### CheckPAIState.md — Installation Health Checker

A comprehensive diagnostic workflow for assessing PAI installation health. Usage:

```
Read CheckPAIState.md and check my PAI state. Give me recommendations.
```

**What it checks:**
1. PAI installation location (`~/.pai/` or `~/.config/pai/`)
2. Hook system (foundation for everything else)
3. History system (event capture and logging)
4. Skill system (capability routing)
5. Voice system (optional TTS notifications)
6. Observability server (optional monitoring)
7. Identity configuration (optional personalization)

**Output:** Health report with installed packs, issues found, and suggested next steps.

### Validation Scripts

#### validate-pack.ts — Pack Completeness Validator

Validates that PAI packs meet completeness requirements:

```bash
bun run Tools/validate-pack.ts                    # Validate all packs
bun run Tools/validate-pack.ts pai-agents-skill   # Validate specific pack
bun run Tools/validate-pack.ts --changed-only     # For CI (only changed packs)
```

**Checks performed:**
- Required files exist (README.md, INSTALL.md, VERIFY.md)
- Skill packs have valid SKILL.md with workflow references
- All referenced workflows exist in Workflows/ directory

**Pack classification:**
- Skill packs (🎯): Must have SKILL.md with valid workflow references
- System packs (⚙️): Infrastructure packs, no SKILL.md required

#### validate-protected.ts — Protected Files Validator

Ensures PAI-specific files haven't been overwritten with sensitive content:

```bash
bun run Tools/validate-protected.ts           # Check all protected files
bun run Tools/validate-protected.ts --staged  # Check only staged files (for pre-commit)
```

**Categories scanned:**
- API keys (Anthropic, OpenAI, AWS, Stripe, etc.)
- GitHub/Slack tokens
- Webhooks (Discord, Slack, ntfy, Zapier)
- Database credentials
- Private keys (RSA, SSH, PGP)
- PII (SSN, phone numbers, personal emails)
- Private paths (/Users/daniel/, ~/.claude/)
- Customer/team member data

**Uses:** `.pai-protected.json` manifest for pattern definitions and exception files.

### Utility Scripts

#### BackupRestore.ts — Backup and Restore Tool

Backup and restore PAI installations:

```bash
bun BackupRestore.ts backup                      # Create timestamped backup
bun BackupRestore.ts backup --name "pre-upgrade" # Create labeled backup
bun BackupRestore.ts list                        # List available backups
bun BackupRestore.ts restore <backup-name>       # Restore from backup
bun BackupRestore.ts migrate <backup-name>       # Analyze for migration
```

**Features:**
- Timestamped backups stored in `~/`
- Pre-restore backup always created automatically
- Migration analysis identifies: settings, custom hooks, personal skills, memory data

### Quick Reference

| User Request | File to Use |
|--------------|-------------|
| "Check my PAI installation" | `CheckPAIState.md` |
| "Create a new pack" | `PAIPackTemplate.md` |
| "Create a new bundle" | `PAIBundleTemplate.md` |
| "Back up my PAI" | `BackupRestore.ts backup` |
| "Validate my pack" | `validate-pack.ts` |

---

## CI/CD Workflows

The `.github/workflows/` directory contains GitHub Actions workflows that automate code review and AI-assisted development. These workflows integrate Claude Code directly into the GitHub pull request and issue workflow.

### Available Workflows

| Workflow File | Name | Purpose |
|---------------|------|---------|
| `claude-code-review.yml` | Claude Code Review | Automated AI code review on pull requests |
| `claude.yml` | Claude Code | Interactive AI assistance via @claude mentions |

### Claude Code Review (`claude-code-review.yml`)

**Purpose:** Automatically runs AI-powered code review on all pull requests.

**Triggers:**
- `pull_request.opened` — When a new PR is opened
- `pull_request.synchronize` — When commits are pushed to an existing PR
- `pull_request.ready_for_review` — When a draft PR is marked ready
- `pull_request.reopened` — When a closed PR is reopened

**What It Does:**
1. Checks out the repository with minimal depth (`fetch-depth: 1`)
2. Invokes Claude Code Action with the `code-review` plugin
3. Analyzes the PR diff and provides feedback

**Configuration Options (commented out but available):**
- Path filtering — Only run on specific file types (e.g., `src/**/*.ts`)
- Author filtering — Only run for specific contributors (e.g., `FIRST_TIME_CONTRIBUTOR`)

**Permissions Required:**
- `contents: read` — Read repository content
- `pull-requests: read` — Access PR details
- `issues: read` — Access issue context
- `id-token: write` — OAuth authentication

**Secrets Required:**
- `CLAUDE_CODE_OAUTH_TOKEN` — Claude Code authentication token

### Claude Code Interactive (`claude.yml`)

**Purpose:** Enables interactive AI assistance by mentioning `@claude` in issues, PRs, and comments.

**Triggers:**
- `issue_comment.created` — Comments on issues containing `@claude`
- `pull_request_review_comment.created` — PR review comments containing `@claude`
- `pull_request_review.submitted` — PR reviews containing `@claude`
- `issues.opened` — New issues with `@claude` in title or body
- `issues.assigned` — Issue assignments (if body/title contains `@claude`)

**Conditional Execution:**
The workflow only runs if `@claude` is mentioned in the relevant context (comment body, review body, issue title/body).

**What It Does:**
1. Responds to `@claude` mentions with AI-generated assistance
2. Can read CI results from PRs (via `actions: read` permission)
3. Follows instructions from the comment that tagged it

**Permissions Required:**
- `contents: read` — Read repository content
- `pull-requests: read` — Access PR details
- `issues: read` — Access issue context
- `id-token: write` — OAuth authentication
- `actions: read` — Read CI results on PRs

**Secrets Required:**
- `CLAUDE_CODE_OAUTH_TOKEN` — Claude Code authentication token

### Key Patterns

**1. OAuth Authentication:**
Both workflows use `claude_code_oauth_token` for authentication rather than API keys, following Claude Code's recommended pattern.

**2. Minimal Checkout:**
Both use `fetch-depth: 1` for faster checkout, only fetching the latest commit rather than full history.

**3. Plugin Marketplace:**
The code review workflow references a plugin marketplace (`https://github.com/anthropics/claude-code.git`) and uses the `code-review@claude-code-plugins` plugin.

**4. Conditional Execution:**
The interactive workflow uses a complex `if` condition to only run when `@claude` is explicitly mentioned, preventing unnecessary workflow runs.

### Setting Up CI/CD

To enable these workflows in your fork:

1. **Create OAuth Token:**
   - Generate a Claude Code OAuth token from your Claude account
   - Add it as a repository secret named `CLAUDE_CODE_OAUTH_TOKEN`

2. **Enable Workflows:**
   - Go to repository Settings → Actions → General
   - Ensure "Allow all actions and reusable workflows" is selected

3. **Test:**
   - Open a PR to trigger automatic code review
   - Comment `@claude explain this code` on any issue or PR

### Extending Workflows

**Adding Path Filters:**
```yaml
on:
  pull_request:
    paths:
      - "src/**/*.ts"
      - "src/**/*.tsx"
```

**Adding Author Filters:**
```yaml
if: |
  github.event.pull_request.author_association == 'FIRST_TIME_CONTRIBUTOR'
```

**Custom Prompts:**
```yaml
prompt: 'Summarize the changes and suggest improvements.'
```

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
