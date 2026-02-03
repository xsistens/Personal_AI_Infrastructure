# PAI Voice System - Verification Checklist

Run through this checklist to verify your installation is complete and working.

---

## Required Checks

### 1. Server Files Exist

```bash
ls -la ~/.claude/VoiceServer/server.ts
ls -la ~/.claude/VoiceServer/voices.json
ls -la ~/.claude/VoiceServer/*.sh
```

**Platform-specific directories:**

```bash
# Linux
ls -la ~/.claude/VoiceServer/linux-service/

# macOS
ls -la ~/.claude/VoiceServer/macos-service/

# Qwen3 TTS (both platforms, if using Qwen3)
ls -la ~/.claude/VoiceServer/qwen/
```

**Expected:** All core files present with appropriate permissions, plus the directory matching your platform.

- [ ] `server.ts` exists
- [ ] `voices.json` exists
- [ ] Scripts (`start.sh`, `stop.sh`, `restart.sh`) exist and are executable
- [ ] Platform directory exists (`linux-service/` on Linux, `macos-service/` on macOS)
- [ ] (Optional) `qwen/` directory exists if using Qwen3-TTS

---

### 2. Service is Running

**Linux:**

```bash
systemctl --user status pai-voice-server
```

**Expected:** The output should show `Active: active (running)` with a valid PID and uptime. If it shows `inactive (dead)` or `could not be found`, the service is not running.

If you are not using systemd, check the health endpoint instead (see Check 3 below).

**macOS:**

```bash
launchctl list | grep pai.voice
```

**Expected:** Shows service with a PID (not `-`), e.g. `12345   0   com.pai.voice-server`

- [ ] Service shows as active/running
- [ ] Process is actually running (PID is valid)

---

### 3. Server Responds to Health Check

```bash
curl -s http://localhost:8888/health
```

**Expected:**
```json
{
  "status": "healthy",
  "port": 8888,
  "tts_engine_preference": "piper",
  "piper_available": true,
  "qwen3_available": false,
  "elevenlabs_configured": false,
  "platform": "linux"
}
```

The `tts_engine_preference` field reflects the active TTS backend (`"piper"`, `"qwen3"`, or `"elevenlabs"`).
The `platform` field will be `"linux"` or `"darwin"`.

- [ ] Status is "healthy"
- [ ] Port is 8888
- [ ] `tts_engine_preference` matches your intended engine
- [ ] At least one TTS engine shows as available/configured

---

### 4. Voice Output Works

```bash
curl -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Verification test successful"}'
```

**Expected:** You should HEAR the message spoken aloud

- [ ] Audio played successfully
- [ ] Desktop notification appeared (macOS notification center or Linux notify-send)

---

### 5. Port is Bound Correctly

**Linux:**

```bash
# Option A: ss (preferred on Linux)
ss -tlnp 'sport = :8888'

# Option B: lsof (if installed)
lsof -i :8888
```

**macOS:**

```bash
lsof -i :8888
```

**Expected:** Shows bun process listening on port 8888.

Linux `ss` example output:
```
State   Recv-Q  Send-Q  Local Address:Port  Peer Address:Port  Process
LISTEN  0       128     127.0.0.1:8888      0.0.0.0:*          users:(("bun",pid=12345,fd=11))
```

macOS/Linux `lsof` example output:
```
COMMAND   PID USER   FD   TYPE  DEVICE SIZE/OFF NODE NAME
bun     12345 user   11u  IPv4 0x...   0t0  TCP localhost:8888 (LISTEN)
```

- [ ] Port 8888 is bound
- [ ] Process is `bun`

---

## Optional Checks

### 6. ElevenLabs API Key (If Using AI Voices)

```bash
grep ELEVENLABS_API_KEY ~/.env
```

**Expected:** Key is present and not placeholder

- [ ] API key exists in `~/.env`
- [ ] API key is not "your_api_key_here"

---

### 7. Menu Bar Indicator (If Installed)

Look in your macOS menu bar for the microphone icon.

**Expected:**
- Colored microphone icon (server running)
- Gray microphone icon (server stopped)

- [ ] Menu bar icon visible
- [ ] Clicking shows status menu

---

### 8. Logs are Being Written

**Linux:**

```bash
tail -5 ~/.claude/VoiceServer/logs/voice-server.log
```

**macOS:**

```bash
tail -5 ~/Library/Logs/pai-voice-server.log
```

**Expected:** Recent log entries

- [ ] Log file exists
- [ ] Recent timestamps in logs

---

### 9. Piper TTS (If Using Piper)

Only required if `PAI_TTS_ENGINE=piper` or `tts_engine_preference` is `"piper"`.

```bash
# Check piper binary is installed
command -v piper && echo "[PASS] Piper binary found" || echo "[FAIL] Piper not installed"

# Check at least one voice model exists
ls ~/.local/share/piper-voices/*.onnx 2>/dev/null && echo "[PASS] Piper model found" || echo "[FAIL] No piper model"

# Test audio generation
echo "test" | piper --model ~/.local/share/piper-voices/en_US-ryan-high.onnx --output_file /tmp/piper-test.wav
[ -f /tmp/piper-test.wav ] && echo "[PASS] Piper generates audio" || echo "[FAIL] Piper generation failed"
```

- [ ] `piper` binary is on PATH
- [ ] At least one `.onnx` model file exists in `~/.local/share/piper-voices/`
- [ ] Test audio file is generated successfully

---

### 10. Qwen3-TTS Server (If Using Qwen3)

Only required if you are using Qwen3 as a TTS engine.

```bash
# Check Qwen3 server health
curl -s http://localhost:8889/health
```

**Expected:**
```json
{"status": "healthy", "engine": "qwen3-tts", ...}
```

```bash
# Check Qwen3 PID file
cat ~/.claude/VoiceServer/pids/qwen3-server.pid 2>/dev/null && echo "[PASS] Qwen3 PID exists" || echo "[FAIL] No Qwen3 PID"
```

- [ ] Qwen3 server responds on port 8889
- [ ] Status is "healthy"
- [ ] (Optional) PID file exists and process is alive

---

## Quick Verification Script

Run this all-in-one check:

```bash
echo "=== PAI Voice System Verification ==="
echo ""

# Detect platform
PLATFORM="unknown"
case "$(uname -s)" in
  Linux*)  PLATFORM="linux" ;;
  Darwin*) PLATFORM="macos" ;;
esac
echo "Platform: $PLATFORM"
echo ""

# Check 1: Files
echo "1. Checking files..."
[ -f ~/.claude/VoiceServer/server.ts ] && echo "   [PASS] server.ts" || echo "   [FAIL] server.ts missing"
[ -f ~/.claude/VoiceServer/voices.json ] && echo "   [PASS] voices.json" || echo "   [FAIL] voices.json missing"
[ -x ~/.claude/VoiceServer/start.sh ] && echo "   [PASS] start.sh executable" || echo "   [FAIL] start.sh not executable"
if [ "$PLATFORM" = "linux" ]; then
  [ -d ~/.claude/VoiceServer/linux-service ] && echo "   [PASS] linux-service/" || echo "   [FAIL] linux-service/ missing"
elif [ "$PLATFORM" = "macos" ]; then
  [ -d ~/.claude/VoiceServer/macos-service ] && echo "   [PASS] macos-service/" || echo "   [FAIL] macos-service/ missing"
fi

# Check 2: Service
echo ""
echo "2. Checking service..."
if [ "$PLATFORM" = "linux" ]; then
  if systemctl --user is-active pai-voice-server > /dev/null 2>&1; then
    echo "   [PASS] Service active (systemctl)"
  else
    echo "   [FAIL] Service not running (check: systemctl --user status pai-voice-server)"
  fi
elif [ "$PLATFORM" = "macos" ]; then
  if launchctl list 2>/dev/null | grep -q "com.pai.voice-server"; then
    echo "   [PASS] Service loaded"
  else
    echo "   [FAIL] Service not loaded"
  fi
fi

# Check 3: Health
echo ""
echo "3. Checking health endpoint..."
HEALTH=$(curl -s http://localhost:8888/health 2>/dev/null)
if echo "$HEALTH" | grep -q '"status":"healthy"'; then
  echo "   [PASS] Server healthy"
  # Show TTS engine info
  ENGINE=$(echo "$HEALTH" | grep -o '"tts_engine_preference":"[^"]*"' | head -1)
  [ -n "$ENGINE" ] && echo "   INFO  $ENGINE"
else
  echo "   [FAIL] Server not responding"
fi

# Check 4: Port
echo ""
echo "4. Checking port 8888..."
if [ "$PLATFORM" = "linux" ]; then
  if ss -tlnp 'sport = :8888' 2>/dev/null | grep -q ":8888"; then
    echo "   [PASS] Port 8888 in use"
  elif lsof -i :8888 > /dev/null 2>&1; then
    echo "   [PASS] Port 8888 in use"
  else
    echo "   [FAIL] Port 8888 not bound"
  fi
else
  if lsof -i :8888 > /dev/null 2>&1; then
    echo "   [PASS] Port 8888 in use"
  else
    echo "   [FAIL] Port 8888 not bound"
  fi
fi

# Check 5: TTS engines available
echo ""
echo "5. Checking TTS engines..."
command -v piper > /dev/null 2>&1 && echo "   [INFO] Piper: installed" || echo "   [INFO] Piper: not found"
QWEN_HEALTH=$(curl -s http://localhost:8889/health 2>/dev/null)
if echo "$QWEN_HEALTH" | grep -q '"status":"healthy"'; then
  echo "   [INFO] Qwen3: running on port 8889"
else
  echo "   [INFO] Qwen3: not running"
fi
if echo "$HEALTH" | grep -q '"elevenlabs_configured":true'; then
  echo "   [INFO] ElevenLabs: configured"
else
  echo "   [INFO] ElevenLabs: not configured"
fi
if [ "$PLATFORM" = "macos" ]; then
  command -v say > /dev/null 2>&1 && echo "   [INFO] macOS say: available" || echo "   [INFO] macOS say: not found"
elif [ "$PLATFORM" = "linux" ]; then
  command -v espeak > /dev/null 2>&1 && echo "   [INFO] espeak: available" || echo "   [INFO] espeak: not found"
  command -v mpv > /dev/null 2>&1 && echo "   [INFO] mpv (audio player): available" || echo "   [INFO] mpv: not found"
fi

echo ""
echo "=== Verification Complete ==="
```

---

## Troubleshooting Failed Checks

| Check | If Failed | Solution (macOS) | Solution (Linux) |
|-------|-----------|------------------|------------------|
| Files missing | Pack not copied | Re-run `cp -r src/VoiceServer/* ~/.claude/VoiceServer/` | Same |
| Service not loaded | Service not registered | Run `macos-service/install.sh` again | `systemctl --user enable pai-voice-server` or run `./start.sh` directly |
| Server unhealthy | Crashed or not started | Run `./restart.sh` | Same, or check `systemctl --user status pai-voice-server` |
| Port not bound | Another process using 8888 | `lsof -ti :8888 \| xargs kill -9` | `ss -tlnp 'sport = :8888'` to identify, then `kill` the PID |
| No audio | Playback issue | Check system volume, test with `say "hello"` | Install `mpv` or `aplay` or `paplay`; check PulseAudio/PipeWire is running |
| Piper not found | Binary not installed | N/A (Piper is Linux-primary) | Install via package manager or download from GitHub releases |
| Piper no model | Model file missing | N/A | Download a model to `~/.local/share/piper-voices/` |
| Qwen3 not responding | Server not started | Run `qwen/qwen3-server.py` | Same |

---

## Success Criteria

**All required checks must pass:**

- [ ] Server files exist (including platform-specific directory)
- [ ] Service is running
- [ ] Health check returns healthy
- [ ] At least one TTS engine is available (piper, qwen3, elevenlabs, or system fallback)
- [ ] Voice output works (you hear audio)
- [ ] Port 8888 is bound

**Installation is complete when you can run:**

```bash
curl -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "PAI Voice System ready"}'
```

...and **hear the message spoken aloud**.
