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

// Exact SlopMonster Catalog (matching tools/deslop.py)
const VOCAB = [
  'delve', 'leverage', 'seamless', 'elevate', 'robust', 'unlock', 'unleash',
  'empower', 'streamline', 'cutting-edge', 'state-of-the-art', 'game-changer',
  'game-changing', 'revolutionize', 'revolutionise', 'transformative',
  'transformation', 'innovate', 'holistic', 'synergy', 'synergies', 'paradigm', 'bespoke',
  'meticulous', 'tapestry', 'testament', 'beacon', 'unparalleled', 'supercharge',
  'turbocharge', 'effortless', 'next-level',
  'pivotal', 'foster', 'showcase', 'compelling', 'intuitive', 'world-class',
  'best-in-class',
];

const VOCAB_EXACT = [
  'crafted', 'curated', 'harnessing', 'harness the power', 'journey', 'realm', 'landscape',
  'navigate the', 'in the world of', "in today's", 'ever-evolving', 'fast-paced',
  'look no further', 'dive in', "let's dive", 'deep dive', 'embark',
  'unlock the power', 'buckle up', 'the secret sauce', 'level up',
];

const _NEG_JUST = "(?:\\bnot|n['’]t)\\s+(?:just|only|merely|simply)\\b";
const _XY_TAIL = "[^!?]{0,80}?[,.]\\s*(?:it|this|that|they|we|you|he|she|i)\\b";

const PHRASES: [RegExp, string][] = [
  [new RegExp(`${_NEG_JUST}[^.!?]{0,80}\\bbut\\b`, 'i'), "the 'not just X, but Y' construction"],
  [new RegExp(`${_NEG_JUST}${_XY_TAIL}`, 'i'), "the 'not just X, it's Y' construction"],
  [new RegExp("\\bwhether you(?:'?re| are)\\b[^.!?]{0,40}\\bor\\b", 'i'), "the 'whether you're X or Y' opener"],
  [new RegExp("\\bmore than just\\b", 'i'), "'more than just'"],
  [new RegExp("\\b(that|this)(?:'?s| is) where\\b[^.!?]{0,30}\\bcomes? in\\b", 'i'), "'that's where X comes in'"],
  [new RegExp("\\bsay goodbye to\\b", 'i'), "'say goodbye to'"],
  [new RegExp("\\bimagine (a|an|the)\\b", 'i'), "the 'imagine a…' opener"],
  [new RegExp("\\bin conclusion\\b|\\bto sum up\\b", 'i'), "essay-summary phrasing"],
  [new RegExp("\\bwhen it comes to\\b", 'i'), "'when it comes to' filler"],
  [new RegExp("\\bat the end of the day\\b", 'i'), "'at the end of the day'"],
  [new RegExp("\\bthe key is\\b|\\bthe truth is\\b", 'i'), "throat-clearing opener"],
  [new RegExp("\\bhelps? you to\\b|\\bcan help you\\b", 'i'), "hedged benefit ('helps you to…')"],
  [new RegExp("\\bmay potentially\\b|\\bcould potentially\\b|\\bmight possibly\\b", 'i'), "stacked hedging"],
  [new RegExp("\\bvery unique\\b|\\bquite literally\\b", 'i'), "intensifier padding"],
  [new RegExp("\\bhere'?s the thing\\b|\\blet'?s break (it|this) down\\b|\\bthe best part\\b", 'i'), "throat-clearing opener"],
  [new RegExp("\\bready to get started\\b|\\blet'?s get started\\b", 'i'), "boilerplate CTA"],
  [new RegExp("\\bthe (result|answer|catch|kicker|upshot)\\?\\s", 'i'), "self-answering question"],
];

const COMPOUND = /\b[a-z]{2,}-[a-z]{2,}(?:-[a-z]{2,})*\b/gi;
const PROOF = /([\d][\d,]*(?:\.\d+)?)\s*\+?\s*((?:happy|early|active|satisfied|verified|trusted|delighted)\s+)?(?:\w+\s+){0,1}(users?|customers?|learners?|students?|teams?|members?|companies|businesses|homeowners?|subscribers?|clients?|patients?|readers?|sites?|projects?)(?!\w)/gi;

function rootPattern(word: string): RegExp {
  const root = word.replace(/(ed|ing|ly|e)$/i, '');
  if (root.length < 4) {
    return new RegExp(`(?<!\\w)${word}(?!\\w)`, 'i');
  }
  return new RegExp(`(?<!\\w)${root}(?:e|es|ed|ing|ion|ions|ional|ive|al|ally|s|ly|ness)?(?!\\w)`, 'i');
}

export class SlopMonsterService {
  /**
   * Resolves the path to tools/deslop.py
   */
  private static getScriptPath(): string | null {
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
    return null;
  }

  /**
   * Runs SlopMonster audit natively using the identical regex catalog from tools/deslop.py.
   * Ensures 100% operational reliability in serverless environments (such as Vercel) where
   * Python CLI may not be pre-installed in the Node.js runtime container.
   */
  public static auditNative(text: string, allowProof = false): SlopMonsterResult {
    const cleanText = text.replace(/‑/g, '-').replace(/\xa0/g, ' ').replace(/’/g, "'");
    const words = cleanText.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    if (wordCount === 0) {
      return {
        success: false,
        score: 0,
        clean: false,
        wordCount: 0,
        categories: { vocab: [], phrases: [], punctuation: [], rhythm: [], proof: [] },
        rawReport: 'Empty input — nothing to score.',
        error: 'Empty copy provided to SlopMonster.',
      };
    }

    const hits: SlopCategoryHits = {
      vocab: [],
      phrases: [],
      punctuation: [],
      rhythm: [],
      proof: [],
    };

    // 1. Root-matched vocabulary
    for (const w of VOCAB) {
      const pat = rootPattern(w);
      const matches = cleanText.match(new RegExp(pat.source, 'gi'));
      if (matches && matches.length > 0) {
        hits.vocab.push(`${w} (${matches.length})`);
      }
    }

    // 2. Exact vocabulary
    for (const w of VOCAB_EXACT) {
      const pat = new RegExp(`(?<!\\w)${w}(?!\\w)`, 'gi');
      const matches = cleanText.match(pat);
      if (matches && matches.length > 0) {
        hits.vocab.push(`${w} (${matches.length})`);
      }
    }

    // 3. Phrases / Constructions
    for (const [regex, label] of PHRASES) {
      const matches = cleanText.match(new RegExp(regex.source, 'gi'));
      if (matches && matches.length > 0) {
        hits.phrases.push(`${label} (${matches.length})`);
      }
    }

    // 4. Punctuation: em-dashes and compound stacks
    const sentences = cleanText.split(/(?<=[.!?])\s+/);
    for (const s of sentences) {
      for (let i = 0; i < Math.max(1, s.length); i += 220) {
        const window = s.slice(i, i + 220);
        const emDashCount = (window.match(/—/g) || []).length;
        if (emDashCount >= 2) {
          hits.punctuation.push('two or more em-dashes in one sentence');
          break;
        }
        const compoundMatches = window.match(COMPOUND) || [];
        if (compoundMatches.length >= 4) {
          hits.punctuation.push(`${compoundMatches.length} hyphenated compounds stacked in one sentence`);
          break;
        }
      }
    }

    if (cleanText.split(';').length - 1 > Math.max(3, Math.floor(cleanText.length / 1200))) {
      hits.punctuation.push('semicolon-heavy for web copy');
    }

    // 5. Rhythm: Rule-of-three
    const r3Pat1 = /\b(\w{4,}),\s+(\w{4,}),\s+and\s+(\w{4,})\b/gi;
    const r3Pat2 = /\b(\w{4,}),\s+(\w{4,})\s+and\s+((?:\w+\s+){1,2}\w+)\s*[.!?,;:]/gi;
    const r3Matches1 = cleanText.match(r3Pat1) || [];
    const r3Matches2 = cleanText.match(r3Pat2) || [];
    const allR3 = [...r3Matches1, ...r3Matches2];
    for (const m of allR3) {
      hits.rhythm.push(`rule-of-three list (${m.slice(0, 50)})`);
    }

    // 6. Invented Proof
    const proofMatches = cleanText.match(PROOF) || [];
    for (const p of proofMatches) {
      hits.proof.push(p.trim());
    }

    // Scoring
    const weights: Record<string, number> = {
      vocab: 1,
      phrases: 1,
      punctuation: 1,
      rhythm: 1,
      proof: allowProof ? 0 : 1,
    };

    let penalty = 0;
    if (hits.vocab.length > 0) penalty += weights.vocab;
    if (hits.phrases.length > 0) penalty += weights.phrases;
    if (hits.punctuation.length > 0) penalty += weights.punctuation;
    if (hits.rhythm.length > 0) penalty += weights.rhythm;
    if (hits.proof.length > 0) penalty += weights.proof;

    const score = Math.max(0, 5 - penalty);
    const clean = score === 5;

    // Build raw report
    const reportLines: string[] = [`${wordCount} words of visible copy\n`];
    if (hits.proof.length) reportLines.push(`  possible invented proof:\n${hits.proof.map((h) => `    · ${h}`).join('\n')}`);
    if (hits.phrases.length) reportLines.push(`  AI constructions:\n${hits.phrases.map((h) => `    · ${h}`).join('\n')}`);
    if (hits.vocab.length) reportLines.push(`  AI vocabulary:\n${hits.vocab.map((h) => `    · ${h}`).join('\n')}`);
    if (hits.punctuation.length) reportLines.push(`  punctuation cadence:\n${hits.punctuation.map((h) => `    · ${h}`).join('\n')}`);
    if (hits.rhythm.length) reportLines.push(`  rule-of-three rhythm:\n${hits.rhythm.map((h) => `    · ${h}`).join('\n')}`);

    reportLines.push(`\n  score ${score}/5  ${clean ? 'CLEAN' : 'needs a cleanse'}`);

    return {
      success: true,
      score,
      clean,
      wordCount,
      categories: hits,
      rawReport: reportLines.join('\n'),
    };
  }

  /**
   * Primary entry point: Runs local Python checker if available; otherwise falls back
   * seamlessly to the native regex engine with 100% catalog parity.
   */
  public static async checkCopy(
    content: string,
    options: { allowProof?: boolean; timeoutMs?: number } = {}
  ): Promise<SlopMonsterResult> {
    const startTime = Date.now();
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

    const scriptPath = this.getScriptPath();

    // If script or Python is missing, use the native audit engine directly
    if (!scriptPath) {
      const nativeRes = this.auditNative(textToScore, options.allowProof);
      nativeRes.executionTimeMs = Date.now() - startTime;
      return nativeRes;
    }

    // Try executing Python script safely
    try {
      const tempFile = path.join(
        os.tmpdir(),
        `slopmonster_${Date.now()}_${Math.random().toString(36).substring(7)}.txt`
      );

      fs.writeFileSync(tempFile, textToScore, { encoding: 'utf-8' });

      const pythonExec = env.PYTHON_PATH || 'python';
      const args = [scriptPath, tempFile];
      if (options.allowProof) {
        args.push('--allow-proof');
      }

      const { stdout, stderr, exitCode, execError } = await new Promise<{
        stdout: string;
        stderr: string;
        exitCode: number;
        execError?: any;
      }>((resolve) => {
        execFile(
          pythonExec,
          args,
          { timeout: options.timeoutMs || 8000, maxBuffer: 1024 * 1024 },
          (error, stdoutStr, stderrStr) => {
            const code = error && typeof error.code === 'number' ? error.code : error ? 1 : 0;
            resolve({
              stdout: stdoutStr || '',
              stderr: stderrStr || '',
              exitCode: code,
              execError: error,
            });
          }
        );
      });

      // Cleanup temp file safely
      try {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
      } catch {}

      // If python executable was not found (e.g. Vercel serverless environment), fallback to native engine
      if (execError && (execError.code === 'ENOENT' || execError.message?.includes('not found') || execError.message?.includes('spawn'))) {
        logger.info('Python binary not detected in environment. Running native SlopMonster engine.');
        const nativeRes = this.auditNative(textToScore, options.allowProof);
        nativeRes.executionTimeMs = Date.now() - startTime;
        return nativeRes;
      }

      const combinedOutput = (stdout + '\n' + stderr).trim();
      const parsed = this.parseReport(combinedOutput, exitCode);
      parsed.executionTimeMs = Date.now() - startTime;

      return parsed;
    } catch (processError: any) {
      // Fallback gracefully to native audit
      logger.warn('SlopMonster Python subprocess issue, using native engine:', processError);
      const nativeRes = this.auditNative(textToScore, options.allowProof);
      nativeRes.executionTimeMs = Date.now() - startTime;
      return nativeRes;
    }
  }

  /**
   * Parses stdout and stderr from tools/deslop.py execution
   */
  private static parseReport(output: string, exitCode: number): SlopMonsterResult {
    let score = 0;
    const scoreMatch = output.match(/score\s+(\d+)\/5/i);
    if (scoreMatch && scoreMatch[1]) {
      score = parseInt(scoreMatch[1], 10);
    } else {
      score = exitCode === 0 ? 5 : 0;
    }

    const clean = score === 5 && exitCode === 0;

    let wordCount = 0;
    const wordCountMatch = output.match(/(\d+)\s+words\s+of\s+visible\s+copy/i);
    if (wordCountMatch && wordCountMatch[1]) {
      wordCount = parseInt(wordCountMatch[1], 10);
    }

    const categories: SlopCategoryHits = {
      vocab: [],
      phrases: [],
      punctuation: [],
      rhythm: [],
      proof: [],
    };

    let currentCategory: keyof SlopCategoryHits | null = null;
    const lines = output.split('\n');

    for (const rawLine of lines) {
      const line = rawLine.trim();

      if (line.includes('possible invented proof:')) {
        currentCategory = 'proof';
        continue;
      } else if (line.includes('AI constructions:')) {
        currentCategory = 'phrases';
        continue;
      } else if (line.includes('AI vocabulary:')) {
        currentCategory = 'vocab';
        continue;
      } else if (line.includes('punctuation cadence:')) {
        currentCategory = 'punctuation';
        continue;
      } else if (line.includes('rule-of-three rhythm:')) {
        currentCategory = 'rhythm';
        continue;
      } else if (line.startsWith('score') || line.startsWith('──')) {
        currentCategory = null;
        continue;
      }

      if (currentCategory && line.startsWith('·')) {
        const item = line.replace(/^[·\s]+/, '').trim();
        if (item) {
          categories[currentCategory].push(item);
        }
      }
    }

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
