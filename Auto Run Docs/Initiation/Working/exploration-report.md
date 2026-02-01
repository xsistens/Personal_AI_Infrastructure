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

## Next Steps

This exploration report covers the top-level structure. Subsequent phases will document:

- [[Packs-Overview]] — All 23 packs cataloged with categories
- [[Skills-Overview]] — Skill system deep dive
- [[Hooks-Overview]] — Hook system and event types
- Bundles and composition patterns
- CI/CD workflows

---

*Generated by PAI Maestro agent during Phase 01 exploration.*
