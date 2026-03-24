# PAI Voice System v2.6.0 - Installation Guide

**This guide is designed for AI agents installing this pack into a user's infrastructure.**

---

## AI Agent Instructions

**This is a wizard-style installation.** Use Claude Code's native tools to guide the user through installation:

1. **AskUserQuestion** - For user decisions and confirmations
2. **TodoWrite** - For progress tracking
3. **Bash/Read/Write** - For actual installation
4. **VERIFY.md** - For final validation

### Welcome Message

Before starting, greet the user:
```
"I'm installing PAI Voice System v2.6.0 - Voice notification server. This enables spoken notifications using ElevenLabs for natural speech, with local TTS engines (Piper, Qwen3) on Linux, and platform-native voice fallback.

Let me analyze your system and guide you through installation."
```

---

## Phase 1: System Analysis

**Execute this analysis BEFORE any file operations.**

### 1.1 Run These Commands

```bash
PAI_CHECK="${PAI_DIR:-$HOME/.claude}"
echo "PAI_DIR: $PAI_CHECK"

# Detect platform
if [[ "$OSTYPE" == "darwin"* ]]; then
  echo "OK macOS detected"
  PLATFORM="macos"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  echo "OK Linux detected"
  PLATFORM="linux"
else
  echo "WARNING Unsupported platform: $OSTYPE"
  PLATFORM="unknown"
fi

# Check if pai-core-install is installed (REQUIRED)
if [ -f "$PAI_CHECK/skills/CORE/SKILL.md" ]; then
  echo "OK pai-core-install is installed"
else
  echo "ERROR pai-core-install NOT installed - REQUIRED!"
fi

# Check for existing VoiceServer
if [ -d "$PAI_CHECK/VoiceServer" ]; then
  echo "WARNING Existing VoiceServer found at: $PAI_CHECK/VoiceServer"
  ls "$PAI_CHECK/VoiceServer/"
else
  echo "OK No existing VoiceServer (clean install)"
fi

# Check for Bun runtime (REQUIRED)
if command -v bun &> /dev/null; then
  echo "OK Bun is installed: $(bun --version)"
else
  echo "ERROR Bun not installed - REQUIRED!"
fi

# Check if port 8888 is in use (cross-platform)
if [[ "$PLATFORM" == "linux" ]]; then
  if ss -tlnp 2>/dev/null | grep -q ':8888 '; then
    echo "WARNING Port 8888 is in use (existing voice server?)"
    ss -tlnp | grep ':8888 ' | head -3
  else
    echo "OK Port 8888 is available"
  fi
else
  if lsof -i :8888 &> /dev/null; then
    echo "WARNING Port 8888 is in use (existing voice server?)"
    lsof -i :8888 | head -3
  else
    echo "OK Port 8888 is available"
  fi
fi

# Check for ElevenLabs credentials
if [ -n "$ELEVENLABS_API_KEY" ]; then
  echo "OK ELEVENLABS_API_KEY is set in environment"
elif grep -q "ELEVENLABS_API_KEY" ~/.env 2>/dev/null; then
  echo "OK ELEVENLABS_API_KEY found in ~/.env"
else
  echo "NOTE ELEVENLABS_API_KEY not set (will use local TTS or platform voice)"
fi

# Check for Piper TTS
if command -v piper &> /dev/null; then
  echo "OK Piper TTS is installed: $(piper --version 2>&1 || echo 'version unknown')"
else
  echo "NOTE Piper TTS not installed (optional local TTS engine)"
fi

# Check for Piper voice models
if [ -d "$HOME/.local/share/piper-voices" ] && ls "$HOME/.local/share/piper-voices/"*.onnx &> /dev/null; then
  echo "OK Piper voice models found in ~/.local/share/piper-voices/"
else
  echo "NOTE No Piper voice models found"
fi

# Check for Python (Qwen3 requirement)
if command -v python3 &> /dev/null; then
  echo "OK Python3 is installed: $(python3 --version)"
else
  echo "NOTE Python3 not installed (required for Qwen3-TTS)"
fi

# Check for NVIDIA GPU (Qwen3 requirement)
if command -v nvidia-smi &> /dev/null; then
  echo "OK NVIDIA GPU detected: $(nvidia-smi --query-gpu=name --format=csv,noheader 2>/dev/null | head -1)"
else
  echo "NOTE No NVIDIA GPU detected (required for Qwen3-TTS)"
fi

# Check for backup directories with credentials
for backup in "$HOME/.claude.bak" "$HOME/.claude-backup" "$HOME/.claude-old" "$HOME/.pai-backup"; do
  if [ -f "$backup/.env" ]; then
    echo "NOTE Found backup with .env: $backup"
  fi
done

# Check audio playback capability
if [[ "$PLATFORM" == "macos" ]]; then
  echo "OK macOS detected - audio playback available (say, afplay)"
elif [[ "$PLATFORM" == "linux" ]]; then
  AUDIO_PLAYERS=""
  command -v aplay &> /dev/null && AUDIO_PLAYERS="$AUDIO_PLAYERS aplay"
  command -v paplay &> /dev/null && AUDIO_PLAYERS="$AUDIO_PLAYERS paplay"
  command -v mpv &> /dev/null && AUDIO_PLAYERS="$AUDIO_PLAYERS mpv"
  if [ -n "$AUDIO_PLAYERS" ]; then
    echo "OK Linux audio players available:$AUDIO_PLAYERS"
  else
    echo "WARNING No audio player found - install aplay, paplay, or mpv"
  fi
fi
```

### 1.2 Present Findings

Tell the user what you found:
```
"Here's what I found on your system:
- Platform: [macOS / Linux]
- pai-core-install: [installed / NOT INSTALLED - REQUIRED]
- Existing VoiceServer: [Yes / No]
- Bun runtime: [installed vX.X / NOT INSTALLED - REQUIRED]
- Port 8888: [available / in use]
- ElevenLabs API key: [configured / not configured]
- Piper TTS: [installed / not installed]
- Piper voice models: [found / not found]
- Python3: [installed / not installed]
- NVIDIA GPU: [detected / not detected]
- Audio playback: [available / WARNING - install audio player]
- Backup directories with credentials: [found / none]"
```

**STOP if pai-core-install or Bun is not installed.** Tell the user:
```
"pai-core-install and Bun are required. Please install them first, then return to install this pack."
```

---

## Phase 2: User Questions

**Use AskUserQuestion tool at each decision point.**

### Question 1: Conflict Resolution (if existing VoiceServer found)

**Only ask if existing VoiceServer directory detected:**

```json
{
  "header": "Conflict",
  "question": "Existing VoiceServer detected. How should I proceed?",
  "multiSelect": false,
  "options": [
    {"label": "Backup and replace (Recommended)", "description": "Creates timestamped backup, stops existing server, installs fresh"},
    {"label": "Replace without backup", "description": "Stops existing server and overwrites files"},
    {"label": "Cancel", "description": "Abort installation"}
  ]
}
```

### Question 2: Port 8888 Conflict (if port in use)

**Only ask if port 8888 is in use:**

```json
{
  "header": "Port Conflict",
  "question": "Port 8888 is in use. Should I stop the existing process?",
  "multiSelect": false,
  "options": [
    {"label": "Yes, stop it (Recommended)", "description": "Kill the process using port 8888"},
    {"label": "Cancel", "description": "Abort installation - resolve manually"}
  ]
}
```

### Question 3: ElevenLabs Configuration

**Only ask if no ElevenLabs key detected:**

```json
{
  "header": "Voice",
  "question": "Voice notifications use ElevenLabs for natural speech. Do you have an ElevenLabs account?",
  "multiSelect": false,
  "options": [
    {"label": "Yes, I have an API key", "description": "I'll configure ElevenLabs for natural voice"},
    {"label": "Help me get one", "description": "Guide me through ElevenLabs signup"},
    {"label": "Use local/system voice (Recommended)", "description": "Use local TTS engine (Linux) or built-in voice (macOS) - can add ElevenLabs later"}
  ]
}
```

**If user chooses "Help me get one":**
```
"Here's how to get an ElevenLabs API key:
1. Go to https://elevenlabs.io
2. Create a free account
3. Go to Settings > API Keys
4. Copy your API key
5. Come back and we'll configure it"
```

### Question 4: TTS Engine Selection (Linux without ElevenLabs)

**Only ask on Linux when user chose NOT to use ElevenLabs:**

```json
{
  "header": "TTS Engine",
  "question": "Which local TTS engine should be the default? (You can change this later via PAI_TTS_ENGINE env var)",
  "multiSelect": false,
  "options": [
    {"label": "Piper TTS (Recommended)", "description": "Fast CPU-based neural TTS (~2.6s). Requires piper binary and model download (~60MB)"},
    {"label": "Qwen3-TTS", "description": "Highest quality local TTS (~25s first response). Requires NVIDIA GPU + CUDA + Python"},
    {"label": "System fallback", "description": "Use espeak (Linux) or say (macOS) - instant but robotic"}
  ]
}
```

**Notes:**
- On macOS without ElevenLabs, skip this question and default to `say` (macOS built-in).
- If user chose ElevenLabs, skip this question -- ElevenLabs is the primary engine with system fallback.

### Question 5: Restore from Backup

**Only ask if backup directories with .env files were found:**

```json
{
  "header": "Restore",
  "question": "I found ElevenLabs credentials in a backup. Should I restore them?",
  "multiSelect": false,
  "options": [
    {"label": "Yes, restore credentials (Recommended)", "description": "Copy API key and voice ID from backup"},
    {"label": "No, start fresh", "description": "Don't restore anything from backups"}
  ]
}
```

### Question 6: Final Confirmation

```json
{
  "header": "Install",
  "question": "Ready to install PAI Voice System v2.6.0?",
  "multiSelect": false,
  "options": [
    {"label": "Yes, install now (Recommended)", "description": "Proceeds with installation"},
    {"label": "Show me what will change", "description": "Lists all files that will be created"},
    {"label": "Cancel", "description": "Abort installation"}
  ]
}
```

---

## Phase 3: Backup and Cleanup

**Execute based on user choices:**

### Backup (if user chose "Backup and replace")

```bash
PAI_DIR="${PAI_DIR:-$HOME/.claude}"
BACKUP_DIR="$PAI_DIR/Backups/voice-system-$(date +%Y%m%d-%H%M%S)"

if [ -d "$PAI_DIR/VoiceServer" ]; then
  mkdir -p "$BACKUP_DIR"
  cp -r "$PAI_DIR/VoiceServer" "$BACKUP_DIR/"
  echo "Backup created at: $BACKUP_DIR"
fi
```

### Stop Existing Server (if port 8888 was in use)

```bash
# Cross-platform port kill
if [[ "$OSTYPE" == "darwin"* ]]; then
  lsof -ti :8888 | xargs kill -9 2>/dev/null || true
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  fuser -k 8888/tcp 2>/dev/null || true
fi
echo "Stopped existing process on port 8888"
```

---

## Phase 4: Installation

**Create a TodoWrite list to track progress:**

```json
{
  "todos": [
    {"content": "Create directory structure", "status": "pending", "activeForm": "Creating directory structure"},
    {"content": "Copy VoiceServer files from pack", "status": "pending", "activeForm": "Copying VoiceServer files"},
    {"content": "Set up platform service files", "status": "pending", "activeForm": "Setting up platform service files"},
    {"content": "Set up TTS engine", "status": "pending", "activeForm": "Setting up TTS engine"},
    {"content": "Configure credentials", "status": "pending", "activeForm": "Configuring credentials"},
    {"content": "Start voice server", "status": "pending", "activeForm": "Starting voice server"},
    {"content": "Test voice notification", "status": "pending", "activeForm": "Testing voice notification"},
    {"content": "Run verification", "status": "pending", "activeForm": "Running verification"}
  ]
}
```

### 4.1 Create Directory Structure

**Mark todo "Create directory structure" as in_progress.**

```bash
PAI_DIR="${PAI_DIR:-$HOME/.claude}"
mkdir -p "$PAI_DIR/VoiceServer"
```

**Mark todo as completed.**

### 4.2 Copy VoiceServer Files

**Mark todo "Copy VoiceServer files from pack" as in_progress.**

```bash
PACK_DIR="$(pwd)"
PAI_DIR="${PAI_DIR:-$HOME/.claude}"

# Copy core VoiceServer files
cp -r "$PACK_DIR/src/VoiceServer/"* "$PAI_DIR/VoiceServer/"
chmod +x "$PAI_DIR/VoiceServer/"*.sh 2>/dev/null || true

# Copy Qwen3 support directory
if [ -d "$PACK_DIR/src/VoiceServer/qwen" ]; then
  cp -r "$PACK_DIR/src/VoiceServer/qwen" "$PAI_DIR/VoiceServer/"
fi
```

**Files included:**
- `server.ts` - Main voice server
- `package.json` - Dependencies
- `start.sh` / `stop.sh` - Management scripts (handle Qwen3 server startup automatically)
- `qwen/` - Qwen3-TTS support files

**Mark todo as completed.**

### 4.3 Set Up Platform Service Files

**Mark todo "Set up platform service files" as in_progress.**

```bash
PACK_DIR="$(pwd)"
PAI_DIR="${PAI_DIR:-$HOME/.claude}"

if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS: copy LaunchAgent files
  if [ -d "$PACK_DIR/src/macos-service" ]; then
    cp -r "$PACK_DIR/src/macos-service/"* "$PAI_DIR/VoiceServer/"
    # Install LaunchAgent if plist exists
    if [ -f "$PAI_DIR/VoiceServer/com.pai.voice-server.plist" ]; then
      mkdir -p "$HOME/Library/LaunchAgents"
      cp "$PAI_DIR/VoiceServer/com.pai.voice-server.plist" "$HOME/Library/LaunchAgents/"
      echo "OK LaunchAgent installed"
    fi
  fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  # Linux: copy systemd user service files
  if [ -d "$PACK_DIR/src/linux-service" ]; then
    cp -r "$PACK_DIR/src/linux-service/"* "$PAI_DIR/VoiceServer/"
    # Install systemd user service if unit file exists
    if [ -f "$PAI_DIR/VoiceServer/pai-voice-server.service" ]; then
      mkdir -p "$HOME/.config/systemd/user"
      cp "$PAI_DIR/VoiceServer/pai-voice-server.service" "$HOME/.config/systemd/user/"
      systemctl --user daemon-reload
      echo "OK systemd user service installed"
    fi
  fi
fi
```

**Mark todo as completed.**

### 4.4 Set Up TTS Engine

**Mark todo "Set up TTS engine" as in_progress.**

**If user chose Piper TTS:**

```bash
PAI_DIR="${PAI_DIR:-$HOME/.claude}"

# Install piper binary if not present
if ! command -v piper &> /dev/null; then
  echo "Piper not found. Install it using your package manager:"
  echo "  Arch Linux: yay -S piper-tts-bin"
  echo "  Ubuntu/Debian: See https://github.com/rhasspy/piper/releases"
  echo "  Or download the binary directly from the releases page."
fi

# Download default voice model if not present
PIPER_VOICES_DIR="$HOME/.local/share/piper-voices"
mkdir -p "$PIPER_VOICES_DIR"
if [ ! -f "$PIPER_VOICES_DIR/en_US-ryan-high.onnx" ]; then
  echo "Downloading default Piper voice model (en_US-ryan-high, ~60MB)..."
  curl -L -o "$PIPER_VOICES_DIR/en_US-ryan-high.onnx" \
    "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ryan/high/en_US-ryan-high.onnx"
  curl -L -o "$PIPER_VOICES_DIR/en_US-ryan-high.onnx.json" \
    "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ryan/high/en_US-ryan-high.onnx.json"
  echo "OK Voice model downloaded"
fi

# Set TTS engine in ~/.env
if ! grep -q "PAI_TTS_ENGINE" ~/.env 2>/dev/null; then
  echo 'PAI_TTS_ENGINE="piper"' >> ~/.env
  echo "OK PAI_TTS_ENGINE set to piper in ~/.env"
fi
```

**If user chose Qwen3-TTS:**

```bash
PAI_DIR="${PAI_DIR:-$HOME/.claude}"
QWEN_DIR="$PAI_DIR/VoiceServer/qwen"

if [ -d "$QWEN_DIR" ]; then
  # Create Python virtual environment
  python3 -m venv "$QWEN_DIR/.venv"
  echo "OK Python venv created"

  # Install dependencies from pyproject.toml
  source "$QWEN_DIR/.venv/bin/activate"
  pip install -e "$QWEN_DIR"
  deactivate
  echo "OK Qwen3 dependencies installed"

  # Note: model files are downloaded on first use (~2-4GB)
  echo "NOTE Qwen3 model will download on first use (~2-4GB). First response may take 60+ seconds."
fi

# Set TTS engine in ~/.env
if ! grep -q "PAI_TTS_ENGINE" ~/.env 2>/dev/null; then
  echo 'PAI_TTS_ENGINE="qwen3"' >> ~/.env
  echo "OK PAI_TTS_ENGINE set to qwen3 in ~/.env"
fi
```

**If user chose System fallback:**

```bash
# Set TTS engine in ~/.env
if ! grep -q "PAI_TTS_ENGINE" ~/.env 2>/dev/null; then
  echo 'PAI_TTS_ENGINE="system"' >> ~/.env
  echo "OK PAI_TTS_ENGINE set to system in ~/.env"
fi
# Linux: uses espeak; macOS: uses say
```

**Mark todo as completed.**

### 4.5 Configure Credentials

**Mark todo "Configure credentials" as in_progress.**

**If user provided an ElevenLabs API key:**

```bash
# Add to ~/.env if not already present
if ! grep -q "ELEVENLABS_API_KEY" ~/.env 2>/dev/null; then
  echo 'ELEVENLABS_API_KEY="USER_PROVIDED_KEY"' >> ~/.env
  echo "Added ELEVENLABS_API_KEY to ~/.env"
fi
```

**If user chose to restore from backup:**

```bash
# Copy credentials from backup
BACKUP_ENV="$BACKUP_PATH/.env"
if [ -f "$BACKUP_ENV" ]; then
  grep "ELEVENLABS" "$BACKUP_ENV" >> ~/.env
  echo "Restored ElevenLabs credentials from backup"
fi
```

**If user chose local/system voice:**
```
"Skipping ElevenLabs configuration. Voice server will use the TTS engine selected above (or platform default).
To enable ElevenLabs later:
1. Get a key from https://elevenlabs.io
2. Add to ~/.env: ELEVENLABS_API_KEY=\"your-key-here\""
```

**Mark todo as completed.**

### 4.6 Start Voice Server

**Mark todo "Start voice server" as in_progress.**

```bash
PAI_DIR="${PAI_DIR:-$HOME/.claude}"

# Kill any existing voice server (cross-platform)
if [[ "$OSTYPE" == "darwin"* ]]; then
  lsof -ti :8888 | xargs kill -9 2>/dev/null || true
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  fuser -k 8888/tcp 2>/dev/null || true
fi

# Start the voice server using start.sh (handles Qwen3 server startup automatically)
cd "$PAI_DIR/VoiceServer" && bash start.sh

# Wait for server to start
sleep 3

# Verify it's running
if curl -s http://localhost:8888/health > /dev/null; then
  echo "Voice server started on port 8888"
else
  echo "WARNING: Voice server may not have started correctly"
  echo "Try manual start: cd $PAI_DIR/VoiceServer && bun run server.ts"
fi
```

**Mark todo as completed.**

### 4.7 Test Voice Notification

**Mark todo "Test voice notification" as in_progress.**

```bash
curl -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Voice system installed successfully."}'
```

Ask the user:
```
"How did that sound? Would you like to adjust anything?"
```

**Mark todo as completed.**

---

## Phase 5: Verification

**Mark todo "Run verification" as in_progress.**

**Execute the full verification suite from VERIFY.md.** The verification script in VERIFY.md handles cross-platform checks including:

- VoiceServer directory and files
- Server process running on port 8888 (uses `ss` on Linux, `lsof` on macOS)
- Health endpoint responding
- TTS engine configuration (ElevenLabs, Piper, Qwen3, or system)
- Audio playback capability
- Platform service installation (systemd on Linux, LaunchAgent on macOS)

```bash
PAI_DIR="${PAI_DIR:-$HOME/.claude}"
PACK_DIR="$(pwd)"

# Run the verification script from VERIFY.md
# (The installing agent should read and execute VERIFY.md checks)
echo "=== Running PAI Voice System v2.6.0 Verification ==="
echo "See VERIFY.md for the full verification procedure."
```

**Mark todo as completed when all checks pass.**

---

## Success/Failure Messages

### On Success

```
"PAI Voice System v2.6.0 installed successfully!

What's available:
- Voice notifications on port 8888
- ElevenLabs natural speech (if configured)
- Local TTS: Piper / Qwen3 (if configured on Linux)
- Platform voice fallback (say on macOS, espeak on Linux)
- Hook integration for automatic notifications

Management commands (Linux):
- Start server:   systemctl --user start pai-voice-server   OR   ~/.claude/VoiceServer/start.sh
- Stop server:    systemctl --user stop pai-voice-server    OR   ~/.claude/VoiceServer/stop.sh
- Check status:   systemctl --user status pai-voice-server  OR   curl http://localhost:8888/health
- View logs:      journalctl --user -u pai-voice-server -f  OR   tail -f ~/.claude/VoiceServer/logs/voice-server.log

Management commands (macOS):
- Start server:   launchctl load ~/Library/LaunchAgents/com.pai.voice-server.plist   OR   ~/.claude/VoiceServer/start.sh
- Stop server:    launchctl unload ~/Library/LaunchAgents/com.pai.voice-server.plist OR   ~/.claude/VoiceServer/stop.sh
- Check status:   curl http://localhost:8888/health
- View logs:      tail -f ~/Library/Logs/pai-voice-server.log

Test it: 'Say hello'"
```

### On Failure

```
"Installation encountered issues. Here's what to check:

1. Ensure pai-core-install is installed first
2. Verify Bun is installed: bun --version
3. Check port 8888 is available:
   - Linux: ss -tlnp | grep 8888
   - macOS: lsof -i :8888
4. Start server manually: cd ~/.claude/VoiceServer && bash start.sh
5. Run the verification commands in VERIFY.md

Need help? Check the Troubleshooting section below."
```

---

## Troubleshooting

### "pai-core-install not found"

This pack requires pai-core-install. Install it first:
```
Give the AI the pai-core-install pack directory and ask it to install.
```

### "bun: command not found"

```bash
curl -fsSL https://bun.sh/install | bash
source ~/.zshrc  # or restart terminal
```

### No audio output

```bash
# Check ElevenLabs key
echo $ELEVENLABS_API_KEY
grep ELEVENLABS ~/.env

# Check TTS engine setting
grep PAI_TTS_ENGINE ~/.env

# Test platform audio
# macOS:
say "test"
# Linux:
espeak "test"       # or
echo "test" | piper --model ~/.local/share/piper-voices/en_US-ryan-high.onnx --output_raw | aplay -r 22050 -f S16_LE -t raw -c 1
```

### Port 8888 conflict

```bash
# Find process (cross-platform)
# Linux:
ss -tlnp | grep 8888
fuser -k 8888/tcp

# macOS:
lsof -i :8888
lsof -ti :8888 | xargs kill -9
```

### Server won't start

```bash
# Check Bun
bun --version

# Start manually and see errors
cd ~/.claude/VoiceServer && bun run server.ts

# Or use start.sh which handles Qwen3 server too
cd ~/.claude/VoiceServer && bash start.sh
```

### Piper not found

```bash
# Arch Linux
yay -S piper-tts-bin
# or from AUR: yay -S piper-tts

# Ubuntu/Debian
# Download from https://github.com/rhasspy/piper/releases
# Extract and place 'piper' binary in your PATH

# Verify installation
piper --version

# Download a voice model if missing
mkdir -p ~/.local/share/piper-voices
curl -L -o ~/.local/share/piper-voices/en_US-ryan-high.onnx \
  "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ryan/high/en_US-ryan-high.onnx"
curl -L -o ~/.local/share/piper-voices/en_US-ryan-high.onnx.json \
  "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ryan/high/en_US-ryan-high.onnx.json"
```

### Qwen3 model download slow or failing

The Qwen3 model (~2-4GB) downloads on first use. This is expected to take time.

```bash
# Check if Python venv is set up
ls ~/.claude/VoiceServer/qwen/.venv/bin/python3

# Re-install dependencies
cd ~/.claude/VoiceServer/qwen
source .venv/bin/activate
pip install -e .
deactivate

# Verify CUDA is available
python3 -c "import torch; print(torch.cuda.is_available())"

# Check GPU memory (Qwen3 needs ~4GB VRAM)
nvidia-smi
```

### Linux audio not working

```bash
# Check available audio players
command -v aplay && echo "aplay available"
command -v paplay && echo "paplay available"
command -v mpv && echo "mpv available"

# Install an audio player if none found
# Arch: pacman -S alsa-utils   (for aplay)
# Arch: pacman -S pulseaudio   (for paplay)
# Arch: pacman -S mpv
# Ubuntu: apt install alsa-utils / pulseaudio-utils / mpv

# Test audio output
aplay /usr/share/sounds/alsa/Front_Center.wav 2>/dev/null || \
paplay /usr/share/sounds/freedesktop/stereo/message.oga 2>/dev/null || \
echo "No test sounds found - try: espeak 'test'"
```

### Voice sounds robotic

ElevenLabs or Piper provides natural voice. Without them, system voice (espeak/say) is used.
```bash
# Option 1: Add ElevenLabs key
echo 'ELEVENLABS_API_KEY="your-key"' >> ~/.env

# Option 2: Switch to Piper (Linux)
echo 'PAI_TTS_ENGINE="piper"' >> ~/.env

# Restart server after changes
cd ~/.claude/VoiceServer && bash stop.sh && bash start.sh
```

---

## What's Included

### VoiceServer Files

| File/Directory | Purpose |
|----------------|---------|
| `server.ts` | Main voice server |
| `package.json` | Dependencies |
| `start.sh` | Start server (handles Qwen3 sidecar) |
| `stop.sh` | Stop server and Qwen3 sidecar |
| `qwen/` | Qwen3-TTS Python service and config |
| `qwen/pyproject.toml` | Qwen3 Python dependencies |
| `linux-service/` | systemd user service unit file |
| `macos-service/` | LaunchAgent plist file |
| `logs/` | Log directory (Linux; macOS uses ~/Library/Logs/) |

---

## Usage

### Send Notification

```bash
curl -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Your message here"}'
```

### Management

**Cross-platform:**

| Action | Command |
|--------|---------|
| Check status | `curl http://localhost:8888/health` |
| Start server | `~/.claude/VoiceServer/start.sh` |
| Stop server | `~/.claude/VoiceServer/stop.sh` |

**Linux (systemd):**

| Action | Command |
|--------|---------|
| Start | `systemctl --user start pai-voice-server` |
| Stop | `systemctl --user stop pai-voice-server` |
| Status | `systemctl --user status pai-voice-server` |
| Logs | `journalctl --user -u pai-voice-server -f` or `tail -f ~/.claude/VoiceServer/logs/voice-server.log` |
| Enable at login | `systemctl --user enable pai-voice-server` |

**macOS (launchctl):**

| Action | Command |
|--------|---------|
| Start | `launchctl load ~/Library/LaunchAgents/com.pai.voice-server.plist` |
| Stop | `launchctl unload ~/Library/LaunchAgents/com.pai.voice-server.plist` |
| Logs | `tail -f ~/Library/Logs/pai-voice-server.log` |

### Integration with Hooks

The voice server integrates with PAI hooks for automatic notifications. Install pai-hook-system for session start/stop notifications.

### Voice Customization

**With ElevenLabs:**
- Custom voice cloning available
- Set voice ID in settings.json: `daidentity.voiceId`

**With Piper (Linux):**
- Download additional voices from https://huggingface.co/rhasspy/piper-voices
- Place `.onnx` and `.onnx.json` files in `~/.local/share/piper-voices/`
- Configure voice in server settings or PAI_PIPER_VOICE env var

**With Qwen3-TTS (Linux):**
- Highest quality local TTS with voice cloning capability
- Requires NVIDIA GPU with CUDA
- Set `PAI_TTS_ENGINE=qwen3` in `~/.env`

**With macOS system voice:**
- Uses system default voice
- Change in System Settings > Accessibility > Spoken Content

**With Linux system voice (espeak):**
- Install: `pacman -S espeak-ng` or `apt install espeak-ng`
- Functional but robotic; consider Piper for better quality
