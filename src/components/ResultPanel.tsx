import { BarChart3, Flame, Save, Table2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';

interface ResultPanelProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
}

interface TableBlock {
  headers: string[];
  rows: string[][];
  context: string;
}

function splitTableRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => stripInlineMarkdown(cell.trim()));
}

function isSeparatorRow(line: string) {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function isTableStart(lines: string[], index: number) {
  return lines[index]?.includes('|') && isSeparatorRow(lines[index + 1] ?? '');
}

function stripInlineMarkdown(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .trim();
}

function normalizeHeading(text: string) {
  return stripInlineMarkdown(text.replace(/^#+\s*/, '').trim());
}

function isPlainHorizontalRule(line: string) {
  return /^-{3,}$/.test(line.trim());
}

function renderInlineMarkdown(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*]+\*)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) {
      nodes.push(text.slice(cursor, match.index));
    }

    const token = match[0];
    const content = token.replace(/^(\*\*|__|\*|`)/, '').replace(/(\*\*|__|\*|`)$/, '');

    if (token.startsWith('**') || token.startsWith('__')) {
      nodes.push(<strong key={`${match.index}-strong`} className="font-semibold text-ink">{content}</strong>);
    } else if (token.startsWith('`')) {
      nodes.push(<code key={`${match.index}-code`} className="rounded bg-canvas px-1.5 py-0.5 text-xs text-ink">{content}</code>);
    } else {
      nodes.push(<em key={`${match.index}-em`} className="italic">{content}</em>);
    }

    cursor = match.index + token.length;
  }

  if (cursor < text.length) {
    nodes.push(text.slice(cursor));
  }

  return nodes;
}

function intensity(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes('critical') || normalized.includes('high') || normalized.includes('5')) return 'high';
  if (normalized.includes('medium') || normalized.includes('moderate') || normalized.includes('3') || normalized.includes('4')) return 'medium';
  if (normalized.includes('low') || normalized.includes('1') || normalized.includes('2')) return 'low';
  return 'neutral';
}

function heatClasses(value: string) {
  const level = intensity(value);
  if (level === 'high') return 'border-red-200 bg-red-50 text-red-800';
  if (level === 'medium') return 'border-amber-200 bg-amber-50 text-amber-800';
  if (level === 'low') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  return 'border-line bg-canvas text-muted';
}

function renderTable(block: TableBlock, key: string) {
  const heading = block.context.toLowerCase();
  const headers = block.headers.map((header) => header.toLowerCase());
  const heatIndex = headers.findIndex((header) => ['heat', 'priority', 'risk', 'impact'].some((term) => header.includes(term)));
  const isHeatmap = heading.includes('heatmap') || headers.some((header) => header.includes('heat'));
  const isRoadmap = heading.includes('roadmap') || headers.some((header) => header.includes('horizon'));

  if (isHeatmap) {
    return (
      <div key={key} className="my-4 rounded-lg border border-line bg-white p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
          <Flame className="h-4 w-4 text-accent" />
          Capability Heatmap
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {block.rows.map((row, rowIndex) => {
            const label = row[0] || `Capability ${rowIndex + 1}`;
            const signal = row[1] || '';
            const heat = row[heatIndex >= 0 ? heatIndex : row.length - 1] || '';
            return (
              <div key={`${key}-${rowIndex}`} className={`rounded-lg border p-3 ${heatClasses(heat)}`}>
                <div className="flex items-start justify-between gap-3">
                  <h4 className="font-semibold">{label}</h4>
                  <span className="rounded-full border border-current/20 bg-white/60 px-2 py-0.5 text-xs font-semibold">
                    {heat || 'Signal'}
                  </span>
                </div>
                {signal && <p className="mt-2 text-sm leading-6 opacity-90">{signal}</p>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (isRoadmap) {
    return (
      <div key={key} className="my-4 rounded-lg border border-line bg-white p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
          <BarChart3 className="h-4 w-4 text-accent" />
          Roadmap Timeline
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          {block.rows.map((row, rowIndex) => (
            <div key={`${key}-${rowIndex}`} className="rounded-lg border border-line bg-canvas p-3">
              <div className="text-sm font-semibold text-ink">{row[0]}</div>
              <p className="mt-2 text-sm leading-6 text-muted">{row.slice(1).join(' ')}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div key={key} className="my-4 overflow-hidden rounded-lg border border-line bg-white">
      <div className="flex items-center gap-2 border-b border-line bg-canvas px-3 py-2 text-sm font-semibold text-ink">
        <Table2 className="h-4 w-4 text-accent" />
        Structured Table
      </div>
      <div className="overflow-auto">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead className="bg-white text-xs uppercase tracking-wide text-muted">
            <tr>
              {block.headers.map((header) => (
                <th key={header} className="border-b border-line px-3 py-3 font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, rowIndex) => (
              <tr key={`${key}-${rowIndex}`} className="odd:bg-canvas/60">
                {row.map((cell, cellIndex) => (
                  <td key={`${key}-${rowIndex}-${cellIndex}`} className="border-b border-line px-3 py-3 align-top leading-6 text-ink">
                  {cellIndex === heatIndex ? (
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${heatClasses(cell)}`}>
                        {cell}
                      </span>
                    ) : (
                      renderInlineMarkdown(cell)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function renderReport(value: string) {
  if (!value.trim()) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-canvas p-6 text-sm leading-6 text-muted">
        Run the agent to generate a consulting report with executive synthesis, structured tables, heatmaps, roadmap, and recommendations.
      </div>
    );
  }

  const lines = value.split('\n');
  const output: ReactNode[] = [];
  let currentHeading = '';

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();

    if (isPlainHorizontalRule(trimmed)) {
      continue;
    }

    if (isTableStart(lines, index)) {
      const headers = splitTableRow(lines[index]);
      const rows: string[][] = [];
      index += 2;

      while (index < lines.length && lines[index].includes('|')) {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }

      index -= 1;
      output.push(renderTable({ headers, rows, context: currentHeading }, `table-${index}`));
      continue;
    }

    if (trimmed.startsWith('# ')) {
      currentHeading = normalizeHeading(trimmed);
      output.push(
        <h1 key={index} className="mt-2 border-b border-line pb-3 text-2xl font-semibold text-ink">
          {currentHeading}
        </h1>,
      );
      continue;
    }

    if (trimmed.startsWith('## ')) {
      currentHeading = normalizeHeading(trimmed);
      output.push(
        <h2 key={index} className="mt-7 rounded-lg border-l-4 border-accent bg-white px-4 py-3 text-xl font-semibold text-ink">
          {currentHeading}
        </h2>,
      );
      continue;
    }

    if (trimmed.startsWith('### ')) {
      currentHeading = normalizeHeading(trimmed);
      output.push(
        <h3 key={index} className="mt-5 text-base font-semibold text-ink">
          {currentHeading}
        </h3>,
      );
      continue;
    }

    if (trimmed.startsWith('- ')) {
      output.push(
        <div key={index} className="my-1 flex gap-2 rounded-md bg-white px-3 py-2 text-sm leading-6 text-muted">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
          <span>{renderInlineMarkdown(trimmed.slice(2))}</span>
        </div>,
      );
      continue;
    }

    if (/^\*\*.+\*\*$/.test(trimmed) || /^__.+__$/.test(trimmed)) {
      currentHeading = normalizeHeading(trimmed);
      output.push(
        <h2 key={index} className="mt-7 rounded-lg border-l-4 border-accent bg-white px-4 py-3 text-xl font-semibold text-ink">
          {currentHeading}
        </h2>,
      );
      continue;
    }

    if (!trimmed) {
      output.push(<div key={index} className="h-2" />);
      continue;
    }

    output.push(
      <p key={index} className="my-2 rounded-md bg-white px-3 py-2 text-sm leading-6 text-muted">
        {renderInlineMarkdown(trimmed)}
      </p>,
    );
  }

  return output;
}

export function ResultPanel({ value, onChange, onSave }: ResultPanelProps) {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave();
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  return (
    <section className="rounded-lg border border-line bg-panel p-5 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">Consulting report</p>
          <h2 className="mt-1 text-xl font-semibold text-ink">Agent output</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Formatted as a report with structured tables, visual heatmaps, roadmap cards, and editable markdown.
          </p>
        </div>
        <button type="button" onClick={handleSave} className="btn-primary">
          <Save className="h-4 w-4" />
          {saved ? 'Saved' : 'Save Result'}
        </button>
      </div>

      <div className="mt-5 rounded-lg border border-line bg-canvas p-4">
        <div className="max-h-[42rem] overflow-auto pr-1">{renderReport(value)}</div>
      </div>

      <details className="mt-4 rounded-lg border border-line bg-white p-4">
        <summary className="cursor-pointer text-sm font-semibold text-ink">Edit raw markdown</summary>
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="mt-3 min-h-72 w-full rounded-lg border border-line bg-white p-3 text-sm leading-6 text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
          placeholder="Agent output will appear here after running Ollama Local or Demo Background Runner."
        />
      </details>
    </section>
  );
}
