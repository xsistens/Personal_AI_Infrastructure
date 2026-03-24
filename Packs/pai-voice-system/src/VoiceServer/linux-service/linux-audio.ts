/**
 * Linux audio detection - audio players, TTS fallbacks, and audio status.
 *
 * Detects available audio playback tools and TTS engines on Linux.
 * Also provides audio status detection via PulseAudio/PipeWire.
 * Returns null/defaults on non-Linux platforms.
 */

import { execSync } from "child_process";
import { platform } from "os";

const IS_LINUX = platform() === 'linux';

// Linux audio player detection - format-aware
export interface LinuxPlayer {
  name: string;
  command: string;
  args: string[];
  volumeArg?: (volume: number) => string[];
}

export type AudioFormat = 'mp3' | 'wav';

/**
 * Detect the best Linux audio player for a given format.
 * - WAV: paplay (PipeWire native) > mpv > aplay
 * - MP3: mpv > mpg123 > paplay
 */
export function detectLinuxAudioPlayer(format: AudioFormat = 'mp3'): LinuxPlayer | null {
  if (!IS_LINUX) return null;

  if (format === 'wav') {
    // WAV: paplay is best (PulseAudio/PipeWire native, perfect for Qwen3 output)
    try {
      execSync('which paplay', { stdio: 'ignore' });
      return {
        name: 'paplay',
        command: 'paplay',
        args: []
        // paplay doesn't have easy volume control
      };
    } catch {}

    // mpv can also play WAV
    try {
      execSync('which mpv', { stdio: 'ignore' });
      return {
        name: 'mpv',
        command: 'mpv',
        args: ['--no-video', '--really-quiet'],
        volumeArg: (v: number) => ['--volume=' + String(Math.round(v * 100))]
      };
    } catch {}

    // aplay - ALSA fallback for WAV
    try {
      execSync('which aplay', { stdio: 'ignore' });
      return {
        name: 'aplay',
        command: 'aplay',
        args: ['-q']
      };
    } catch {}
  } else {
    // MP3: mpv preferred (handles MP3 + routes through PipeWire)
    try {
      execSync('which mpv', { stdio: 'ignore' });
      return {
        name: 'mpv',
        command: 'mpv',
        args: ['--no-video', '--really-quiet'],
        volumeArg: (v: number) => ['--volume=' + String(Math.round(v * 100))]
      };
    } catch {}

    // mpg123 for MP3
    try {
      execSync('which mpg123', { stdio: 'ignore' });
      return {
        name: 'mpg123',
        command: 'mpg123',
        args: ['-q'],
        volumeArg: (v: number) => ['-f', String(Math.round(v * 32768))]
      };
    } catch {}

    // paplay can play MP3 on newer systems
    try {
      execSync('which paplay', { stdio: 'ignore' });
      return {
        name: 'paplay',
        command: 'paplay',
        args: []
      };
    } catch {}
  }

  return null;
}

// Linux TTS fallback detection
export function detectLinuxTTS(): { command: string; args: (text: string) => string[] } | null {
  if (!IS_LINUX) return null;

  // espeak - most common Linux TTS
  try {
    execSync('which espeak', { stdio: 'ignore' });
    return {
      command: 'espeak',
      args: (text: string) => [text]
    };
  } catch {}

  // espeak-ng - newer espeak
  try {
    execSync('which espeak-ng', { stdio: 'ignore' });
    return {
      command: 'espeak-ng',
      args: (text: string) => [text]
    };
  } catch {}

  // festival - alternative TTS
  try {
    execSync('which festival', { stdio: 'ignore' });
    return {
      command: 'festival',
      args: (text: string) => ['--tts']  // reads from stdin
    };
  } catch {}

  return null;
}

// ============================================================================
// Audio Status Detection
// ============================================================================

export interface AudioStatus {
  paiAudioPlaying: boolean;
  otherAudioPlaying: boolean;
}

/**
 * Check what audio is currently playing on the system.
 * Differentiates between PAI voice notifications and other audio.
 *
 * PAI audio is identified by: application.name = "paplay" AND media.name contains /tmp/voice-*.wav
 * This allows us to queue PAI notifications while skipping when other audio (YouTube, music) is playing.
 */
export function checkAudioStatus(): AudioStatus {
  if (!IS_LINUX) {
    return { paiAudioPlaying: false, otherAudioPlaying: false };
  }

  try {
    const result = execSync('pactl list sink-inputs 2>/dev/null', {
      encoding: 'utf-8',
      timeout: 2000,
    });

    if (!result.trim()) {
      return { paiAudioPlaying: false, otherAudioPlaying: false };
    }

    const entries = result.split('Sink Input #').filter(e => e.trim());

    let paiAudioPlaying = false;
    let otherAudioPlaying = false;

    for (const entry of entries) {
      const isPaplay = entry.includes('application.name = "paplay"');
      const isVoiceFile = /media\.name = "[^"]*\/tmp\/voice-[^"]*\.wav"/.test(entry);

      if (isPaplay && isVoiceFile) {
        paiAudioPlaying = true;
      } else if (entry.includes('application.name')) {
        otherAudioPlaying = true;
      }
    }

    return { paiAudioPlaying, otherAudioPlaying };
  } catch {
    return { paiAudioPlaying: false, otherAudioPlaying: false };
  }
}
