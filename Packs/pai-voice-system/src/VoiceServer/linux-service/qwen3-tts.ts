/**
 * Qwen3 TTS module — local GPU-based text-to-speech.
 *
 * Communicates with the Qwen3-TTS Python server over HTTP.
 * Supports progressive sentence-by-sentence playback for reduced perceived latency.
 */

const DEBUG = process.env.PAI_VOICE_DEBUG === '1';

// ============================================================================
// Configuration
// ============================================================================

export const QWEN3_PORT = parseInt(process.env.QWEN3_INTERNAL_PORT || "8889");

// Default voice style instruction for Qwen3-TTS (formal, consistent delivery)
export const QWEN3_DEFAULT_INSTRUCT = "Speak at a brisk pace with confident energy. Professional and clear, slightly upbeat but not overly emotional. No laughter or dramatic shifts. Consistent delivery throughout. Read numbers naturally as quantities, not spelled out digit by digit.";

// ============================================================================
// Availability Check
// ============================================================================

let qwen3Available: boolean | null = null;

/**
 * Check if Qwen3-TTS internal server is available.
 * Uses health endpoint — result is cached after first check.
 */
export async function checkQwen3Available(): Promise<boolean> {
  if (qwen3Available !== null) return qwen3Available;

  try {
    const response = await fetch(`http://127.0.0.1:${QWEN3_PORT}/health`, {
      signal: AbortSignal.timeout(2000)
    });
    qwen3Available = response.ok;
  } catch {
    qwen3Available = false;
  }

  return qwen3Available;
}

// ============================================================================
// Speech Generation
// ============================================================================

/**
 * Generate speech using Qwen3-TTS server.
 * Returns WAV audio buffer.
 */
export async function generateSpeechQwen3(
  text: string,
  speaker: string = "Ryan",
  instruct?: string
): Promise<ArrayBuffer> {
  const response = await fetch(`http://127.0.0.1:${QWEN3_PORT}/tts/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      speaker,
      instruct,
      language: "en"
    }),
    signal: AbortSignal.timeout(60000)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Qwen3-TTS error: ${response.status} - ${errorText}`);
  }

  return await response.arrayBuffer();
}

// ============================================================================
// Text Splitting
// ============================================================================

/**
 * Split text into sentences for progressive TTS.
 * Returns array of sentences, preserving punctuation.
 */
export function splitIntoSentences(text: string): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g);

  if (!sentences) {
    return [text];
  }

  return sentences
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

// ============================================================================
// Progressive Playback
// ============================================================================

type PlayAudioFn = (buffer: ArrayBuffer, format: 'wav') => Promise<void>;

/**
 * Progressive TTS playback for Qwen3-TTS.
 *
 * Splits text into sentences and plays progressively:
 * 1. Generate first sentence → start playing immediately
 * 2. While playing, generate next sentence in parallel
 * 3. Queue and play sequentially
 *
 * This reduces perceived latency from ~10-15s to ~3-4s (first sentence delay only).
 */
export async function playQwen3Progressive(
  text: string,
  playAudioFn: PlayAudioFn,
  speaker: string = "Ryan",
  instruct?: string
): Promise<void> {
  const sentences = splitIntoSentences(text);
  const startTime = Date.now();

  // For single sentence or short text, use normal flow
  if (sentences.length <= 1) {
    const audioBuffer = await generateSpeechQwen3(text, speaker, instruct);
    await playAudioFn(audioBuffer, 'wav');
    if (DEBUG) console.log(`Qwen3-TTS: Completed in ${Date.now() - startTime}ms (single)`);
    return;
  }

  // Track audio buffers and playback state
  let currentIndex = 0;
  let isPlaying = false;
  const audioQueue: ArrayBuffer[] = [];
  let generationComplete = false;
  let playbackComplete = false;
  let firstAudioTime = 0;

  const done = new Promise<void>((resolve, reject) => {
    const generateAll = async () => {
      for (let i = 0; i < sentences.length; i++) {
        try {
          const buffer = await generateSpeechQwen3(sentences[i], speaker, instruct);
          audioQueue[i] = buffer;

          if (!isPlaying) {
            playNext();
          }
        } catch (error) {
          console.error(`Qwen3-TTS: Failed to generate sentence ${i + 1}:`, error);
          audioQueue[i] = new ArrayBuffer(0);
        }
      }
      generationComplete = true;
      checkComplete();
    };

    const playNext = async () => {
      if (isPlaying) return;

      if (audioQueue[currentIndex] === undefined) {
        return;
      }

      const buffer = audioQueue[currentIndex];
      if (buffer.byteLength === 0) {
        currentIndex++;
        if (currentIndex < sentences.length) {
          playNext();
        } else {
          playbackComplete = true;
          checkComplete();
        }
        return;
      }

      isPlaying = true;
      if (currentIndex === 0) {
        firstAudioTime = Date.now() - startTime;
      }

      try {
        await playAudioFn(buffer, 'wav');
      } catch (error) {
        console.error(`Qwen3-TTS: Playback error:`, error);
      }

      isPlaying = false;
      currentIndex++;

      if (currentIndex < sentences.length) {
        playNext();
      } else {
        playbackComplete = true;
        checkComplete();
      }
    };

    const checkComplete = () => {
      if (generationComplete && playbackComplete) {
        resolve();
      }
    };

    generateAll().catch(reject);
  });

  await done;
  if (DEBUG) {
    const totalTime = Date.now() - startTime;
    console.log(`Qwen3-TTS: ${sentences.length} sentences, first-audio: ${firstAudioTime}ms, total: ${totalTime}ms`);
  }
}
