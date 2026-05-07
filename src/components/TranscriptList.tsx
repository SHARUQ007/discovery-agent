import { Eye, Trash2 } from 'lucide-react';
import type { Transcript } from '../types';
import { createPreviewText } from '../utils/textProcessing';

interface TranscriptListProps {
  transcripts: Transcript[];
  selectedId: string | null;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TranscriptList({ transcripts, selectedId, onView, onDelete }: TranscriptListProps) {
  return (
    <section className="rounded-lg border border-line bg-panel p-5 shadow-soft">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">Repository</p>
          <h2 className="mt-1 text-xl font-semibold text-ink">Saved interviews</h2>
        </div>
        <span className="rounded-full bg-canvas px-3 py-1 text-sm font-medium text-muted">{transcripts.length} saved</span>
      </div>

      <div className="mt-5 grid max-h-[36rem] gap-3 overflow-auto pr-1">
        {transcripts.length === 0 && (
          <div className="rounded-lg border border-dashed border-line bg-canvas p-5 text-sm text-muted">
            No transcripts saved yet. Add one manually, upload a file, or load the sample SME transcripts.
          </div>
        )}

        {transcripts.map((transcript) => (
          <article
            key={transcript.id}
            className={`rounded-lg border p-4 transition ${
              selectedId === transcript.id ? 'border-accent bg-accent/5' : 'border-line bg-white'
            }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="font-semibold text-ink">{transcript.title}</h3>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="chip">{transcript.topic}</span>
                  <span className="chip">{new Date(transcript.createdAt).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => onView(transcript.id)} className="icon-btn" title="View transcript">
                  <Eye className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => onDelete(transcript.id)} className="icon-btn" title="Delete transcript">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted">{createPreviewText(transcript.cleanedContent)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
