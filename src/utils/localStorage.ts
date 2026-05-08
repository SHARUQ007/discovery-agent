import type { DiscoveryStorage, Runner } from '../types';
import { defaultQuestionnaire } from './sampleData';

const STORAGE_KEY = 'structured-discovery-agent';
const supportedOllamaModels = ['qwen2.5:3b', 'llama3.1:8b'];

export const defaultStorage: DiscoveryStorage = {
  transcripts: [],
  questionnaire: defaultQuestionnaire,
  selectedRunner: 'Ollama Local',
  ollamaModel: 'qwen2.5:3b',
  lastGeneratedPrompt: '',
  lastResult: '',
};

export function loadStorage(): DiscoveryStorage {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultStorage;
    const parsed = JSON.parse(raw) as Partial<DiscoveryStorage>;

    const selectedRunner: Runner =
      parsed.selectedRunner === 'Demo Background Runner' ||
      parsed.selectedRunner === 'Ollama Local' ||
      parsed.selectedRunner === 'Remote AI'
        ? parsed.selectedRunner
        : 'Ollama Local';

    return {
      transcripts: parsed.transcripts ?? [],
      questionnaire: parsed.questionnaire ?? defaultQuestionnaire,
      selectedRunner,
      ollamaModel: supportedOllamaModels.includes(parsed.ollamaModel ?? '') ? parsed.ollamaModel ?? 'qwen2.5:3b' : 'qwen2.5:3b',
      lastGeneratedPrompt: parsed.lastGeneratedPrompt ?? '',
      lastResult: parsed.lastResult ?? '',
    };
  } catch {
    return defaultStorage;
  }
}

export function saveStorage(state: DiscoveryStorage): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearStorage(): DiscoveryStorage {
  window.localStorage.removeItem(STORAGE_KEY);
  return defaultStorage;
}
