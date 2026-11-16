import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface SlopCategoryHits {
  vocab: string[];
  phrases: string[];
  punctuation: string[];
  rhythm: string[];
  proof: string[];
}

export interface SlopMonsterResult {
  success: boolean;
  score: number; // 0 to 5
  clean: boolean; // true if score === 5
  wordCount: number;
  categories: SlopCategoryHits;
  rawReport: string;
  error?: string;
  executionTimeMs?: number;
}

export class SlopMonsterService {
  /**
   * Resolves the path to tools/deslop.py in both dev (src) and prod (dist) environments
   */
  private static getScriptPath(): string {
    const candidates = [
      path.resolve(__dirname, '../../tools/deslop.py'),
      path.resolve(__dirname, '../tools/deslop.py'),
      path.resolve(process.cwd(), 'tools/deslop.py'),
      path.resolve(process.cwd(), 'backend/tools/deslop.py'),
    ];

    for (const p of candidates) {
      if (fs.existsSync(p)) {
        return p;
      }
    }

    throw new Error(
      `SlopMonster checker not found at any candidate path: ${candidates.join(', ')}`
    );
  }

  /**
   * Runs local SlopMonster checker on the provided subject and/or body
   */
  public static async checkCopy(
    content: string,
    options: { allowProof?: boolean; timeoutMs?: number } = {}
  ): Promise<SlopMonsterResult> {
    const startTime = Date.now();
    const timeoutMs = options.timeoutMs || 8000;
    const textToScore = (content || '').trim();

    if (!textToScore) {
      return {
        success: false,
        score: 0,
        clean: false,
        wordCount: 0,
        categories: { vocab: [], phrases: [], punctuation: [], rhythm: [], proof: [] },
        rawReport: 'Empty input — nothing to score.',
        error: 'Empty copy provided to SlopMonster.',
        executionTimeMs: 0,
      };
    }

    let scriptPath: string;
    try {
      scriptPath = this.getScriptPath();
    } catch (err: any) {
      logger.error('Failed to resolve SlopMonster script path:', err);
      return {
        success: false,
        score: 0,
        clean: false,
        wordCount: 0,
        categories: { vocab: [], phrases: [], punctuation: [], rhythm: [], proof: [] },
        rawReport: 'SlopMonster checker script is unavailable.',
        error: err.message,
        executionTimeMs: 0,
      };
    }

    // Write copy to a temporary UTF-8 file for safe, bounded file-path execution
    const tempFile = path.join(
      os.tmpdir(),
      `slopmonster_${Date.now()}_${Math.random().toString(36).substring(7)}.txt`
    );

    try {
      fs.writeFileSync(tempFile, textToScore, { encoding: 'utf-8' });

      const pythonExec = env.PYTHON_PATH || 'python';
      const args = [scriptPath, tempFile];
      if (options.allowProof) {
        args.push('--allow-proof');
      }

      const { stdout, stderr, exitCode } = await new Promise<{
        stdout: string;
        stderr: string;
        exitCode: number;
      }>((resolve) => {
        execFile(
          pythonExec,
          args,
          { timeout: timeoutMs, maxBuffer: 1024 * 1024 },
          (error, stdoutStr, stderrStr) => {
            const code = error && typeof error.code === 'number' ? error.code : error ? 1 : 0;
            resolve({
              stdout: stdoutStr || '',
              stderr: stderrStr || '',
              exitCode: code,
            });
          }
        );
      });

      const combinedOutput = (stdout + '\n' + stderr).trim();
      const parsed = this.parseReport(combinedOutput, exitCode);
      parsed.executionTimeMs = Date.now() - startTime;

      return parsed;
    } catch (processError: any) {
      logger.error('SlopMonster execution failure:', processError);
      return {
        success: false,
        score: 0,
        clean: false,
        wordCount: textToScore.split(/\s+/).length,
        categories: { vocab: [], phrases: [], punctuation: [], rhythm: [], proof: [] },
        rawReport: processError.message || 'Execution error',
        error: `Python SlopMonster execution failed: ${processError.message}`,
        executionTimeMs: Date.now() - startTime,
      };
    } finally {
      // Always cleanup temporary file
      try {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      } catch {
        // Ignored
      }
    }
  }

  /**
   * Parses deslop.py stdout into structured score and categories
   */
  private static parseReport(output: string, exitCode: number): SlopMonsterResult {
    const categories: SlopCategoryHits = {
      vocab: [],
      phrases: [],
      punctuation: [],
      rhythm: [],
      proof: [],
    };

    // Extract word count: "N words of visible copy"
    const wordCountMatch = output.match(/(\d+)\s+words\s+of\s+visible\s+copy/i);
    const wordCount = wordCountMatch ? parseInt(wordCountMatch[1], 10) : 0;

    // Extract score: "score X/5"
    const scoreMatch = output.match(/score\s+(\d)\/5/i);
    let score = scoreMatch ? parseInt(scoreMatch[1], 10) : exitCode === 0 ? 5 : 0;

    // Category extraction
    let currentCategory: keyof SlopCategoryHits | null = null;
    const lines = output.split('\n');

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (line.includes('AI vocabulary:')) {
        currentCategory = 'vocab';
      } else if (line.includes('AI constructions:')) {
        currentCategory = 'phrases';
      } else if (line.includes('punctuation cadence:')) {
        currentCategory = 'punctuation';
      } else if (line.includes('rule-of-three rhythm:')) {
        currentCategory = 'rhythm';
      } else if (line.includes('possible invented proof:')) {
        currentCategory = 'proof';
      } else if (line.startsWith('·') && currentCategory) {
        categories[currentCategory].push(line.replace(/^·\s*/, ''));
      }
    }

    const clean = score === 5 && exitCode === 0;

    return {
      success: true,
      score,
      clean,
      wordCount,
      categories,
      rawReport: output,
    };
  }
}
