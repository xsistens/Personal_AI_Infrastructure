---
name: PAI Voice System
pack-id: danielmiessler-voice-system-core-v2.6.0
version: 2.6.0
author: danielmiessler
description: Multi-engine text-to-speech notification server (ElevenLabs, Piper, Qwen3) for Linux and macOS - gives your AI agent a voice
type: feature
purpose-type: [productivity, automation, integration]
platform: claude-code
dependencies: []
keywords: [voice, tts, speech, notifications, elevenlabs, piper, qwen3, audio, alerts, spoken, feedback, macos, linux, agent-voice]
---

<p align="center">
  <img src="../icons/pai-voice-system.png" alt="PAI Voice System" width="256">
</p>

# PAI Voice System

> Multi-engine TTS (ElevenLabs, Piper, Qwen3) for Linux and macOS - gives your AI agent a voice with automatic engine selection

## Installation Prompt

You are receiving a PAI Pack - a modular upgrade for AI agent systems.

**What is PAI?** See: [PAI Project Overview](../README.md#what-is-pai)

**What is a Pack?** See: [Pack System](../README.md#the-journey-pai-v1x--v20)

This pack adds voice capabilities to your AI infrastructure. The PAI Voice System provides:

- **Spoken Feedback**: Hear your AI speak completions, alerts, and notifications
- **Multi-Voice Support**: Different voices for different agents (Architect, Engineer, Designer, etc.)
- **Multi-Engine TTS**: ElevenLabs (cloud), Piper (local CPU), Qwen3-TTS (local GPU), plus platform fallbacks
- **Cross-Platform**: Full support for both Linux and macOS
- **Automatic Engine Selection**: Dispatch chain picks the best available engine
- **Zero Configuration**: Install and go - speaks immediately with platform fallback

**Core principle:** Your AI should be heard, not just read.

No more missing important completions. No more checking the terminal constantly. Your AI speaks to you while you focus elsewhere.

Please follow the installation instructions in INSTALL.md to integrate this pack into your infrastructure.

---

## What's Included

| Component | Path | Purpose |
|-----------|------|---------|
| Voice Server | `src/VoiceServer/server.ts` | HTTP server handling TTS requests (cross-platform, all engines) |
| Start Script | `src/VoiceServer/start.sh` | Cross-platform start script |
| Stop Script | `src/VoiceServer/stop.sh` | Cross-platform stop script |
| Restart Script | `src/VoiceServer/restart.sh` | Restart wrapper |
| Voice Config | `src/VoiceServer/voices.json` | Agent voice personalities |
| Linux Service | `src/VoiceServer/linux-service/` | systemd service + install/start/stop/status/uninstall scripts |
| macOS Service | `src/VoiceServer/macos-service/` | LaunchAgent + install/start/stop/status/uninstall scripts + menubar |
| Qwen3-TTS | `src/VoiceServer/qwen/` | Qwen3-TTS Python server (config, models, engine, HTTP server) |

**Summary:**
- **Files created:** 20+
- **Hooks registered:** 0 (server-only pack)
- **Dependencies:** Bun runtime, ElevenLabs API key (optional), Python (optional, for Qwen3-TTS)
- **Platforms:** Linux, macOS

---

## The Concept and/or Problem

AI agents work silently. They complete tasks, generate outputs, and produce results - all without any notification that might reach you when you are not staring at the terminal.

This creates real problems:

**For Productivity:**
- You miss important completions while working elsewhere
- Context-switching to check "is it done yet?" breaks flow
- Long-running tasks complete without notice

**For Multi-Agent Systems:**
- Multiple agents finish at different times
- You cannot tell which agent completed which task
- Background agents complete silently

**For User Experience:**
- Text-only feedback feels cold and robotic
- Important alerts blend into scrolling text
- No emotional connection with your AI assistant

**The Fundamental Problem:**

AI agents are mute by default. They have no voice. Every output requires visual attention. In a world where we interact with AI constantly, this creates unnecessary friction and missed opportunities for natural communication.

---

## The Solution

The PAI Voice System solves this through a dedicated HTTP server that converts text to speech on demand. Any system component can trigger voice output with a simple POST request. The server automatically selects the best available TTS engine using a priority-based dispatch chain.

**Core Architecture:**

```
+---------------------------------------------------------------+
|                    PAI Voice System                            |
+---------------------------------------------------------------+
|                                                               |
|   Hook/Agent/Tool                                             |
|         |                                                     |
|         v                                                     |
|   POST http://localhost:8888/notify                           |
|   {                                                           |
|     "message": "Task completed successfully",                 |
|     "voice_id": "bIHbv24MWmeRgasZH58o",                      |
|     "title": "Agent Name"                                     |
|   }                                                           |
|         |                                                     |
|         v                                                     |
|   +-------------------+                                       |
|   |  Voice Server     |  (port 8888)                          |
|   |                   |                                       |
|   |  1. Sanitize      |  Strip markdown, validate             |
|   |  2. Engine Select |  Dispatch chain (see below)           |
|   |  3. TTS Render    |  Generate speech audio                |
|   |  4. Play Audio    |  Platform-appropriate playback        |
|   |  5. Notify        |  Desktop notification (if available)  |
|   +-------------------+                                       |
|         |                                                     |
|         v                                                     |
|   TTS Engine Dispatch Chain (priority order):                 |
|                                                               |
|   [1] ElevenLabs (cloud)  -- API key required                 |
|         |  (unavailable?)                                     |
|         v                                                     |
|   [2] Piper TTS (local)   -- PAI_TTS_ENGINE=piper, Linux      |
|         |  (unavailable?)                                     |
|         v                                                     |
|   [3] Qwen3-TTS (GPU)    -- PAI_TTS_ENGINE=qwen3, CUDA       |
|         |  (unavailable?)                                     |
|         v                                                     |
|   [4] espeak (Linux)  /  say (macOS)  -- platform fallback    |
|                                                               |
+---------------------------------------------------------------+
```

**TTS Engines:**

| Engine | Type | Speed | Quality | Requirements |
|--------|------|-------|---------|-------------|
| ElevenLabs | Cloud API | Fast | Highest (AI voices) | API key, internet |
| Piper TTS | Local CPU | ~2.6s | Good (neural) | Linux, piper binary |
| Qwen3-TTS | Local GPU | ~25s | High (neural, progressive playback) | CUDA GPU, Python |
| espeak | Local | Instant | Basic (robotic) | Linux (built-in) |
| say | Local | Instant | Basic (system voice) | macOS (built-in) |

**Key Features:**

1. **Multi-Engine TTS**: Automatic dispatch chain selects the best available engine
2. **ElevenLabs Integration**: High-quality AI voices with the `eleven_turbo_v2_5` model
3. **Piper TTS**: Fast local neural TTS on CPU, no internet required
4. **Qwen3-TTS**: High-quality local GPU TTS with progressive audio playback
5. **Voice Personalities**: Each agent can have distinct voice settings (stability, similarity_boost)
6. **Platform Fallbacks**: espeak on Linux, say on macOS - always works
7. **Security**: Input sanitization, rate limiting (10 req/min), CORS restrictions
8. **Cross-Platform Services**: systemd on Linux, LaunchAgent on macOS

**Design Principles:**

1. **Fire and Forget**: Callers do not wait for voice to complete
2. **Fail Gracefully**: Server issues never block other systems
3. **Local Only**: Listens only on localhost for security
4. **Zero Config**: Works immediately with sensible defaults
5. **Best Available**: Automatically picks the highest-quality engine you have configured

---

## What Makes This Different

This sounds similar to system TTS which also does text-to-speech. What makes this approach different?

The PAI Voice System is purpose-built for AI agent infrastructure. It provides agent-specific voice personalities, hook integration, and personality-tuned voice settings that make each agent sound distinct. Unlike generic TTS, this creates an immersive multi-agent experience where you can identify which agent is speaking.

- Agent personalities with distinct voice characteristics.
- HTTP API enables any component to speak.
- Multi-engine dispatch chain with automatic fallback.
- Cross-platform: systemd service on Linux, LaunchAgent on macOS.
- Local TTS engines (Piper, Qwen3) for offline or privacy-sensitive environments.

---

## Configuration

**Environment variables (add to ~/.env):**

```bash
# Required for ElevenLabs voices (optional - falls back to local engines)
ELEVENLABS_API_KEY=your_api_key_here

# Default voice ID for ElevenLabs (optional)
ELEVENLABS_VOICE_ID=bIHbv24MWmeRgasZH58o

# Server port (optional, defaults to 8888)
PORT=8888

# TTS Engine override (optional - skips ElevenLabs, uses local engine)
# Values: piper, qwen3
PAI_TTS_ENGINE=piper

# Piper TTS configuration (optional, Linux only)
PIPER_MODEL=en_US-lessac-medium.onnx
PIPER_MODEL_DIR=/path/to/piper/models
```

**Engine Selection Logic:**

1. If `PAI_TTS_ENGINE=piper` is set and Piper is available, use Piper
2. If `PAI_TTS_ENGINE=qwen3` is set and the Qwen3 server is running, use Qwen3
3. If `ELEVENLABS_API_KEY` is set, use ElevenLabs
4. Otherwise, fall back to platform default (espeak on Linux, say on macOS)

Get a free ElevenLabs API key at [elevenlabs.io](https://elevenlabs.io) (10,000 characters/month free).

---

## Example Usage

### Basic Notification

```bash
curl -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Task completed successfully"}'
```

### Agent-Specific Voice

```bash
# Male voice (e.g., Engineer)
curl -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Build completed with zero errors",
    "voice_id": "bIHbv24MWmeRgasZH58o",
    "title": "Engineer Agent"
  }'

# Female voice (e.g., Designer)
curl -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Design review complete, two issues found",
    "voice_id": "MClEFoImJXBTgLwdLI5n",
    "title": "Designer Agent"
  }'

# Neutral voice (e.g., Researcher)
curl -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Research synthesis ready for review",
    "voice_id": "M563YhMmA0S8vEYwkgYa",
    "title": "Research Agent"
  }'
```

### Health Check

```bash
curl http://localhost:8888/health
# Returns: {"status":"healthy","port":8888,"voice_system":"ElevenLabs",...}
```

---

## Voice IDs Reference

| Type | Voice ID | Use Case |
|------|----------|----------|
| Male | `bIHbv24MWmeRgasZH58o` | Engineer, Architect, technical agents |
| Female | `MClEFoImJXBTgLwdLI5n` | Designer, Writer, creative agents |
| Neutral | `M563YhMmA0S8vEYwkgYa` | Researcher, Analyst, neutral roles |

Find more voices at [ElevenLabs Voice Library](https://elevenlabs.io/voice-library).

Note: Voice IDs apply to ElevenLabs only. Piper and Qwen3 use their own model-based voice selection. Platform fallbacks (espeak, say) use system default voices.

---

## Customization

### Recommended Customization

**What to Customize:** Voice personalities in `voices.json`

**Why:** Different agents should sound distinct - an enthusiastic intern vs. a measured architect

**Process:**
1. Open `$PAI_DIR/VoiceServer/voices.json`
2. Adjust `stability` (0.0-1.0): Lower = more expressive, Higher = more consistent
3. Adjust `similarity_boost` (0.0-1.0): Higher = closer to original voice
4. Save and restart: `./restart.sh`

**Expected Outcome:** Each agent has a recognizable voice personality

### Optional Customization

| Customization | File | Impact |
|--------------|------|--------|
| Default volume | voices.json (`default_volume`) | 0.0-1.0 scale for all voices |
| Speaking rate | voices.json (`rate_multiplier`) | Speed of speech |
| Custom voices | voices.json | Add your own ElevenLabs voices |
| TTS engine | ~/.env (`PAI_TTS_ENGINE`) | Force a specific local engine |
| Piper model | ~/.env (`PIPER_MODEL`) | Choose a different Piper voice model |

---

## Credits

- **Original concept**: Daniel Miessler - developed as part of PAI personal AI infrastructure
- **ElevenLabs**: Text-to-speech API providing high-quality AI voices
- **Piper TTS**: Fast local neural text-to-speech by Rhasspy
- **Qwen3-TTS**: Local GPU-accelerated TTS by Alibaba
- **SwiftBar/BitBar**: Menu bar integration for macOS

---

## Changelog

### 2.6.0 - 2026-02-03
- Multi-engine TTS dispatch chain: ElevenLabs, Piper, Qwen3, espeak/say
- Added Piper TTS support (fast local neural TTS on CPU, Linux)
- Added Qwen3-TTS support (high-quality local GPU TTS with progressive playback)
- Full Linux support with systemd service management
- Cross-platform start/stop/restart scripts
- Platform-specific service directories (linux-service/, macos-service/)
- New environment variables: PAI_TTS_ENGINE, PIPER_MODEL, PIPER_MODEL_DIR
- espeak fallback for Linux (replaces macOS-only say fallback)

### 2.3.0 - 2026-01-14
- Packaged for PAI v2.3 release
- Simplified prosody system (removed emotional markers)
- Updated documentation with generic voice IDs

### 1.5.0 - 2026-01-12
- Removed prosody enhancement system for simplicity
- Voice personalities provide sufficient variation

### 1.4.0 - 2025-12-09
- Added volume control (`default_volume` in voices.json)
- Calmer startup voice

### 1.0.0 - 2025-11-16
- Initial release with ElevenLabs integration
- Multi-voice support for agent personalities
- macOS LaunchAgent for auto-start
