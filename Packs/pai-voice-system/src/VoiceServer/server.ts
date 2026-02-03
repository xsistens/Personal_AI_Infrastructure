#!/usr/bin/env bun
/**
 * Voice Server - Personal AI Voice notification server (orchestrator)
 *
 * TTS Engines (selected at initialization, dispatched at runtime):
 * - ElevenLabs (cloud) when API key available → MP3
 * - Piper TTS (local CPU, Linux) when PAI_TTS_ENGINE=piper → WAV
 * - Qwen3-TTS (local GPU) when available → WAV (progressive)
 * - OS TTS (say/espeak) as last resort
 */

import { serve } from "bun";
import { spawn, execSync } from "child_process";
import { homedir, platform } from "os";
import { join } from "path";
import { existsSync, readFileSync } from "fs";

// Linux-specific modules
import { PAI_TTS_ENGINE, PIPER_DEFAULT_MODEL, checkPiperAvailable, generateSpeechPiper } from './linux-service/piper-tts';
import { detectLinuxAudioPlayer, detectLinuxTTS, checkAudioStatus, type LinuxPlayer, type AudioFormat } from './linux-service/linux-audio';
import { QWEN3_PORT, QWEN3_DEFAULT_INSTRUCT, playQwen3Progressive } from './linux-service/qwen3-tts';
import { type LocalTTSEngine, selectLocalTTSEngine, ENGINE_DESCRIPTIONS } from './linux-service/engine-selection';

// ElevenLabs module
import {
  type ProsodySettings, type VoiceConfig, type VoicesConfig,
  DEFAULT_PROSODY, generateSpeech, loadVoices, getVoiceConfig, getVolumeSetting
} from './elevenlabs/elevenlabs-tts';

// ============================================================================
// Configuration
// ============================================================================

const DEBUG = process.env.PAI_VOICE_DEBUG === '1';

const IS_MACOS = platform() === 'darwin';
const IS_LINUX = platform() === 'linux';

// Cache detected Linux audio players and TTS
const LINUX_AUDIO_PLAYER_MP3 = detectLinuxAudioPlayer('mp3');
const LINUX_AUDIO_PLAYER_WAV = detectLinuxAudioPlayer('wav');
const LINUX_TTS = detectLinuxTTS();

if (DEBUG) {
  if (IS_LINUX) {
    console.log(`Platform: Linux`);
    console.log(`Audio player (MP3): ${LINUX_AUDIO_PLAYER_MP3?.name || 'none found'}`);
    console.log(`Audio player (WAV): ${LINUX_AUDIO_PLAYER_WAV?.name || 'none found'}`);
    console.log(`TTS fallback: ${LINUX_TTS?.command || 'none found'}`);
  } else if (IS_MACOS) {
    console.log(`Platform: macOS`);
  }
}

// Load .env from user home directory
const envPath = join(homedir(), '.env');
if (existsSync(envPath)) {
  const envContent = await Bun.file(envPath).text();
  envContent.split('\n').forEach(line => {
    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) return;
    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key && value && !key.startsWith('#')) {
      process.env[key] = value;
    }
  });
}

const PORT = parseInt(process.env.PORT || "8888");
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

if (!ELEVENLABS_API_KEY) {
  console.warn('ELEVENLABS_API_KEY not found in ~/.env — using local TTS engine');
}

// ============================================================================
// DA Identity & Voice Settings
// ============================================================================

let daVoiceId: string | null = null;
let daVoiceProsody: ProsodySettings | null = null;
let daName = "Assistant";
try {
  const settingsPath = join(homedir(), '.claude', 'settings.json');
  if (existsSync(settingsPath)) {
    const settingsContent = readFileSync(settingsPath, 'utf-8');
    const settings = JSON.parse(settingsContent);
    if (settings.daidentity?.voiceId) {
      daVoiceId = settings.daidentity.voiceId;
      if (DEBUG) console.log(`Loaded DA voice ID from settings.json`);
    }
    if (settings.daidentity?.name) {
      daName = settings.daidentity.name;
    }
    if (settings.daidentity?.voice) {
      daVoiceProsody = settings.daidentity.voice as ProsodySettings;
      if (DEBUG) console.log(`Loaded DA voice prosody from settings.json`);
    }
  }
} catch {
  console.warn('Failed to load DA voice settings from settings.json');
}

if (!daVoiceId && DEBUG) {
  console.log('No voiceId configured in settings.json daidentity section');
}

const DEFAULT_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || daVoiceId || "";

// Load voice personalities
const voicesConfig = loadVoices(
  join(homedir(), '.claude', 'skills', 'CORE', 'SYSTEM', 'AGENTPERSONALITIES.md')
);
if (voicesConfig && DEBUG) {
  console.log('Loaded agent voice personalities from AGENTPERSONALITIES.md');
}

// ============================================================================
// Pronunciations & Text Processing
// ============================================================================

let pronunciations: Record<string, string> = {};
try {
  const pronunciationsPath = join(homedir(), '.claude', 'skills', 'CORE', 'USER', 'pronunciations.json');
  if (existsSync(pronunciationsPath)) {
    const content = readFileSync(pronunciationsPath, 'utf-8');
    pronunciations = JSON.parse(content);
    if (DEBUG) console.log(`Loaded ${Object.keys(pronunciations).length} pronunciation(s)`);
  }
} catch {
  console.warn('Failed to load pronunciation customizations');
}

function sanitizeForTTS(text: string): string {
  let result = text;
  result = result.replace(/https?:\/\//gi, '');
  result = result.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  result = result.replace(/\s+/g, ' ').trim();
  return result;
}

function applyPronunciations(text: string): string {
  let result = sanitizeForTTS(text);
  for (const [term, pronunciation] of Object.entries(pronunciations)) {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    result = result.replace(regex, pronunciation);
  }
  return result;
}

function escapeForAppleScript(input: string): string {
  return input.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function stripMarkers(message: string): string {
  return message.replace(/\[[^\]]*\]/g, '').trim();
}

function sanitizeForSpeech(input: string): string {
  const cleaned = input
    .replace(/<script/gi, '')
    .replace(/\.\.\//g, '')
    .replace(/[;&|><`$\\]/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/#{1,6}\s+/g, '')
    .trim()
    .substring(0, 500);
  return cleaned;
}

function validateInput(input: any): { valid: boolean; error?: string; sanitized?: string } {
  if (!input || typeof input !== 'string') {
    return { valid: false, error: 'Invalid input type' };
  }
  if (input.length > 500) {
    return { valid: false, error: 'Message too long (max 500 characters)' };
  }
  const sanitized = sanitizeForSpeech(input);
  if (!sanitized || sanitized.length === 0) {
    return { valid: false, error: 'Message contains no valid content after sanitization' };
  }
  return { valid: true, sanitized };
}

// ============================================================================
// Audio Queue
// ============================================================================

interface QueuedNotification {
  title: string;
  message: string;
  voiceEnabled: boolean;
  voiceId: string | null;
  prosody?: any;
  resolve: () => void;
  reject: (error: Error) => void;
}

class AudioQueue {
  private queue: QueuedNotification[] = [];
  private isProcessing = false;

  get length(): number {
    return this.queue.length;
  }

  get processing(): boolean {
    return this.isProcessing;
  }

  enqueue(notification: Omit<QueuedNotification, 'resolve' | 'reject'>): Promise<void> {
    return new Promise((resolve, reject) => {
      this.queue.push({ ...notification, resolve, reject });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const notification = this.queue.shift()!;

      try {
        const audioStatus = checkAudioStatus();
        if (audioStatus.otherAudioPlaying) {
          if (DEBUG) console.log('Voice skipped: other audio currently playing');
          notification.resolve();
          continue;
        }

        await processNotificationVoice(
          notification.message,
          notification.voiceId,
          notification.prosody
        );
        notification.resolve();
      } catch (error) {
        console.error('Queue processing error:', error);
        notification.reject(error instanceof Error ? error : new Error(String(error)));
      }
    }

    this.isProcessing = false;
  }
}

const audioQueue = new AudioQueue();

// ============================================================================
// Audio Playback (cross-platform)
// ============================================================================

async function playAudio(
  audioBuffer: ArrayBuffer,
  format: AudioFormat = 'mp3',
  requestVolume?: number
): Promise<void> {
  const extension = format === 'wav' ? 'wav' : 'mp3';
  const tempFile = `/tmp/voice-${Date.now()}.${extension}`;

  await Bun.write(tempFile, audioBuffer);

  const volume = getVolumeSetting(requestVolume, daVoiceProsody);
  const linuxPlayer = format === 'wav' ? LINUX_AUDIO_PLAYER_WAV : LINUX_AUDIO_PLAYER_MP3;

  return new Promise((resolve, reject) => {
    let proc;

    if (IS_MACOS) {
      proc = spawn('/usr/bin/afplay', ['-v', volume.toString(), tempFile]);
    } else if (IS_LINUX && linuxPlayer) {
      const args = [...linuxPlayer.args];
      if (linuxPlayer.volumeArg) {
        args.push(...linuxPlayer.volumeArg(volume));
      }
      args.push(tempFile);
      if (DEBUG) console.log(`Playing ${format} with ${linuxPlayer.name}`);
      proc = spawn(linuxPlayer.command, args);
    } else {
      spawn('/bin/rm', ['-f', tempFile]);
      reject(new Error(`No audio player available for ${format} on this platform`));
      return;
    }

    proc.on('error', (error) => {
      console.error('Error playing audio:', error);
      spawn('/bin/rm', ['-f', tempFile]);
      reject(error);
    });

    proc.on('exit', (code) => {
      spawn('/bin/rm', ['-f', tempFile]);
      if (code === 0) {
        resolve();
      } else {
        const player = IS_MACOS ? 'afplay' : linuxPlayer?.name || 'unknown';
        reject(new Error(`${player} exited with code ${code}`));
      }
    });
  });
}

// ============================================================================
// OS TTS Fallback (cross-platform)
// ============================================================================

async function speakWithSay(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    let proc;

    if (IS_MACOS) {
      proc = spawn('/usr/bin/say', [text]);
    } else if (IS_LINUX && LINUX_TTS) {
      if (LINUX_TTS.command === 'festival') {
        proc = spawn(LINUX_TTS.command, ['--tts']);
        proc.stdin?.write(text);
        proc.stdin?.end();
      } else {
        proc = spawn(LINUX_TTS.command, LINUX_TTS.args(text));
      }
    } else {
      console.warn('No TTS fallback available for this platform');
      resolve();
      return;
    }

    proc.on('error', (error) => {
      console.error('Error with TTS command:', error);
      reject(error);
    });

    proc.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        const tts = IS_MACOS ? 'say' : LINUX_TTS?.command || 'unknown';
        reject(new Error(`${tts} exited with code ${code}`));
      }
    });
  });
}

// ============================================================================
// Utility
// ============================================================================

function spawnSafe(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args);

    proc.on('error', (error) => {
      console.error(`Error spawning ${command}:`, error);
      reject(error);
    });

    proc.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with code ${code}`));
      }
    });
  });
}

// ============================================================================
// TTS Engine Dispatch (runtime — uses cached engine selection, no availability checks)
// ============================================================================

let selectedLocalEngine: LocalTTSEngine = 'os-tts';

async function dispatchLocalTTS(spokenMessage: string): Promise<void> {
  switch (selectedLocalEngine) {
    case 'piper': {
      if (DEBUG) console.log(`Generating speech [Piper] (model: ${PIPER_DEFAULT_MODEL})`);
      const audioBuffer = await generateSpeechPiper(spokenMessage);
      await playAudio(audioBuffer, 'wav');
      break;
    }
    case 'qwen3':
      await playQwen3Progressive(spokenMessage, playAudio, "Ryan", QWEN3_DEFAULT_INSTRUCT);
      break;
    case 'os-tts':
      if (DEBUG) console.log('Using OS TTS fallback');
      await speakWithSay(spokenMessage);
      break;
  }
}

// ============================================================================
// Notification Processing
// ============================================================================

async function processNotificationVoice(
  message: string,
  voiceId: string | null = null,
  requestProsody?: Partial<ProsodySettings>
): Promise<void> {
  const safeMessage = stripMarkers(message);

  try {
    if (ELEVENLABS_API_KEY) {
      const voice = voiceId || DEFAULT_VOICE_ID;
      const voiceConfig = getVoiceConfig(voice, voicesConfig);

      let prosody: Partial<ProsodySettings> = {};

      if (voiceConfig) {
        if (voiceConfig.prosody) {
          prosody = voiceConfig.prosody;
        } else {
          prosody = {
            stability: voiceConfig.stability,
            similarity_boost: voiceConfig.similarity_boost,
            style: voiceConfig.style ?? DEFAULT_PROSODY.style,
            speed: voiceConfig.speed ?? DEFAULT_PROSODY.speed,
            use_speaker_boost: voiceConfig.use_speaker_boost ?? DEFAULT_PROSODY.use_speaker_boost,
          };
        }
        if (DEBUG) console.log(`Voice: ${voiceConfig.description}`);
      } else if (voice === DEFAULT_VOICE_ID && daVoiceProsody) {
        prosody = daVoiceProsody;
        if (DEBUG) console.log(`Voice: DA default`);
      }

      if (requestProsody) {
        prosody = { ...prosody, ...requestProsody };
      }

      const settings = { ...DEFAULT_PROSODY, ...prosody };
      const volume = (prosody as any)?.volume ?? daVoiceProsody?.volume;
      if (DEBUG) console.log(`Generating speech [ElevenLabs] (voice: ${voice}, stability: ${settings.stability}, style: ${settings.style}, speed: ${settings.speed}, volume: ${volume ?? 1.0})`);

      const spokenMessage = applyPronunciations(safeMessage);
      const audioBuffer = await generateSpeech(spokenMessage, voice, ELEVENLABS_API_KEY, prosody);
      await playAudio(audioBuffer, 'mp3', volume);
    } else {
      await dispatchLocalTTS(applyPronunciations(safeMessage));
    }
  } catch (error) {
    console.error("Failed to generate/play speech:", error);
    try {
      await dispatchLocalTTS(applyPronunciations(safeMessage));
    } catch (fallbackError) {
      console.error("All TTS engines failed:", fallbackError);
    }
  }
}

async function sendNotification(
  title: string,
  message: string,
  voiceEnabled = true,
  voiceId: string | null = null,
  requestProsody?: Partial<ProsodySettings>
) {
  const titleValidation = validateInput(title);
  const messageValidation = validateInput(message);

  if (!titleValidation.valid) {
    throw new Error(`Invalid title: ${titleValidation.error}`);
  }
  if (!messageValidation.valid) {
    throw new Error(`Invalid message: ${messageValidation.error}`);
  }

  const safeTitle = titleValidation.sanitized!;
  let safeMessage = stripMarkers(messageValidation.sanitized!);

  if (voiceEnabled) {
    audioQueue.enqueue({
      title: safeTitle,
      message: safeMessage,
      voiceEnabled: true,
      voiceId: voiceId,
      prosody: requestProsody,
    }).catch(error => {
      console.error('Voice queue error:', error);
    });
  }

  try {
    if (IS_MACOS) {
      const escapedTitle = escapeForAppleScript(safeTitle);
      const escapedMessage = escapeForAppleScript(safeMessage);
      const script = `display notification "${escapedMessage}" with title "${escapedTitle}" sound name ""`;
      await spawnSafe('/usr/bin/osascript', ['-e', script]);
    } else if (IS_LINUX) {
      try {
        await spawnSafe('notify-send', [safeTitle, safeMessage]);
      } catch {
        if (DEBUG) console.log('notify-send not available, skipping desktop notification');
      }
    }
  } catch (error) {
    console.error("Notification display error:", error);
  }
}

// ============================================================================
// Rate Limiting
// ============================================================================

const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60000;

function checkRateLimit(ip: string): boolean {
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

// ============================================================================
// HTTP Server
// ============================================================================

const server = serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const clientIp = req.headers.get('x-forwarded-for') || 'localhost';

    const corsHeaders = {
      "Access-Control-Allow-Origin": "http://localhost",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders, status: 204 });
    }

    if (!checkRateLimit(clientIp)) {
      return new Response(
        JSON.stringify({ status: "error", message: "Rate limit exceeded" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 }
      );
    }

    if (url.pathname === "/notify" && req.method === "POST") {
      try {
        const data = await req.json();
        const title = data.title || "PAI Notification";
        const message = data.message || "Task completed";
        const voiceEnabled = data.voice_enabled !== false;
        const voiceId = data.voice_id || data.voice_name || null;

        const voiceSettings: Partial<ProsodySettings> | undefined = data.voice_settings
          ? { ...data.voice_settings, volume: data.volume ?? data.voice_settings.volume }
          : data.volume !== undefined
            ? { volume: data.volume }
            : undefined;

        if (voiceId && typeof voiceId !== 'string') {
          throw new Error('Invalid voice_id');
        }

        if (DEBUG) console.log(`Notification: "${title}" - "${message}" (voice: ${voiceEnabled}, voiceId: ${voiceId || DEFAULT_VOICE_ID})`);

        await sendNotification(title, message, voiceEnabled, voiceId, voiceSettings);

        return new Response(
          JSON.stringify({ status: "success", message: "Notification sent" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      } catch (error: any) {
        console.error("Notification error:", error);
        return new Response(
          JSON.stringify({ status: "error", message: error.message || "Internal server error" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: error.message?.includes('Invalid') ? 400 : 500 }
        );
      }
    }

    if (url.pathname === "/pai" && req.method === "POST") {
      try {
        const data = await req.json();
        const title = data.title || "PAI Assistant";
        const message = data.message || "Task completed";

        if (DEBUG) console.log(`PAI notification: "${title}" - "${message}"`);

        await sendNotification(title, message, true, null);

        return new Response(
          JSON.stringify({ status: "success", message: "PAI notification sent" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      } catch (error: any) {
        console.error("PAI notification error:", error);
        return new Response(
          JSON.stringify({ status: "error", message: error.message || "Internal server error" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: error.message?.includes('Invalid') ? 400 : 500 }
        );
      }
    }

    if (url.pathname === "/health") {
      const voiceSystem = ELEVENLABS_API_KEY
        ? "ElevenLabs (cloud)"
        : ENGINE_DESCRIPTIONS[selectedLocalEngine];

      return new Response(
        JSON.stringify({
          status: "healthy",
          port: PORT,
          voice_system: voiceSystem,
          selected_local_engine: selectedLocalEngine,
          tts_engine_preference: PAI_TTS_ENGINE,
          elevenlabs_configured: !!ELEVENLABS_API_KEY,
          default_voice_id: DEFAULT_VOICE_ID,
          platform: IS_MACOS ? 'darwin' : IS_LINUX ? 'linux' : 'other',
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    return new Response("Voice Server - POST to /notify or /pai", {
      headers: corsHeaders,
      status: 200
    });
  },
});

// ============================================================================
// Initialization
// ============================================================================

selectedLocalEngine = await selectLocalTTSEngine();

console.log(`Voice Server running on port ${PORT}`);
console.log(`TTS Engine: ${ELEVENLABS_API_KEY ? 'ElevenLabs (cloud) → MP3' : ENGINE_DESCRIPTIONS[selectedLocalEngine]}`);
console.log(`Local TTS engine: ${selectedLocalEngine} (${ENGINE_DESCRIPTIONS[selectedLocalEngine]})`);

if (!ELEVENLABS_API_KEY && selectedLocalEngine === 'os-tts') {
  console.log(`Note: Install Piper or start qwen3-server.py on :${QWEN3_PORT} for better local TTS`);
}
