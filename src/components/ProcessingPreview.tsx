import type { ReactNode } from 'react';
import type { Transcript } from '../types';
import { buildDiscoveryPrompt } from '../utils/promptBuilder';
import { buildExtractorPreview } from '../utils/textProcessing';

interface ProcessingPreviewProps {
  transcripts: Transcript[];
  selectedTranscript: Transcript | null;
  questionnaire: string;
  prompt: string;
}

function PreviewBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-white p-4">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <div className="mt-3 text-sm leading-6 text-muted">{children}</div>
    </div>
  );
}

export function ProcessingPreview({ transcripts, selectedTranscript, questionnaire, prompt }: ProcessingPreviewProps) {
  const transcript = selectedTranscript ?? transcripts[0] ?? null;
  const extractor = transcript ? buildExtractorPreview(transcript.cleanedContent, transcript.topic) : null;
  const previewPrompt = prompt || (transcripts.length ? buildDiscoveryPrompt(transcripts, questionnaire) : '');

  return (
    <section className="rounded-lg border border-line bg-panel p-5 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-wide text-accent">Processing preview panel</p>
      <h2 className="mt-1 text-xl font-semibold text-ink">Layer outputs before AI execution</h2>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <PreviewBlock title="Data Extractor Output Preview">
          {extractor ? (
            <div className="space-y-3">
              <p><strong className="text-ink">SME role:</strong> {extractor.smeRole}</p>
              <p><strong className="text-ink">Speakers:</strong> {extractor.speakers.join(', ') || 'Not detected'}</p>
              <p><strong className="text-ink">Topic:</strong> {extractor.topic}</p>
              <div className="flex flex-wrap gap-2">
                {extractor.processReferences.map((term) => <span key={term} className="chip">{term}</span>)}
                {extractor.processReferences.length === 0 && <span>No process references detected yet</span>}
              </div>
              <p>{extractor.segments[0] ?? 'No discussion segments available'}</p>
            </div>
          ) : (
            <p>Save or load a transcript to preview extraction.</p>
          )}
        </PreviewBlock>

        <PreviewBlock title="Tagging Engine Input Preview">
          {transcript ? (
            <div className="space-y-3">
              <p><strong className="text-ink">Questionnaire logic:</strong> {questionnaire.split('\n')[0]}</p>
              <div className="flex flex-wrap gap-2">
                {['Role', 'Process', 'Tool/System', 'Pain Point', 'Root Cause', 'Impact', 'Opportunity', 'Capability'].map((tag) => (
                  <span key={tag} className="chip">{tag}</span>
                ))}
              </div>
              <p>{transcript.cleanedContent.slice(0, 300)}...</p>
            </div>
          ) : (
            <p>No tagging input available.</p>
          )}
        </PreviewBlock>

        <PreviewBlock title="Cross-Interview Analyzer Input Preview">
          {transcripts.length ? (
            <div className="space-y-3">
              <p><strong className="text-ink">Interview count:</strong> {transcripts.length}</p>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(transcripts.map((item) => item.topic))).map((topic) => (
                  <span key={topic} className="chip">{topic}</span>
                ))}
              </div>
              <p>Ready to compare pain points, root causes, impacts, opportunities, and capability gaps across saved interviews.</p>
            </div>
          ) : (
            <p>No cross-interview inputs available.</p>
          )}
        </PreviewBlock>

        <PreviewBlock title="Structured Discovery Agent Prompt Preview">
          {previewPrompt ? (
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-md bg-canvas p-3 text-xs leading-5 text-ink">
              {previewPrompt.slice(0, 1800)}{previewPrompt.length > 1800 ? '\n...' : ''}
            </pre>
          ) : (
            <p>Generate a prompt after saving at least one transcript.</p>
          )}
        </PreviewBlock>
      </div>
    </section>
  );
}
