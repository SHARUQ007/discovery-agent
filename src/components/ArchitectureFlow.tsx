const layers = [
  {
    number: 1,
    title: 'Data Extractor',
    purpose: 'Cleans transcripts, detects speakers, topics, roles, and segments.',
  },
  {
    number: 2,
    title: 'Tagging Engine',
    purpose: 'Extracts MECE role, process, pain point, cause, impact, and capability tags.',
  },
  {
    number: 3,
    title: 'Cross-Interview Pattern Analyzer',
    purpose: 'Compares interviews to find repeated bottlenecks and strategic themes.',
  },
  {
    number: 4,
    title: 'Structured Discovery Agent',
    purpose: 'Creates executive synthesis, opportunity maps, heatmaps, and 30/60/90 plans.',
  },
];

export function ArchitectureFlow() {
  return (
    <section className="rounded-lg border border-line bg-panel p-5 shadow-soft">
      <div className="grid gap-3">
        {layers.map((layer, index) => (
          <div key={layer.title} className="relative rounded-lg border border-line bg-canvas p-4 sm:flex sm:items-center sm:gap-4">
            <div className="flex items-center gap-3 sm:w-64 sm:shrink-0">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-navy text-sm font-semibold text-white">
                {layer.number}
              </span>
              <h2 className="text-base font-semibold text-ink">{layer.title}</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted sm:mt-0">{layer.purpose}</p>
            {index < layers.length - 1 && (
              <div className="absolute -bottom-3 left-8 hidden h-3 w-px bg-line sm:block" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
