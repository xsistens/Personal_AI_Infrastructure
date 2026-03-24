/**
 * ElevenLabs TTS module — cloud-based text-to-speech.
 *
 * Handles voice configuration, prosody settings, and ElevenLabs API calls.
 * All functions are pure / take dependencies as parameters — no imports from server.ts.
 */

import { existsSync, readFileSync } from "fs";

// ============================================================================
// Types
// ============================================================================

export interface ProsodySettings {
  stability: number;
  similarity_boost: number;
  style: number;
  speed: number;
  use_speaker_boost: boolean;
  volume?: number;  // Playback volume (0.0-1.0), optional
}

export interface VoiceConfig {
  voice_id: string;
  voice_name: string;
  stability: number;
  similarity_boost: number;
  style?: number;
  speed?: number;
  use_speaker_boost?: boolean;
  prosody?: ProsodySettings;
  description: string;
  type: string;
}

export interface VoicesConfig {
  voices: Record<string, VoiceConfig>;
}

// ============================================================================
// Constants
// ============================================================================

export const DEFAULT_PROSODY: ProsodySettings = {
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0.0,
  speed: 1.0,
  use_speaker_boost: true,
};

// ============================================================================
// Voice Loading
// ============================================================================

/**
 * Load voice personalities from AGENTPERSONALITIES.md.
 * Extracts JSON block from markdown content.
 */
export function loadVoices(agentPersonalitiesPath: string): VoicesConfig | null {
  try {
    if (existsSync(agentPersonalitiesPath)) {
      const markdownContent = readFileSync(agentPersonalitiesPath, 'utf-8');
      const jsonMatch = markdownContent.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch && jsonMatch[1]) {
        return JSON.parse(jsonMatch[1]);
      }
    }
  } catch {
    console.warn('Failed to load agent voice personalities');
  }
  return null;
}

/**
 * Get voice configuration by voice ID or agent name.
 */
export function getVoiceConfig(identifier: string, voices: VoicesConfig | null): VoiceConfig | null {
  if (!voices) return null;

  // Try direct agent name lookup
  if (voices.voices[identifier]) {
    return voices.voices[identifier];
  }

  // Try voice_id lookup
  for (const config of Object.values(voices.voices)) {
    if (config.voice_id === identifier) {
      return config;
    }
  }

  return null;
}

// ============================================================================
// Volume
// ============================================================================

/**
 * Get volume setting from request or DA config (defaults to 1.0 = 100%).
 */
export function getVolumeSetting(requestVolume?: number, daVoiceProsody?: ProsodySettings | null): number {
  if (typeof requestVolume === 'number' && requestVolume >= 0 && requestVolume <= 1) {
    return requestVolume;
  }
  if (daVoiceProsody?.volume !== undefined && daVoiceProsody.volume >= 0 && daVoiceProsody.volume <= 1) {
    return daVoiceProsody.volume;
  }
  return 1.0;
}

// ============================================================================
// Speech Generation
// ============================================================================

/**
 * Generate speech using ElevenLabs API with full prosody support.
 * Returns MP3 audio buffer.
 */
export async function generateSpeech(
  text: string,
  voiceId: string,
  apiKey: string,
  prosody?: Partial<ProsodySettings>
): Promise<ArrayBuffer> {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

  const settings = { ...DEFAULT_PROSODY, ...prosody };

  const voiceSettings = {
    stability: settings.stability,
    similarity_boost: settings.similarity_boost,
    style: settings.style,
    speed: settings.speed,
    use_speaker_boost: settings.use_speaker_boost,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      text: text,
      model_id: 'eleven_turbo_v2_5',
      voice_settings: voiceSettings,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
  }

  return await response.arrayBuffer();
}
