export default function FormField({ label, error, ...props }) {
  return (
    <label className="grid gap-2 text-sm font-black text-black/70">
      <span>{label}</span>
      <input
        className="h-12 rounded-app border border-black/10 bg-white px-3 text-base font-medium text-ink outline-none transition focus:border-teal focus:ring-4 focus:ring-teal/15"
        {...props}
      />
      {error ? <span className="text-xs font-bold text-coral">{error}</span> : null}
    </label>
  );
}

