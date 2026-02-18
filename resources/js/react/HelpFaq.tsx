import { useMemo, useState } from 'react';

type HelpEntry = {
  question: string;
  answer: string;
};

type HelpFaqProps = {
  entries: HelpEntry[];
  emptyDataText: string;
  emptySearchText: string;
  searchPlaceholder: string;
};

function normalize(value: string): string {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export default function HelpFaq({
  entries,
  emptyDataText,
  emptySearchText,
  searchPlaceholder,
}: HelpFaqProps) {
  const [query, setQuery] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return entries;
    return entries.filter((entry) =>
      normalize(`${entry.question} ${entry.answer}`).includes(q)
    );
  }, [entries, query]);

  if (entries.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-sm text-zinc-600">{emptyDataText}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-body">
          <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
            <input
              className="h-11"
              placeholder={searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="text-xs text-zinc-500">{filtered.length} resultados</div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="card">
            <div className="card-body text-sm text-zinc-600">{emptySearchText}</div>
          </div>
        ) : (
          filtered.map((entry, index) => {
            const isOpen = openIndex === index;

            return (
              <article className="card" key={`${entry.question}-${index}`}>
                <button
                  type="button"
                  className="card-body flex w-full items-center justify-between gap-3 text-left"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                >
                  <h2 className="text-base font-black text-zinc-900">{entry.question}</h2>
                  <svg
                    className={`h-5 w-5 shrink-0 text-zinc-500 transition-transform duration-300 ease-out ${isOpen ? 'rotate-180' : ''}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m6 9 6 6 6-6"></path>
                  </svg>
                </button>
                <div
                  className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
                    isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-4 pt-1 pb-12 sm:px-5 sm:pb-12">
                    <p className="mb-3 whitespace-pre-line text-sm leading-relaxed text-zinc-700">
                      {entry.answer}
                    </p>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
