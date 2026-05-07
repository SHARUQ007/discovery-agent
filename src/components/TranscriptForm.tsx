import { FileUp, Loader2, Save, Trash2 } from 'lucide-react';
import mammoth from 'mammoth';
import { useRef, useState } from 'react';
import type { Topic, Transcript } from '../types';
import { cleanTranscript, detectSpeakers } from '../utils/textProcessing';
import { QuestionnaireInput } from './QuestionnaireInput';

const topics: Topic[] = [
  'Education',
  'Supply Chain',
  'Artificial Intelligence & Agentic AI',
  'Diabetes Treatment',
  'Cancer Research',
];

interface TranscriptFormProps {
  questionnaire: string;
  onQuestionnaireChange: (value: string) => void;
  onSave: (transcript: Transcript) => void;
  onSaveMany: (transcripts: Transcript[]) => void;
  onClearAll: () => void;
  onLoadSamples: () => void;
  onStatus: (message: string) => void;
}

export function TranscriptForm({
  questionnaire,
  onQuestionnaireChange,
  onSave,
  onSaveMany,
  onClearAll,
  onLoadSamples,
  onStatus,
}: TranscriptFormProps) {
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState<Topic | ''>('');
  const [content, setContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ complete: 0, total: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const readTranscriptFile = async (file: File) => {
    const isDocx =
      file.name.toLowerCase().endsWith('.docx') ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    const text = isDocx
      ? (await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })).value
      : await file.text();

    return {
      text,
      isDocx,
      title: file.name.replace(/\.[^.]+$/, ''),
    };
  };

  const createTranscript = (fileTitle: string, fileContent: string): Transcript => {
    const cleanedContent = cleanTranscript(fileContent);

    return {
      id: crypto.randomUUID(),
      title: fileTitle,
      topic: topic as Topic,
      content: fileContent,
      cleanedContent,
      detectedSpeakers: detectSpeakers(cleanedContent),
      createdAt: new Date().toISOString(),
    };
  };

  const handleFiles = async (files: FileList) => {
    const selectedFiles = Array.from(files);
    if (selectedFiles.length === 0) return;

    if (selectedFiles.length > 1 && !topic) {
      onStatus('Select a topic before batch uploading transcripts');
      if (fileInput.current) fileInput.current.value = '';
      return;
    }

    setIsUploading(true);
    setUploadProgress({ complete: 0, total: selectedFiles.length });
    onStatus(`Uploading ${selectedFiles.length} file${selectedFiles.length === 1 ? '' : 's'}...`);

    try {
      if (selectedFiles.length === 1) {
        const file = selectedFiles[0];
        const { text, isDocx, title: fileTitle } = await readTranscriptFile(file);
        setUploadProgress({ complete: 1, total: 1 });
        setContent(text);
        if (!title) setTitle(fileTitle);
        onStatus(isDocx ? 'DOCX transcript converted. Review and click Save Transcript.' : 'Transcript loaded. Review and click Save Transcript.');
        return;
      }

      const parsedFiles = [];
      const failedFiles: string[] = [];

      for (const file of selectedFiles) {
        try {
          const parsed = await readTranscriptFile(file);
          parsedFiles.push(parsed);
        } catch {
          failedFiles.push(file.name);
        } finally {
          setUploadProgress((current) => ({ ...current, complete: current.complete + 1 }));
        }
      }

      const transcripts = parsedFiles
        .filter((file) => file.text.trim())
        .map((file) => createTranscript(file.title, file.text));

      if (transcripts.length === 0) {
        onStatus('No readable transcript text found in the selected files');
        return;
      }

      onSaveMany(transcripts);
      const failedText = failedFiles.length ? ` ${failedFiles.length} file${failedFiles.length === 1 ? '' : 's'} could not be read.` : '';
      onStatus(`${transcripts.length} transcript${transcripts.length === 1 ? '' : 's'} uploaded and saved.${failedText}`);
    } catch {
      onStatus('Could not read that file. Try a .txt, .md, .csv, or .docx transcript.');
    } finally {
      setIsUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !topic || !content.trim()) {
      onStatus('Add a title, topic, and transcript before saving');
      return;
    }

    setIsSaving(true);
    onStatus('Saving transcript...');

    try {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const cleanedContent = cleanTranscript(content);
      onSave({
        id: crypto.randomUUID(),
        title: title.trim(),
        topic,
        content,
        cleanedContent,
        detectedSpeakers: detectSpeakers(cleanedContent),
        createdAt: new Date().toISOString(),
      });
      setTitle('');
      setTopic('');
      setContent('');
      if (fileInput.current) fileInput.current.value = '';
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="rounded-lg border border-line bg-panel p-5 shadow-soft">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">Source material</p>
          <h2 className="mt-1 text-xl font-semibold text-ink">Upload interviews</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onLoadSamples} className="btn-secondary">Load Samples</button>
          <button type="button" onClick={onClearAll} disabled={isUploading || isSaving} className="btn-secondary disabled:cursor-not-allowed disabled:opacity-60">
            <Trash2 className="h-4 w-4" />
            Clear All
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-ink">Transcript title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-2 w-full rounded-lg border border-line bg-white p-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
              placeholder="e.g. Supply Chain Planning Interview"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-ink">Topic/category</span>
            <select
              value={topic}
              onChange={(event) => setTopic(event.target.value as Topic)}
              className="mt-2 w-full rounded-lg border border-line bg-white p-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
            >
              <option value="">Select topic</option>
              {topics.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-ink">Upload transcript file</span>
            <input
              ref={fileInput}
              type="file"
              multiple
              disabled={isUploading || isSaving}
              accept=".txt,.md,.csv,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(event) => {
                const files = event.target.files;
                if (files) void handleFiles(files);
              }}
              className="mt-2 w-full rounded-lg border border-dashed border-line bg-white p-3 text-sm text-muted file:mr-3 file:rounded-md file:border-0 file:bg-navy file:px-3 file:py-2 file:text-sm file:font-medium file:text-white disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>

          {isUploading && (
            <div className="rounded-lg border border-line bg-canvas p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-ink">
                <Loader2 className="h-4 w-4 animate-spin text-accent" />
                Uploading and converting files
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${uploadProgress.total ? (uploadProgress.complete / uploadProgress.total) * 100 : 0}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted">
                {uploadProgress.complete} of {uploadProgress.total} complete
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isUploading || isSaving}
            className="btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSaving ? 'Saving...' : 'Save Transcript'}
          </button>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-ink">Paste transcript manually</span>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              className="mt-2 min-h-52 w-full rounded-lg border border-line bg-white p-3 text-sm leading-6 text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
              placeholder="Interviewer: ...&#10;SME: ..."
            />
          </label>
          <div className="flex items-center gap-2 rounded-lg border border-line bg-canvas px-3 py-2 text-xs text-muted">
            <FileUp className="h-4 w-4" />
            Select one file to review before saving, or select multiple files to batch-save under the selected topic.
          </div>
        </div>
      </div>

      <details className="mt-5 rounded-lg border border-line bg-canvas p-3">
        <summary className="cursor-pointer text-sm font-semibold text-ink">Questionnaire</summary>
        <div className="mt-3">
        <QuestionnaireInput value={questionnaire} onChange={onQuestionnaireChange} />
        </div>
      </details>
    </section>
  );
}
