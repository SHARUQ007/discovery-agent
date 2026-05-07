interface PromptPreviewProps {
  prompt: string;
}

export function PromptPreview({ prompt }: PromptPreviewProps) {
  return (
    <div className="rounded-lg border border-line bg-white p-4">
      <h3 className="text-sm font-semibold text-ink">Generated prompt</h3>
      <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-md bg-canvas p-3 text-xs leading-5 text-ink">
        {prompt || 'No prompt generated yet.'}
      </pre>
    </div>
  );
}
