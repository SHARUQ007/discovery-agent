import { CheckCircle2, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { ArchitectureFlow } from './components/ArchitectureFlow';
import { ResultPanel } from './components/ResultPanel';
import { RunnerSelector } from './components/RunnerSelector';
import { TranscriptForm } from './components/TranscriptForm';
import { TranscriptList } from './components/TranscriptList';
import type { DiscoveryStorage, Runner, Transcript } from './types';
import { clearStorage, loadStorage, saveStorage } from './utils/localStorage';
import { runDemoDiscoveryAgent } from './utils/demoRunner';
import { runOllamaPrompt } from './utils/ollamaClient';
import { buildDiscoveryPrompt } from './utils/promptBuilder';
import { getSampleTranscripts } from './utils/sampleData';

const runnerInstructions: Record<Runner, string> = {
  'Ollama Local': 'Ollama result generated locally and saved below.',
  'Demo Background Runner': 'Demo result generated locally and saved below. No external AI service was contacted.',
};

function WorkflowSection({
  number,
  title,
  description,
  children,
}: {
  number: number;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-4 lg:grid-cols-[15rem_1fr] lg:gap-8">
      <div className="lg:pt-5">
        <div className="flex items-center gap-3 lg:block">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-navy text-sm font-semibold text-white">
            {number}
          </span>
          <div className="lg:mt-4">
            <h2 className="text-lg font-semibold text-ink">{title}</h2>
            <p className="mt-1 max-w-sm text-sm leading-6 text-muted">{description}</p>
          </div>
        </div>
      </div>
      <div>{children}</div>
    </section>
  );
}

export default function App() {
  const [storage, setStorage] = useState<DiscoveryStorage>(() => loadStorage());
  const [selectedTranscriptId, setSelectedTranscriptId] = useState<string | null>(null);
  const [viewTranscriptId, setViewTranscriptId] = useState<string | null>(null);
  const [status, setStatus] = useState('Local storage ready');
  const [modal, setModal] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [runStartedAt, setRunStartedAt] = useState<number | null>(null);
  const [runTick, setRunTick] = useState(0);

  useEffect(() => {
    try {
      saveStorage(storage);
    } catch {
      setStatus('Could not save to localStorage. The stored transcripts may be too large.');
    }
  }, [storage]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = window.setInterval(() => {
      setRunTick((value) => value + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isRunning]);

  const updateStorage = (patch: Partial<DiscoveryStorage>) => {
    setStorage((current) => ({ ...current, ...patch }));
  };

  const addTranscript = (transcript: Transcript) => {
    setStorage((current) => ({ ...current, transcripts: [transcript, ...current.transcripts] }));
    setSelectedTranscriptId(transcript.id);
    setStatus('Transcript saved');
  };

  const addTranscripts = (transcripts: Transcript[]) => {
    setStorage((current) => ({ ...current, transcripts: [...transcripts, ...current.transcripts] }));
    setSelectedTranscriptId(transcripts[0]?.id ?? null);
    setStatus(`${transcripts.length} transcripts saved`);
  };

  const deleteTranscript = (id: string) => {
    setStorage((current) => ({ ...current, transcripts: current.transcripts.filter((item) => item.id !== id) }));
    if (selectedTranscriptId === id) setSelectedTranscriptId(null);
    if (viewTranscriptId === id) setViewTranscriptId(null);
    setStatus('Transcript deleted');
  };

  const handleRun = async () => {
    if (storage.transcripts.length === 0) {
      setStatus('Save at least one transcript before running discovery');
      return;
    }

    const prompt = storage.lastGeneratedPrompt || buildDiscoveryPrompt(storage.transcripts, storage.questionnaire);

    if (storage.selectedRunner === 'Demo Background Runner') {
      setIsRunning(true);
      setRunStartedAt(Date.now());
      setRunTick(0);
      setStatus('Running demo discovery in background...');

      window.setTimeout(() => {
        const result = runDemoDiscoveryAgent(storage.transcripts, storage.questionnaire);
        updateStorage({
          lastGeneratedPrompt: prompt,
          lastResult: result,
        });
        setIsRunning(false);
        setRunStartedAt(null);
        setStatus('Demo discovery result generated');
        setModal(runnerInstructions['Demo Background Runner']);
      }, 900);
      return;
    }

    if (storage.selectedRunner === 'Ollama Local') {
      if (!storage.ollamaModel.trim()) {
        setStatus('Enter an Ollama model name before running');
        return;
      }

      setIsRunning(true);
      setRunStartedAt(Date.now());
      setRunTick(0);
      setStatus(`Running ${storage.ollamaModel} with Ollama...`);

      try {
        const result = await runOllamaPrompt(storage.ollamaModel.trim(), prompt);
        updateStorage({
          lastGeneratedPrompt: prompt,
          lastResult: result,
        });
        setStatus('Ollama result generated');
        setModal(runnerInstructions['Ollama Local']);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Ollama run failed');
      } finally {
        setIsRunning(false);
        setRunStartedAt(null);
      }
      return;
    }

  };

  const handleClearAll = () => {
    setStorage(clearStorage());
    setSelectedTranscriptId(null);
    setStatus('All local data cleared');
  };

  const handleLoadSamples = () => {
    setStorage((current) => ({ ...current, transcripts: [...getSampleTranscripts(), ...current.transcripts] }));
    setStatus('Sample SME transcripts loaded');
  };

  const handleSaveResult = () => {
    try {
      saveStorage(storage);
      setStatus('AI result saved to localStorage');
    } catch {
      setStatus('Could not save result. The localStorage payload may be too large.');
    }
  };

  const viewedTranscript = storage.transcripts.find((transcript) => transcript.id === viewTranscriptId) ?? null;
  const elapsedSeconds = runStartedAt ? Math.max(0, Math.floor((Date.now() - runStartedAt) / 1000) + runTick * 0) : 0;
  const estimatedTotalSeconds = storage.selectedRunner === 'Ollama Local' ? 180 : 12;
  const progressPercent = isRunning
    ? Math.min(95, Math.max(8, Math.round((elapsedSeconds / estimatedTotalSeconds) * 92)))
    : 0;
  const remainingSeconds = isRunning
    ? Math.max(5, Math.ceil(((95 - progressPercent) / 92) * estimatedTotalSeconds))
    : 0;
  const phase =
    progressPercent < 20
      ? 'Preparing transcripts and questionnaire context'
      : progressPercent < 40
        ? 'Layer 1: cleaning transcripts and extracting interview structure'
        : progressPercent < 58
          ? 'Layer 2: generating role, process, pain point, root cause, impact, opportunity, and capability tags'
          : progressPercent < 78
            ? 'Layer 3: comparing interviews and clustering repeated patterns'
            : 'Layer 4: drafting executive synthesis, heatmaps, value pools, roadmap, and recommendations';

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <header className="border-b border-line bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-wide text-accent">Local Ollama + browser storage</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink sm:text-4xl">Signal Discovery Agent</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                Upload SME transcripts, run the 4-layer discovery agent in-app, and produce consulting-ready deliverables without external AI redirects.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-muted">
              <CheckCircle2 className="h-4 w-4 text-accent" />
              {status}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
        <WorkflowSection
          number={1}
          title="Review Architecture"
          description="The agent follows four consulting layers from transcript cleanup to executive deliverables."
        >
          <ArchitectureFlow />
        </WorkflowSection>

        <WorkflowSection
          number={2}
          title="Add Source Material"
          description="Upload one or many transcripts, set the topic, and adjust the questionnaire when needed."
        >
          <TranscriptForm
            questionnaire={storage.questionnaire}
            onQuestionnaireChange={(questionnaire) => updateStorage({ questionnaire })}
            onSave={addTranscript}
            onSaveMany={addTranscripts}
            onClearAll={handleClearAll}
            onLoadSamples={handleLoadSamples}
            onStatus={setStatus}
          />
        </WorkflowSection>

        <WorkflowSection
          number={3}
          title="Check Repository"
          description="Confirm the saved interview set that will be sent through the discovery agent."
        >
          <TranscriptList
            transcripts={storage.transcripts}
            selectedId={selectedTranscriptId}
            onView={(id) => {
              setSelectedTranscriptId(id);
              setViewTranscriptId(id);
            }}
            onDelete={deleteTranscript}
          />
        </WorkflowSection>

        <WorkflowSection
          number={4}
          title="Run Agent"
          description="Run the in-app Ollama agent or the fast local demo runner against the saved transcripts."
        >
          <RunnerSelector
            selectedRunner={storage.selectedRunner}
            onRunnerChange={(selectedRunner) => updateStorage({ selectedRunner })}
            ollamaModel={storage.ollamaModel}
            onOllamaModelChange={(ollamaModel) => updateStorage({ ollamaModel })}
            onRun={() => void handleRun()}
            isRunning={isRunning}
            transcriptCount={storage.transcripts.length}
            progress={
              isRunning
                ? {
                    percent: progressPercent,
                    elapsedSeconds,
                    remainingSeconds,
                    phase,
                  }
                : null
            }
          />
        </WorkflowSection>

        <WorkflowSection
          number={5}
          title="Review Deliverable"
          description="Edit, save, and review the generated markdown output in a consulting-friendly format."
        >
          <ResultPanel
            value={storage.lastResult}
            onChange={(lastResult) => updateStorage({ lastResult })}
            onSave={handleSaveResult}
          />
        </WorkflowSection>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-ink">Agent run complete</h2>
                <p className="mt-3 text-sm leading-6 text-muted">{modal}</p>
              </div>
              <button type="button" onClick={() => setModal('')} className="icon-btn" title="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {viewedTranscript && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 py-6">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-lg bg-white shadow-soft">
            <div className="border-b border-line p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-accent">Full interview transcript</p>
                  <h2 className="mt-1 text-xl font-semibold text-ink">{viewedTranscript.title}</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="chip">{viewedTranscript.topic}</span>
                    <span className="chip">{new Date(viewedTranscript.createdAt).toLocaleString()}</span>
                    <span className="chip">
                      Speakers: {viewedTranscript.detectedSpeakers.join(', ') || 'Not detected'}
                    </span>
                  </div>
                </div>
                <button type="button" onClick={() => setViewTranscriptId(null)} className="icon-btn" title="Close transcript">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="overflow-auto p-5">
              <pre className="whitespace-pre-wrap rounded-lg border border-line bg-canvas p-4 text-sm leading-6 text-ink">
                {viewedTranscript.cleanedContent || viewedTranscript.content}
              </pre>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
