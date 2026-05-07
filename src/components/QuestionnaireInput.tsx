interface QuestionnaireInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function QuestionnaireInput({ value, onChange }: QuestionnaireInputProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">Structured questionnaire</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-44 w-full rounded-lg border border-line bg-white p-3 text-sm leading-6 text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
      />
    </label>
  );
}
