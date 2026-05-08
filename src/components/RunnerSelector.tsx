import { Loader2, Play, Server } from 'lucide-react';
import type { Runner } from '../types';

const ollamaModels = [
  {
    value: 'qwen2.5:3b',
    label: 'Qwen 2.5 3B - faster demo',
  },
  {
    value: 'llama3.1:8b',
    label: 'Llama 3.1 8B - higher quality',
  },
];

interface RunnerSelectorProps {
  selectedRunner: Runner;
  onRunnerChange: (runner: Runner) => void;
  ollamaModel: string;
  onOllamaModelChange: (model: string) => void;
  onRun: () => void;
  isRunning: boolean;
  transcriptCount: number;
  progress: {
    percent: number;
    elapsedSeconds: number;
    remainingSeconds: number;
    phase: string;
  } | null;
}

export function RunnerSelector({
  selectedRunner,
  onRunnerChange,
  ollamaModel,
  onOllamaModelChange,
  onRun,
  isRunning,
  transcriptCount,
  progress,
}: RunnerSelectorProps) {
  const isDemoRunner = selectedRunner === 'Demo Background Runner';
  const isOllamaRunner = selectedRunner === 'Ollama Local';
  const isRemoteAiRunner = selectedRunner === 'Remote AI';
  const usesOllamaModel = isOllamaRunner || isRemoteAiRunner;

  return (
    <section className="rounded-lg border border-line bg-panel p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">Agent run</p>
          <h2 className="mt-1 text-xl font-semibold text-ink">Run discovery in app</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Uses saved transcripts and the questionnaire to generate the consulting deliverable.
          </p>
        </div>
        <span className="rounded-full bg-canvas px-3 py-1 text-sm font-medium text-muted">{transcriptCount} interviews</span>
      </div>

      <div className="mt-5 grid gap-4">
        <label className="block">
          <span className="text-sm font-medium text-ink">Runner</span>
          <select
            value={selectedRunner}
            onChange={(event) => onRunnerChange(event.target.value as Runner)}
            className="mt-2 w-full rounded-lg border border-line bg-white p-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
          >
            <option>Ollama Local</option>
            <option>Remote AI</option>
            <option>Demo Background Runner</option>
          </select>
        </label>

        {usesOllamaModel && (
          <label className="block">
            <span className="text-sm font-medium text-ink">Ollama model</span>
            <select
              value={ollamaModels.some((model) => model.value === ollamaModel) ? ollamaModel : 'qwen2.5:3b'}
              onChange={(event) => onOllamaModelChange(event.target.value)}
              className="mt-2 w-full rounded-lg border border-line bg-white p-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
            >
              {ollamaModels.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="rounded-lg border border-line bg-canvas p-3 text-sm leading-6 text-muted">
          <div className="flex items-center gap-2 font-medium text-ink">
            <Server className="h-4 w-4 text-accent" />
            {isRemoteAiRunner
              ? 'Remote AI: frontend -> Google Sheets queue -> Mac worker -> Ollama -> Google Sheets -> frontend'
              : isOllamaRunner
                ? 'Local bridge: localhost:8787 -> Ollama localhost:11434'
                : 'Runs deterministic local demo logic in the browser'}
          </div>
          <p className="mt-1">
            {isRemoteAiRunner
              ? `Requires Google Sheets env vars in Vercel and on your Mac worker. Start the Mac worker with npm run worker. Install the selected model first with: ollama pull ${ollamaModel || 'qwen2.5:3b'}`
              : isOllamaRunner
              ? `Keep Ollama and npm run dev:server running. Install the selected model first with: ollama pull ${ollamaModel || 'qwen2.5:3b'}`
              : 'Use this when you want a fast demo without loading a local model.'}
          </p>
        </div>

        <button
          type="button"
          onClick={onRun}
          disabled={isRunning || transcriptCount === 0}
          className="btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {isRunning ? 'Running agent...' : isDemoRunner ? 'Run Demo Agent' : isRemoteAiRunner ? 'Run Remote AI' : 'Run Ollama Agent'}
        </button>

        {progress && (
          <div className="rounded-lg border border-line bg-white p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Loader2 className="h-4 w-4 animate-spin text-accent" />
                {progress.phase}
              </div>
              <div className="text-xs font-medium text-muted">
                {formatDuration(progress.elapsedSeconds)} elapsed · about {formatDuration(progress.remainingSeconds)} left
              </div>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-accent transition-all duration-700"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted">
              <span>Running 4-layer discovery workflow</span>
              <span>{progress.percent}%</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function formatDuration(totalSeconds: number) {
  if (totalSeconds < 60) return `${totalSeconds}s`;

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
}
