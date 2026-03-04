import { publicJsonRequest } from '@/features/auth/http';

export type HelpFaqPublicItem = {
  id: string;
  question: string;
  answer: string;
  category: string;
};

export async function fetchHelpFaq() {
  return publicJsonRequest<{ items: HelpFaqPublicItem[] }>('/help', { method: 'GET' });
}
