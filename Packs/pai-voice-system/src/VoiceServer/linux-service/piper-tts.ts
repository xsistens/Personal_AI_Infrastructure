/**
 * Piper TTS module - Linux-only, CPU-based neural TTS.
 *
 * Provides fast local text-to-speech using the Piper CLI.
 * Output: WAV (sample rate depends on model, typically 22050 Hz).
 */

import { spawn, execSync } from "child_process";
import { homedir, platform } from "os";
import { join } from "path";
import { existsSync } from "fs";

const IS_LINUX = platform() === 'linux';

// Piper TTS configuration
export const PAI_TTS_ENGINE = process.env.PAI_TTS_ENGINE || "qwen3"; // "piper" | "qwen3"
export const PIPER_MODEL_DIR = process.env.PIPER_MODEL_DIR || join(homedir(), '.local', 'share', 'piper-voices');
export const PIPER_DEFAULT_MODEL = process.env.PIPER_MODEL || "en_US-ryan-high";

// Cached state
let piperAvailable: boolean | null = null;
let piperBinaryPath: string | null = null;

// Check if Piper TTS is available (Linux only, CLI-based)
export function checkPiperAvailable(): boolean {
  if (piperAvailable !== null) return piperAvailable;
  if (!IS_LINUX) {
    piperAvailable = false;
    return false;
  }

  try {
    piperBinaryPath = execSync('which piper', { encoding: 'utf-8', timeout: 3000 }).trim();
    // Verify the model file exists
    const modelPath = join(PIPER_MODEL_DIR, `${PIPER_DEFAULT_MODEL}.onnx`);
    if (!existsSync(modelPath)) {
      console.warn(`Piper binary found but model missing: ${modelPath}`);
      piperAvailable = false;
      return false;
    }
    piperAvailable = true;
  } catch {
    piperAvailable = false;
  }

  return piperAvailable;
}

/**
 * Generate speech using Piper TTS (local, CPU-based, fast).
 *
 * Pipes text to piper CLI stdin, reads WAV output file.
 * No progressive playback needed — Piper generates fast enough for full text.
 */
export async function generateSpeechPiper(text: string): Promise<ArrayBuffer> {
  if (!piperBinaryPath) {
    throw new Error('Piper TTS binary not found');
  }

  const modelPath = join(PIPER_MODEL_DIR, `${PIPER_DEFAULT_MODEL}.onnx`);
  const outputFile = `/tmp/voice-piper-${Date.now()}.wav`;
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const args = [
      '-m', modelPath,
      '-f', outputFile,
      '-q', // quiet mode
    ];

    const proc = spawn(piperBinaryPath!, args);

    let stderr = '';
    proc.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    proc.on('error', (error) => {
      reject(new Error(`Piper spawn error: ${error.message}`));
    });

    proc.on('exit', async (code) => {
      if (code !== 0) {
        reject(new Error(`Piper exited with code ${code}: ${stderr}`));
        return;
      }

      try {
        const file = Bun.file(outputFile);
        const buffer = await file.arrayBuffer();
        spawn('/bin/rm', ['-f', outputFile]);
        const elapsed = Date.now() - startTime;
        console.log(`Piper TTS: Generated ${(buffer.byteLength / 1024).toFixed(1)}KB in ${elapsed}ms`);
        resolve(buffer);
      } catch (err) {
        reject(new Error(`Failed to read Piper output: ${err}`));
      }
    });

    // Write text to stdin and close
    proc.stdin?.write(text);
    proc.stdin?.end();
  });
}
