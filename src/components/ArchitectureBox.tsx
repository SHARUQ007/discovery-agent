import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface ArchitectureBoxProps {
  number: number;
  title: string;
  purpose: string;
  sections: {
    label: string;
    items: string[];
  }[];
}

export function ArchitectureBox({ number, title, purpose, sections }: ArchitectureBoxProps) {
  const [open, setOpen] = useState(number === 1);

  return (
    <article className="rounded-lg border border-line bg-panel shadow-soft">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-start justify-between gap-4 p-5 text-left"
        aria-expanded={open}
      >
        <div className="flex gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-navy text-sm font-semibold text-white">
            L{number}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-ink">{title}</h3>
            <p className="mt-1 text-sm leading-6 text-muted">{purpose}</p>
          </div>
        </div>
        {open ? <ChevronUp className="mt-1 h-5 w-5 text-muted" /> : <ChevronDown className="mt-1 h-5 w-5 text-muted" />}
      </button>

      {open && (
        <div className="grid gap-4 border-t border-line px-5 py-5 sm:grid-cols-2">
          {sections.map((section) => (
            <div key={section.label}>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-accent">{section.label}</h4>
              <ul className="mt-2 space-y-1.5 text-sm leading-6 text-ink">
                {section.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
