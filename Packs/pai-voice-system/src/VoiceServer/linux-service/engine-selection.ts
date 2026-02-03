/**
 * TTS Engine Selection — decides "which engine" at initialization time.
 *
 * Called once at startup. The result is cached and used by dispatchLocalTTS()
 * in server.ts for all runtime dispatch without re-checking availability.
 */

import { platform } from "os";
import { PAI_TTS_ENGINE, PIPER_DEFAULT_MODEL, checkPiperAvailable } from './piper-tts';
import { QWEN3_PORT, checkQwen3Available } from './qwen3-tts';
import { detectLinuxTTS } from './linux-audio';

const IS_MACOS = platform() === 'darwin';

// ============================================================================
// Types
// ============================================================================

export type LocalTTSEngine = 'piper' | 'qwen3' | 'os-tts';

// ============================================================================
// Engine Descriptions (for logging and health endpoint)
// ============================================================================

const LINUX_TTS = detectLinuxTTS();

export const ENGINE_DESCRIPTIONS: Record<LocalTTSEngine, string> = {
  'piper': `Piper TTS (local CPU, model: ${PIPER_DEFAULT_MODEL}) → WAV`,
  'qwen3': `Qwen3-TTS (local :${QWEN3_PORT}) → WAV`,
  'os-tts': IS_MACOS ? 'macOS Say' : (LINUX_TTS?.command || 'no TTS'),
};

// ============================================================================
// Engine Selection
// ============================================================================

/**
 * Determine which local TTS engine to use based on configuration and availability.
 * Called once at initialization — result is cached in server.ts.
 *
 * When PAI_TTS_ENGINE is explicitly set but the engine isn't available,
 * logs a warning and falls through to auto-detection.
 */
export async function selectLocalTTSEngine(): Promise<LocalTTSEngine> {
  // Explicit engine selection — warn if unavailable
  if (PAI_TTS_ENGINE === 'piper') {
    if (checkPiperAvailable()) return 'piper';
    console.warn(`PAI_TTS_ENGINE=piper but Piper is not available (binary or model missing)`);
  }
  if (PAI_TTS_ENGINE === 'qwen3') {
    if (await checkQwen3Available()) return 'qwen3';
    console.warn(`PAI_TTS_ENGINE=qwen3 but Qwen3 server not responding on port ${QWEN3_PORT}`);
  }

  // Auto-detect: try available engines in preference order
  if (checkPiperAvailable()) return 'piper';
  if (await checkQwen3Available()) return 'qwen3';
  return 'os-tts';
}
