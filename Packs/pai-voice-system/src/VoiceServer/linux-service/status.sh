#!/bin/bash

# Check status of PAI Voice Server on Linux

PID_DIR="$HOME/.claude/VoiceServer/pids"
LOG_DIR="$HOME/.claude/VoiceServer/logs"
ENV_FILE="$HOME/.env"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}     PAI Voice Server Status (Linux)${NC}"
echo -e "${BLUE}=====================================================${NC}"
echo

# Check systemd service (if installed)
echo -e "${BLUE}Service Status:${NC}"
if systemctl --user is-active pai-voice-server.service > /dev/null 2>&1; then
    echo -e "  ${GREEN}OK systemd service is active${NC}"
    systemctl --user status pai-voice-server.service --no-pager 2>/dev/null | head -5 | while IFS= read -r line; do
        echo "    $line"
    done
elif systemctl --user is-enabled pai-voice-server.service > /dev/null 2>&1; then
    echo -e "  ${YELLOW}! systemd service is enabled but not running${NC}"
else
    echo -e "  ${YELLOW}! systemd service not installed (using PID management)${NC}"
fi

# Check PID files
echo
echo -e "${BLUE}Process Status:${NC}"
if [ -f "$PID_DIR/voice-server.pid" ]; then
    PID=$(cat "$PID_DIR/voice-server.pid")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo -e "  ${GREEN}OK Main server running (PID: $PID)${NC}"
    else
        echo -e "  ${RED}X Main server PID file exists but process not running${NC}"
    fi
else
    echo -e "  ${YELLOW}! No PID file for main server${NC}"
fi

if [ -f "$PID_DIR/qwen3-server.pid" ]; then
    QWEN3_PID=$(cat "$PID_DIR/qwen3-server.pid")
    if ps -p "$QWEN3_PID" > /dev/null 2>&1; then
        echo -e "  ${GREEN}OK Qwen3-TTS server running (PID: $QWEN3_PID)${NC}"
    else
        echo -e "  ${RED}X Qwen3-TTS PID file exists but process not running${NC}"
    fi
else
    echo -e "  ${YELLOW}! No PID file for Qwen3-TTS server${NC}"
fi

# Check if server is responding
echo
echo -e "${BLUE}Server Health:${NC}"
if curl -s -f -X GET http://localhost:8888/health > /dev/null 2>&1; then
    echo -e "  ${GREEN}OK Server is responding on port 8888${NC}"
    HEALTH=$(curl -s http://localhost:8888/health)
    echo "  Response: $HEALTH"
else
    echo -e "  ${RED}X Server is not responding${NC}"
fi

# Check Qwen3-TTS health
if curl -s -f http://127.0.0.1:8889/health > /dev/null 2>&1; then
    echo -e "  ${GREEN}OK Qwen3-TTS responding on port 8889${NC}"
fi

# Check port binding
echo
echo -e "${BLUE}Port Status:${NC}"
if command -v ss &> /dev/null; then
    PORT_8888=$(ss -tlnp "sport = :8888" 2>/dev/null | grep -v "^State")
    if [ -n "$PORT_8888" ]; then
        echo -e "  ${GREEN}OK Port 8888 is in use${NC}"
        echo "  $PORT_8888"
    else
        echo -e "  ${YELLOW}! Port 8888 is not in use${NC}"
    fi

    PORT_8889=$(ss -tlnp "sport = :8889" 2>/dev/null | grep -v "^State")
    if [ -n "$PORT_8889" ]; then
        echo -e "  ${GREEN}OK Port 8889 is in use (Qwen3-TTS)${NC}"
    fi
elif command -v lsof &> /dev/null; then
    if lsof -i :8888 > /dev/null 2>&1; then
        PROCESS=$(lsof -i :8888 | grep LISTEN | head -1)
        echo -e "  ${GREEN}OK Port 8888 is in use${NC}"
        echo "$PROCESS" | awk '{print "  Process: " $1 " (PID: " $2 ")"}'
    else
        echo -e "  ${YELLOW}! Port 8888 is not in use${NC}"
    fi
else
    echo -e "  ${YELLOW}! Neither ss nor lsof available for port check${NC}"
fi

# Check ElevenLabs configuration
echo
echo -e "${BLUE}Voice Configuration:${NC}"
if [ -f "$ENV_FILE" ] && grep -q "ELEVENLABS_API_KEY=" "$ENV_FILE"; then
    API_KEY=$(grep "ELEVENLABS_API_KEY=" "$ENV_FILE" | cut -d'=' -f2)
    if [ "$API_KEY" != "your_api_key_here" ] && [ -n "$API_KEY" ]; then
        echo -e "  ${GREEN}OK ElevenLabs API configured${NC}"
    else
        echo -e "  ${YELLOW}! Using local TTS (no API key)${NC}"
    fi
else
    echo -e "  ${YELLOW}! Using local TTS (no configuration)${NC}"
fi

# Check logs
echo
echo -e "${BLUE}Recent Logs:${NC}"
if [ -f "$LOG_DIR/voice-server.log" ]; then
    echo "  Log file: $LOG_DIR/voice-server.log"
    echo "  Last 5 lines:"
    tail -5 "$LOG_DIR/voice-server.log" | while IFS= read -r line; do
        echo "    $line"
    done
else
    # Try journalctl as fallback
    if systemctl --user is-enabled pai-voice-server.service > /dev/null 2>&1; then
        echo "  Last 5 journal entries:"
        journalctl --user -u pai-voice-server -n 5 --no-pager 2>/dev/null | while IFS= read -r line; do
            echo "    $line"
        done
    else
        echo -e "  ${YELLOW}! No log file found${NC}"
    fi
fi

# Show commands
echo
echo -e "${BLUE}Available Commands:${NC}"
echo "  - Start:     ../start.sh"
echo "  - Stop:      ../stop.sh"
echo "  - Restart:   ../restart.sh"
echo "  - Logs:      tail -f $LOG_DIR/voice-server.log"
echo "  - Test:      curl -X POST http://localhost:8888/notify -H 'Content-Type: application/json' -d '{\"message\":\"Test\"}'"
