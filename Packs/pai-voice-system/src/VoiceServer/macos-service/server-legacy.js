#!/usr/bin/env bun
// @bun

// server.ts
var {serve } = globalThis.Bun;
import { spawn, execSync } from "child_process";
import { homedir, platform } from "os";
import { join } from "path";
import { existsSync, readFileSync } from "fs";
var IS_MACOS = platform() === "darwin";
var IS_LINUX = platform() === "linux";
function detectLinuxAudioPlayer() {
  if (!IS_LINUX)
    return null;
  try {
    execSync("which mpg123", { stdio: "ignore" });
    return {
      name: "mpg123",
      command: "mpg123",
      args: ["-q"],
      volumeArg: (v) => ["-f", String(Math.round(v * 32768))]
    };
  } catch {}
  try {
    execSync("which mpv", { stdio: "ignore" });
    return {
      name: "mpv",
      command: "mpv",
      args: ["--no-video", "--really-quiet"],
      volumeArg: (v) => ["--volume=" + String(Math.round(v * 100))]
    };
  } catch {}
  try {
    execSync("which paplay", { stdio: "ignore" });
    return {
      name: "paplay",
      command: "paplay",
      args: []
    };
  } catch {}
  try {
    execSync("which aplay", { stdio: "ignore" });
    return {
      name: "aplay",
      command: "aplay",
      args: ["-q"]
    };
  } catch {}
  return null;
}
function detectLinuxTTS() {
  if (!IS_LINUX)
    return null;
  try {
    execSync("which espeak", { stdio: "ignore" });
    return {
      command: "espeak",
      args: (text) => [text]
    };
  } catch {}
  try {
    execSync("which espeak-ng", { stdio: "ignore" });
    return {
      command: "espeak-ng",
      args: (text) => [text]
    };
  } catch {}
  try {
    execSync("which festival", { stdio: "ignore" });
    return {
      command: "festival",
      args: (text) => ["--tts"]
    };
  } catch {}
  return null;
}
var LINUX_AUDIO_PLAYER = detectLinuxAudioPlayer();
var LINUX_TTS = detectLinuxTTS();
if (IS_LINUX) {
  console.log(`Platform: Linux`);
  console.log(`Audio player: ${LINUX_AUDIO_PLAYER?.name || "none found (install mpg123, mpv, or paplay)"}`);
  console.log(`TTS fallback: ${LINUX_TTS?.command || "none found (install espeak or espeak-ng)"}`);
} else if (IS_MACOS) {
  console.log(`Platform: macOS`);
}
var envPath = join(homedir(), ".env");
if (existsSync(envPath)) {
  const envContent = await Bun.file(envPath).text();
  envContent.split(`
`).forEach((line) => {
    const eqIndex = line.indexOf("=");
    if (eqIndex === -1)
      return;
    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();
    if (value.startsWith('"') && value.endsWith('"') || value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    if (key && value && !key.startsWith("#")) {
      process.env[key] = value;
    }
  });
}
var PORT = parseInt(process.env.PORT || "8888");
var ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
if (!ELEVENLABS_API_KEY) {
  console.error("Warning: ELEVENLABS_API_KEY not found in ~/.env");
  console.error("Voice server will use macOS say command as fallback");
  console.error("Add: ELEVENLABS_API_KEY=your_key_here to ~/.env");
}
var daVoiceId = null;
var daVoiceProsody = null;
var daName = "Assistant";
try {
  const settingsPath = join(homedir(), ".claude", "settings.json");
  if (existsSync(settingsPath)) {
    const settingsContent = readFileSync(settingsPath, "utf-8");
    const settings = JSON.parse(settingsContent);
    if (settings.daidentity?.voiceId) {
      daVoiceId = settings.daidentity.voiceId;
      console.log(`Loaded DA voice ID from settings.json`);
    }
    if (settings.daidentity?.name) {
      daName = settings.daidentity.name;
    }
    if (settings.daidentity?.voice) {
      daVoiceProsody = settings.daidentity.voice;
      console.log(`Loaded DA voice prosody from settings.json`);
    }
  }
} catch (error) {
  console.warn("Failed to load DA voice settings from settings.json");
}
if (!daVoiceId) {
  console.warn("No voiceId configured in settings.json daidentity section");
  console.warn('Add: "daidentity": { "voiceId": "your_elevenlabs_voice_id" }');
}
var DEFAULT_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || daVoiceId || "";
var DEFAULT_PROSODY = {
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0,
  speed: 1,
  use_speaker_boost: true
};
var voicesConfig = null;
try {
  const corePersonalitiesPath = join(homedir(), ".claude", "skills", "CORE", "SYSTEM", "AGENTPERSONALITIES.md");
  if (existsSync(corePersonalitiesPath)) {
    const markdownContent = readFileSync(corePersonalitiesPath, "utf-8");
    const jsonMatch = markdownContent.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
      voicesConfig = JSON.parse(jsonMatch[1]);
      console.log("Loaded agent voice personalities from AGENTPERSONALITIES.md");
    }
  }
} catch (error) {
  console.warn("Failed to load agent voice personalities");
}
var pronunciations = {};
try {
  const pronunciationsPath = join(homedir(), ".claude", "skills", "CORE", "USER", "pronunciations.json");
  if (existsSync(pronunciationsPath)) {
    const content = readFileSync(pronunciationsPath, "utf-8");
    pronunciations = JSON.parse(content);
    console.log(`Loaded ${Object.keys(pronunciations).length} pronunciation(s) from USER config`);
  }
} catch (error) {
  console.warn("Failed to load pronunciation customizations");
}
function applyPronunciations(text) {
  let result = text;
  for (const [term, pronunciation] of Object.entries(pronunciations)) {
    const regex = new RegExp(`\\b${term}\\b`, "gi");
    result = result.replace(regex, pronunciation);
  }
  return result;
}
function escapeForAppleScript(input) {
  return input.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
}
function stripMarkers(message) {
  return message.replace(/\[[^\]]*\]/g, "").trim();
}
function getVoiceConfig(identifier) {
  if (!voicesConfig)
    return null;
  if (voicesConfig.voices[identifier]) {
    return voicesConfig.voices[identifier];
  }
  for (const config of Object.values(voicesConfig.voices)) {
    if (config.voice_id === identifier) {
      return config;
    }
  }
  return null;
}
function sanitizeForSpeech(input) {
  const cleaned = input.replace(/<script/gi, "").replace(/\.\.\//g, "").replace(/[;&|><`$\\]/g, "").replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1").replace(/`([^`]+)`/g, "$1").replace(/#{1,6}\s+/g, "").trim().substring(0, 500);
  return cleaned;
}
function validateInput(input) {
  if (!input || typeof input !== "string") {
    return { valid: false, error: "Invalid input type" };
  }
  if (input.length > 500) {
    return { valid: false, error: "Message too long (max 500 characters)" };
  }
  const sanitized = sanitizeForSpeech(input);
  if (!sanitized || sanitized.length === 0) {
    return { valid: false, error: "Message contains no valid content after sanitization" };
  }
  return { valid: true, sanitized };
}
async function generateSpeech(text, voiceId, prosody) {
  if (!ELEVENLABS_API_KEY) {
    throw new Error("ElevenLabs API key not configured");
  }
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
  const settings = { ...DEFAULT_PROSODY, ...prosody };
  const voiceSettings = {
    stability: settings.stability,
    similarity_boost: settings.similarity_boost,
    style: settings.style,
    speed: settings.speed,
    use_speaker_boost: settings.use_speaker_boost
  };
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "audio/mpeg",
      "Content-Type": "application/json",
      "xi-api-key": ELEVENLABS_API_KEY
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_turbo_v2_5",
      voice_settings: voiceSettings
    })
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
  }
  return await response.arrayBuffer();
}
function getVolumeSetting(requestVolume) {
  if (typeof requestVolume === "number" && requestVolume >= 0 && requestVolume <= 1) {
    return requestVolume;
  }
  if (daVoiceProsody?.volume !== undefined && daVoiceProsody.volume >= 0 && daVoiceProsody.volume <= 1) {
    return daVoiceProsody.volume;
  }
  return 1;
}
async function playAudio(audioBuffer, requestVolume) {
  const tempFile = `/tmp/voice-${Date.now()}.mp3`;
  await Bun.write(tempFile, audioBuffer);
  const volume = getVolumeSetting(requestVolume);
  return new Promise((resolve, reject) => {
    let proc;
    if (IS_MACOS) {
      proc = spawn("/usr/bin/afplay", ["-v", volume.toString(), tempFile]);
    } else if (IS_LINUX && LINUX_AUDIO_PLAYER) {
      const args = [...LINUX_AUDIO_PLAYER.args];
      if (LINUX_AUDIO_PLAYER.volumeArg) {
        args.push(...LINUX_AUDIO_PLAYER.volumeArg(volume));
      }
      args.push(tempFile);
      proc = spawn(LINUX_AUDIO_PLAYER.command, args);
    } else {
      spawn("/bin/rm", ["-f", tempFile]);
      reject(new Error("No audio player available for this platform"));
      return;
    }
    proc.on("error", (error) => {
      console.error("Error playing audio:", error);
      spawn("/bin/rm", ["-f", tempFile]);
      reject(error);
    });
    proc.on("exit", (code) => {
      spawn("/bin/rm", ["-f", tempFile]);
      if (code === 0) {
        resolve();
      } else {
        const player = IS_MACOS ? "afplay" : LINUX_AUDIO_PLAYER?.name || "unknown";
        reject(new Error(`${player} exited with code ${code}`));
      }
    });
  });
}
async function speakWithSay(text) {
  return new Promise((resolve, reject) => {
    let proc;
    if (IS_MACOS) {
      proc = spawn("/usr/bin/say", [text]);
    } else if (IS_LINUX && LINUX_TTS) {
      if (LINUX_TTS.command === "festival") {
        proc = spawn(LINUX_TTS.command, ["--tts"]);
        proc.stdin?.write(text);
        proc.stdin?.end();
      } else {
        proc = spawn(LINUX_TTS.command, LINUX_TTS.args(text));
      }
    } else {
      console.warn("No TTS fallback available for this platform");
      resolve();
      return;
    }
    proc.on("error", (error) => {
      console.error("Error with TTS command:", error);
      reject(error);
    });
    proc.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        const tts = IS_MACOS ? "say" : LINUX_TTS?.command || "unknown";
        reject(new Error(`${tts} exited with code ${code}`));
      }
    });
  });
}
function spawnSafe(command, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args);
    proc.on("error", (error) => {
      console.error(`Error spawning ${command}:`, error);
      reject(error);
    });
    proc.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with code ${code}`));
      }
    });
  });
}
async function sendNotification(title, message, voiceEnabled = true, voiceId = null, requestProsody) {
  const titleValidation = validateInput(title);
  const messageValidation = validateInput(message);
  if (!titleValidation.valid) {
    throw new Error(`Invalid title: ${titleValidation.error}`);
  }
  if (!messageValidation.valid) {
    throw new Error(`Invalid message: ${messageValidation.error}`);
  }
  const safeTitle = titleValidation.sanitized;
  let safeMessage = stripMarkers(messageValidation.sanitized);
  if (voiceEnabled) {
    try {
      if (ELEVENLABS_API_KEY) {
        const voice = voiceId || DEFAULT_VOICE_ID;
        const voiceConfig = getVoiceConfig(voice);
        let prosody = {};
        if (voiceConfig) {
          if (voiceConfig.prosody) {
            prosody = voiceConfig.prosody;
          } else {
            prosody = {
              stability: voiceConfig.stability,
              similarity_boost: voiceConfig.similarity_boost,
              style: voiceConfig.style ?? DEFAULT_PROSODY.style,
              speed: voiceConfig.speed ?? DEFAULT_PROSODY.speed,
              use_speaker_boost: voiceConfig.use_speaker_boost ?? DEFAULT_PROSODY.use_speaker_boost
            };
          }
          console.log(`Voice: ${voiceConfig.description}`);
        } else if (voice === DEFAULT_VOICE_ID && daVoiceProsody) {
          prosody = daVoiceProsody;
          console.log(`Voice: DA default`);
        }
        if (requestProsody) {
          prosody = { ...prosody, ...requestProsody };
          console.log(`Using request prosody overrides`);
        }
        const settings = { ...DEFAULT_PROSODY, ...prosody };
        const volume = prosody?.volume ?? daVoiceProsody?.volume;
        console.log(`Generating speech (voice: ${voice}, stability: ${settings.stability}, style: ${settings.style}, speed: ${settings.speed}, volume: ${volume ?? 1})`);
        const spokenMessage = applyPronunciations(safeMessage);
        const audioBuffer = await generateSpeech(spokenMessage, voice, prosody);
        await playAudio(audioBuffer, volume);
      } else {
        console.log("Using macOS say (no API key)");
        await speakWithSay(applyPronunciations(safeMessage));
      }
    } catch (error) {
      console.error("Failed to generate/play speech:", error);
      try {
        await speakWithSay(applyPronunciations(safeMessage));
      } catch (sayError) {
        console.error("Fallback say also failed:", sayError);
      }
    }
  }
  try {
    if (IS_MACOS) {
      const escapedTitle = escapeForAppleScript(safeTitle);
      const escapedMessage = escapeForAppleScript(safeMessage);
      const script = `display notification "${escapedMessage}" with title "${escapedTitle}" sound name ""`;
      await spawnSafe("/usr/bin/osascript", ["-e", script]);
    } else if (IS_LINUX) {
      try {
        await spawnSafe("notify-send", [safeTitle, safeMessage]);
      } catch {
        console.log("notify-send not available, skipping desktop notification");
      }
    }
  } catch (error) {
    console.error("Notification display error:", error);
  }
}
var requestCounts = new Map;
var RATE_LIMIT = 10;
var RATE_WINDOW = 60000;
function checkRateLimit(ip) {
  const now = Date.now();
  const record = requestCounts.get(ip);
  if (!record || now > record.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  if (record.count >= RATE_LIMIT) {
    return false;
  }
  record.count++;
  return true;
}
var server = serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const clientIp = req.headers.get("x-forwarded-for") || "localhost";
    const corsHeaders = {
      "Access-Control-Allow-Origin": "http://localhost",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders, status: 204 });
    }
    if (!checkRateLimit(clientIp)) {
      return new Response(JSON.stringify({ status: "error", message: "Rate limit exceeded" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 429
      });
    }
    if (url.pathname === "/notify" && req.method === "POST") {
      try {
        const data = await req.json();
        const title = data.title || "PAI Notification";
        const message = data.message || "Task completed";
        const voiceEnabled = data.voice_enabled !== false;
        const voiceId = data.voice_id || data.voice_name || null;
        const voiceSettings = data.voice_settings ? { ...data.voice_settings, volume: data.volume ?? data.voice_settings.volume } : data.volume !== undefined ? { volume: data.volume } : undefined;
        if (voiceId && typeof voiceId !== "string") {
          throw new Error("Invalid voice_id");
        }
        console.log(`Notification: "${title}" - "${message}" (voice: ${voiceEnabled}, voiceId: ${voiceId || DEFAULT_VOICE_ID})`);
        await sendNotification(title, message, voiceEnabled, voiceId, voiceSettings);
        return new Response(JSON.stringify({ status: "success", message: "Notification sent" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200
        });
      } catch (error) {
        console.error("Notification error:", error);
        return new Response(JSON.stringify({ status: "error", message: error.message || "Internal server error" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: error.message?.includes("Invalid") ? 400 : 500
        });
      }
    }
    if (url.pathname === "/pai" && req.method === "POST") {
      try {
        const data = await req.json();
        const title = data.title || "PAI Assistant";
        const message = data.message || "Task completed";
        console.log(`PAI notification: "${title}" - "${message}"`);
        await sendNotification(title, message, true, null);
        return new Response(JSON.stringify({ status: "success", message: "PAI notification sent" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200
        });
      } catch (error) {
        console.error("PAI notification error:", error);
        return new Response(JSON.stringify({ status: "error", message: error.message || "Internal server error" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: error.message?.includes("Invalid") ? 400 : 500
        });
      }
    }
    if (url.pathname === "/health") {
      return new Response(JSON.stringify({
        status: "healthy",
        port: PORT,
        voice_system: ELEVENLABS_API_KEY ? "ElevenLabs" : "macOS Say",
        default_voice_id: DEFAULT_VOICE_ID,
        api_key_configured: !!ELEVENLABS_API_KEY
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      });
    }
    return new Response("Voice Server - POST to /notify or /pai", {
      headers: corsHeaders,
      status: 200
    });
  }
});
console.log(`Voice Server running on port ${PORT}`);
var ttsDescription = ELEVENLABS_API_KEY ? "ElevenLabs" : IS_MACOS ? "macOS Say" : LINUX_TTS?.command || "no TTS fallback";
console.log(`Using ${ttsDescription} TTS (default voice: ${DEFAULT_VOICE_ID})`);
console.log(`POST to http://localhost:${PORT}/notify`);
console.log(`Security: CORS restricted to localhost, rate limiting enabled`);
console.log(`API Key: ${ELEVENLABS_API_KEY ? "Configured" : "Not configured (using fallback)"}`);
