export type Topic =
  | 'Education'
  | 'Supply Chain'
  | 'Artificial Intelligence & Agentic AI'
  | 'Diabetes Treatment'
  | 'Cancer Research';

export type Runner = 'Ollama Local' | 'Remote AI' | 'Demo Background Runner';

export interface Transcript {
  id: string;
  title: string;
  topic: Topic;
  content: string;
  cleanedContent: string;
  detectedSpeakers: string[];
  createdAt: string;
}

export interface DiscoveryStorage {
  transcripts: Transcript[];
  questionnaire: string;
  selectedRunner: Runner;
  ollamaModel: string;
  lastGeneratedPrompt: string;
  lastResult: string;
}

export interface ExtractedPreview {
  speakers: string[];
  smeRole: string;
  topic: string;
  segments: string[];
  processReferences: string[];
  normalizedText: string;
}
