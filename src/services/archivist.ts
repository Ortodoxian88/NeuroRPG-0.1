import { api } from './api';

export async function processWikiCandidates(
  candidates: any[],
  roomId: string,
  userId: string,
  setStatus: (status: string) => void
) {
  if (!candidates || candidates.length === 0) return;
  
  setStatus('Архивариус анализирует новые знания...');
  try {
    await api.processArchivist(roomId, candidates);
    setStatus('Архивариус обновил бестиарий.');
    setTimeout(() => setStatus(''), 3000);
  } catch (error) {
    console.error('Archivist error:', error);
    setStatus('Ошибка архивариуса.');
    setTimeout(() => setStatus(''), 3000);
  }
}
