import type { ExtractedPreview } from '../types';

const processTerms = [
  'handoff',
  'workflow',
  'approval',
  'intake',
  'triage',
  'forecast',
  'planning',
  'procurement',
  'diagnosis',
  'monitoring',
  'reporting',
  'automation',
  'escalation',
];

export function cleanTranscript(content: string): string {
  return content
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .trim();
}

export function detectSpeakers(content: string): string[] {
  const speakers = new Set<string>();
  const pattern = /^([A-Z][A-Za-z .&/-]{1,40}):/gm;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    speakers.add(match[1].trim());
  }

  return Array.from(speakers);
}

export function extractSmeRole(content: string): string {
  const rolePatterns = [
    /(?:i am|i'm|my role is|as a|as an)\s+([^.\n]{4,80})/i,
    /SME\s*\(([^)]+)\)/i,
    /Role:\s*([^.\n]{4,80})/i,
  ];

  for (const pattern of rolePatterns) {
    const match = content.match(pattern);
    if (match?.[1]) {
      return match[1].replace(/[,;:].*$/, '').trim();
    }
  }

  return 'SME role requires validation';
}

export function segmentTranscript(content: string): string[] {
  const paragraphs = content
    .split(/\n\s*\n/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (paragraphs.length >= 3) {
    return paragraphs.slice(0, 8);
  }

  const sentences = content.match(/[^.!?]+[.!?]+/g) ?? [content];
  const segments: string[] = [];

  for (let index = 0; index < sentences.length; index += 3) {
    const segment = sentences.slice(index, index + 3).join(' ').trim();
    if (segment) segments.push(segment);
  }

  return segments.slice(0, 8);
}

export function extractProcessReferences(content: string): string[] {
  const lower = content.toLowerCase();
  return processTerms.filter((term) => lower.includes(term));
}

export function normalizeTerminology(content: string): string {
  return content
    .replace(/\bgen ai\b/gi, 'generative AI')
    .replace(/\bagentic ai\b/gi, 'agentic AI')
    .replace(/\bcrm\b/gi, 'CRM')
    .replace(/\berp\b/gi, 'ERP')
    .replace(/\behr\b/gi, 'EHR')
    .replace(/\blms\b/gi, 'LMS');
}

export function buildExtractorPreview(content: string, topic: string): ExtractedPreview {
  const cleaned = cleanTranscript(content);
  const normalizedText = normalizeTerminology(cleaned);

  return {
    speakers: detectSpeakers(normalizedText),
    smeRole: extractSmeRole(normalizedText),
    topic,
    segments: segmentTranscript(normalizedText),
    processReferences: extractProcessReferences(normalizedText),
    normalizedText,
  };
}

export function createPreviewText(content: string, length = 180): string {
  const normalized = cleanTranscript(content).replace(/\n/g, ' ');
  return normalized.length > length ? `${normalized.slice(0, length)}...` : normalized;
}
