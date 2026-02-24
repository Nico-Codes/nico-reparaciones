const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001';

export type HelpFaqPublicItem = {
  id: string;
  question: string;
  answer: string;
  category: string;
};

export async function fetchHelpFaq() {
  const res = await fetch(`${API_URL}/api/help`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data?.message as string) || `Error ${res.status}`);
  return data as { items: HelpFaqPublicItem[] };
}

