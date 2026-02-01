---
type: reference
title: PAI Packs Overview
created: 2026-02-01
tags:
  - packs
  - modules
  - capabilities
related:
  - "[[exploration-report]]"
  - "[[Skills-Overview]]"
  - "[[Hooks-Overview]]"
  - "[[Tools-Overview]]"
---

# PAI Packs Overview

This document catalogs all 23 PAI Packs - modular, self-contained capabilities extracted from a production AI system. Each pack can be installed independently and provides battle-tested functionality.

---

## Pack Philosophy

PAI Packs follow key principles:
- **Self-contained** - Works without understanding the rest of the system
- **Independently installable** - Add what you need, skip what you don't
- **AI-installable** - Give your DA the pack directory, it handles the rest
- **Production-tested** - Extracted from real production systems

---

## Pack Categories Summary

| Category | Count | Purpose |
|----------|-------|---------|
| **Infrastructure** | 5 | Core systems that other packs depend on |
| **Skills** | 18 | Capability modules for specific tasks |

---

## Infrastructure Packs (5)

Infrastructure packs provide foundational systems that run automatically or support other capabilities.

### 1. pai-core-install

| Property | Value |
|----------|-------|
| **Version** | 2.3.0 |
| **Category** | Foundation |
| **Dependencies** | None |
| **Description** | Complete CORE skill installation - the foundational skill that governs PAI system operation, architecture, and all system-level configuration |

**What It Does:**
- Auto-loads at session start
- Provides response format standards
- Includes SYSTEM/USER two-tier architecture
- Contains 19 architecture documentation files
- Provides 4 core workflows (Delegation, SessionContinuity, etc.)
- Provides 4 CLI tools (Inference, SessionProgress, etc.)

**Files:** 34 files created

---

### 2. pai-hook-system

| Property | Value |
|----------|-------|
| **Version** | 2.3.0 |
| **Category** | Foundation |
| **Dependencies** | pai-core-install |
| **Description** | Event-driven automation framework for Claude Code - the foundation for all hook-based capabilities |

**What It Does:**
- Intercepts Claude Code events (PreToolUse, PostToolUse, Stop, SessionStart, etc.)
- Provides security validation before dangerous commands
- Enables context injection at session start
- Captures learning signals and sentiment

**Hooks Included:** 15 (SessionStart x3, PreToolUse x1, UserPromptSubmit x3, Stop x7, SubagentStop x1)

**Files:** 31 files (15 hooks + 12 libraries + 4 handlers)

---

### 3. pai-voice-system

| Property | Value |
|----------|-------|
| **Version** | 2.3.0 |
| **Category** | Notifications |
| **Dependencies** | None |
| **Description** | Text-to-speech notification server using ElevenLabs API with fallback to macOS say |

**What It Does:**
- HTTP server (port 8888) for TTS requests
- Multi-voice support for different agents
- ElevenLabs integration with personality-tuned settings
- macOS LaunchAgent for auto-start

**Files:** 12+ files (server, scripts, voice config, menu bar integration)

---

### 4. pai-observability-server

| Property | Value |
|----------|-------|
| **Version** | 2.3.0 |
| **Category** | Observability |
| **Dependencies** | pai-hook-system |
| **Description** | Real-time multi-agent activity monitoring dashboard with WebSocket streaming |

**What It Does:**
- Streams every tool call, hook event, and agent action
- WebSocket real-time updates
- Vue 3 dashboard with swim lanes
- File-based event streaming (JSONL)
- macOS MenuBar app for control

**Architecture:** Bun HTTP server (port 4000) + Vue 3 client (port 5172)

---

### 5. pai-statusline

| Property | Value |
|----------|-------|
| **Version** | 2.3.0 |
| **Category** | Display |
| **Dependencies** | None |
| **Description** | Rich terminal status line for Claude Code showing context usage, git status, memory stats, learning signals with sparklines |

**What It Does:**
- Visual context window usage indicator
- Git status at a glance
- Memory/learning statistics with sparklines
- Responsive modes (nano, micro, mini, normal)
- Location/weather context

**Files:** 1 script (833 lines)

---

## Skill Packs (18)

Skill packs provide specific capabilities that can be invoked by natural language triggers.

### 6. pai-agents-skill

| Property | Value |
|----------|-------|
| **Version** | 2.3.0 |
| **Category** | Delegation |
| **Dependencies** | pai-core-install |
| **Description** | Dynamic agent composition and management system with custom personalities, voices, and parallel orchestration |

**What It Does:**
- Create specialized agents from trait combinations (expertise + personality + approach)
- Personality-based voice mapping to ElevenLabs voices
- Named agent templates (Engineer, Architect, Designer, etc.)
- Parallel agent orchestration

**Named Agents:** 11 (Engineer, Architect, Designer, QATester, Pentester, Artist, Intern, + 4 Researchers)

---

### 7. pai-algorithm-skill

| Property | Value |
|----------|-------|
| **Version** | 2.3.0 |
| **Category** | Methodology |
| **Dependencies** | pai-core-install, pai-agents-skill |
| **Description** | Universal execution engine using scientific method to achieve ideal state with ISC (Ideal State Criteria) tracking |

**What It Does:**
- 7-phase execution: OBSERVE, THINK, PLAN, BUILD, EXECUTE, VERIFY, LEARN
- Effort classification (TRIVIAL to DETERMINED)
- ISC management and verification
- LCARS-style visual display with voice announcements

**Tools:** 7 TypeScript tools for algorithm management

---

### 8. pai-annualreports-skill

| Property | Value |
|----------|-------|
| **Version** | 2.3.0 |
| **Category** | Security/Research |
| **Dependencies** | pai-core-install |
| **Description** | Annual security report aggregation with 570+ sources from the cybersecurity industry |

**What It Does:**
- 570+ report sources (CrowdStrike, Microsoft, IBM, Verizon, etc.)
- 20+ categories (threat intel, surveys, cloud security, ransomware)
- Search by vendor, category, or keyword
- Automatic sync from upstream

**Tools:** ListSources.ts, UpdateSources.ts, FetchReport.ts

---

### 9. pai-art-skill

| Property | Value |
|----------|-------|
| **Version** | 2.3.0 |
| **Category** | Creativity |
| **Dependencies** | None |
| **Description** | Complete visual content system for AI-generated illustrations, diagrams, and data visualizations |

**What It Does:**
- Unified aesthetic framework (color palette, typography)
- 7 specialized workflows (Essay, Visualize, TechnicalDiagrams, Mermaid, Frameworks, Stats, PAI Icon)
- Multi-model support (Nano Banana Pro, Flux)
- Background removal for transparent PNGs

---

### 10. pai-brightdata-skill

| Property | Value |
|----------|-------|
| **Version** | 2.3.0 |
| **Category** | Scraping |
| **Dependencies** | None |
| **Description** | Progressive URL scraping with four-tier fallback strategy |

**What It Does:**
- Tier 1: WebFetch (fast, simple)
- Tier 2: Curl (Chrome-like headers)
- Tier 3: Browser Automation (Playwright)
- Tier 4: Bright Data MCP (CAPTCHA solving)

---

### 11. pai-browser-skill

| Property | Value |
|----------|-------|
| **Version** | 2.3.1 |
| **Category** | Automation |
| **Dependencies** | pai-core-install, bun, playwright |
| **Description** | Debug-first browser automation with always-on visibility |

**What It Does:**
- Console logs, network requests, errors captured by default
- Session auto-start on first use
- 99%+ token savings vs MCP approach
- CLI tool for navigation with diagnostics

**Workflows:** Extract, Interact, Screenshot, Update, VerifyPage

---

### 12. pai-council-skill

| Property | Value |
|----------|-------|
| **Version** | 2.3.0 |
| **Category** | Analysis |
| **Dependencies** | pai-core-install |
| **Description** | Multi-agent debate system where specialized agents discuss topics in rounds |

**What It Does:**
- 3-round structured debates
- Quick consensus check (single round)
- Visible conversation transcripts
- Default members: Architect, Designer, Engineer, Researcher

**Workflows:** Debate (full 3-round), Quick (fast check)

---

### 13. pai-createcli-skill

| Property | Value |
|----------|-------|
| **Version** | 2.3.0 |
| **Category** | Development |
| **Dependencies** | None |
| **Description** | Generate production-ready TypeScript CLIs following the llcli pattern |

**What It Does:**
- Three-tier template system (Manual, Commander.js, oclif)
- Automatic tier selection based on complexity
- Complete documentation (README + QUICKSTART)
- Quality validation gates

**Workflows:** CreateCli, AddCommand, UpgradeTier

---

### 14. pai-createskill-skill

| Property | Value |
|----------|-------|
| **Version** | 2.3.0 |
| **Category** | Development |
| **Dependencies** | pai-core-install |
| **Description** | Skill creation and validation framework |

**What It Does:**
- Create new skills with proper structure
- Validate existing skills against canonical format
- Canonicalize non-compliant skills
- TitleCase naming enforcement

**Workflows:** CreateSkill, ValidateSkill, CanonicalizeSkill, UpdateSkill

---

### 15. pai-firstprinciples-skill

| Property | Value |
|----------|-------|
| **Version** | 2.3.0 |
| **Category** | Analysis |
| **Dependencies** | pai-core-install |
| **Description** | First principles analysis based on Elon Musk's physics-based thinking framework |

**What It Does:**
- 3-step framework: DECONSTRUCT, CHALLENGE, RECONSTRUCT
- Constraint classification (HARD/SOFT/ASSUMPTION)
- Challenge assumptions systematically

**Workflows:** Deconstruct, Challenge, Reconstruct

---

### 16. pai-osint-skill

| Property | Value |
|----------|-------|
| **Version** | 2.3.0 |
| **Category** | Research/Security |
| **Dependencies** | None |
| **Description** | Open source intelligence gathering with ethical framework and parallel researcher fleet |

**What It Does:**
- People, Company, Entity intelligence workflows
- Authorization-first architecture
- 90+ tool references categorized by domain
- Parallel researcher fleet (up to 32 agents)

**Workflows:** PeopleLookup, CompanyLookup, CompanyDueDiligence, EntityLookup

---

### 17. pai-privateinvestigator-skill

| Property | Value |
|----------|-------|
| **Version** | 2.3.0 |
| **Category** | Research |
| **Dependencies** | None |
| **Description** | Ethical people-finding using only public data sources |

**What It Does:**
- Systematic, ethical framework for people-finding
- 9-15 parallel AI research agents
- Confidence scoring (HIGH/MEDIUM/LOW)
- Four-tier information hierarchy

**Workflows:** FindPerson, SocialMediaSearch, PublicRecordsSearch, ReverseLookup, VerifyIdentity

---

### 18. pai-prompting-skill

| Property | Value |
|----------|-------|
| **Version** | 2.3.0 |
| **Category** | Methodology |
| **Dependencies** | pai-core-install |
| **Description** | Meta-prompting system for dynamic prompt generation using Handlebars templates |

**What It Does:**
- Claude 4.x best practices
- Five core primitives (Roster, Voice, Structure, Briefing, Gate)
- Five eval templates for LLM-as-Judge
- 65% token savings through templating

**Tools:** RenderTemplate.ts, ValidateTemplate.ts

---

### 19. pai-recon-skill

| Property | Value |
|----------|-------|
| **Version** | 2.3.0 |
| **Category** | Security |
| **Dependencies** | curl, dig, whois, bun |
| **Description** | Security reconnaissance for infrastructure and network mapping |

**What It Does:**
- Clear authorization model (passive vs active)
- Domain, IP, Netblock reconnaissance
- Bug bounty program discovery
- Integration with OSINT and WebAssessment

**Workflows:** PassiveRecon, DomainRecon, IpRecon, NetblockRecon, BountyPrograms

---

### 20. pai-redteam-skill

| Property | Value |
|----------|-------|
| **Version** | 2.3.0 |
| **Category** | Security/Analysis |
| **Dependencies** | pai-core-install |
| **Description** | Military-grade adversarial analysis using 32 parallel agents |

**What It Does:**
- 32 specialized agents (8 each: engineers, architects, pentesters, interns)
- Steelman + Counter-argument generation
- Adversarial validation protocol
- Find the ONE fundamental flaw

**Workflows:** ParallelAnalysis, AdversarialValidation

---

### 21. pai-research-skill

| Property | Value |
|----------|-------|
| **Version** | 2.3.0 |
| **Category** | Research |
| **Dependencies** | pai-core-install |
| **Description** | Comprehensive research system with multi-agent modes and 242+ Fabric patterns |

**What It Does:**
- Three research modes: Quick (1 agent), Standard (3), Extensive (12)
- Extract Alpha workflow for high-value insights
- Three-layer retrieval (WebFetch, BrightData, Apify)
- URL verification protocol

**Workflows:** 13 workflows including QuickResearch, StandardResearch, ExtractAlpha, Fabric, YoutubeExtraction

---

### 22. pai-system-skill

| Property | Value |
|----------|-------|
| **Version** | 2.3.0 |
| **Category** | Maintenance |
| **Dependencies** | pai-core-install |
| **Description** | System maintenance with integrity checks, documentation, security scanning |

**What It Does:**
- Four core operations: IntegrityCheck, DocumentSession, DocumentRecent, GitPush
- Three security workflows: SecretScanning, CrossRepoValidation, PrivacyCheck
- Work context recall for past work
- Voice notifications for progress

**Tools:** CreateUpdate.ts, UpdateIndex.ts, UpdateSearch.ts, ExtractArchitectureUpdates.ts

---

### 23. pai-telos-skill

| Property | Value |
|----------|-------|
| **Version** | 2.3 |
| **Category** | Life OS |
| **Dependencies** | pai-core-install |
| **Description** | Life OS and project analysis framework for managing goals, beliefs, projects |

**What It Does:**
- Personal TELOS context (beliefs, goals, lessons, wisdom)
- Project analysis framework
- Automatic backups on update
- Dashboard generation

**Workflows:** Update, WriteReport, CreateNarrativePoints, InterviewExtraction

---

## Installation Order

Packs have dependencies. Install in this order:

```
Required (install first):
1. pai-hook-system            <- Foundation (no dependencies)
2. pai-core-install           <- Depends on hooks

Infrastructure (install next):
3. pai-statusline             <- Depends on core-install
4. pai-voice-system           <- Depends on hooks, core-install
5. pai-observability-server   <- Depends on hooks

Skills (install any you need):
6+. pai-*-skill               <- Most depend only on core-install
```

---

## Quick Reference by Use Case

| Use Case | Recommended Pack(s) |
|----------|---------------------|
| **Getting started** | pai-core-install, pai-hook-system |
| **Research** | pai-research-skill, pai-osint-skill |
| **Security testing** | pai-recon-skill, pai-redteam-skill |
| **Development** | pai-createcli-skill, pai-createskill-skill, pai-browser-skill |
| **Visual content** | pai-art-skill |
| **Decision making** | pai-council-skill, pai-firstprinciples-skill |
| **System maintenance** | pai-system-skill |
| **Life management** | pai-telos-skill |

---

## Related Documents

- [[exploration-report]] - Full codebase exploration
- [[Skills-Overview]] - Detailed skill system documentation
- [[Hooks-Overview]] - Hook system documentation

---

*Document generated: 2026-02-01*
*Source: PAI Packs directory analysis*
