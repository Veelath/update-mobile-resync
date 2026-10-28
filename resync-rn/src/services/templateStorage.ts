import AsyncStorage from '@react-native-async-storage/async-storage';
import type {ChapterTemplate} from '../data/templates';

const KEY = 'resync_saved_template';

export async function loadSavedTemplate(): Promise<ChapterTemplate[] | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  const saved: unknown = JSON.parse(raw);
  if (!saved || typeof saved !== 'object' || !('chapters' in saved) || !Array.isArray(saved.chapters) ||
      !saved.chapters.every(ch => ch && typeof ch.title === 'string' && Array.isArray(ch.headings) && ch.headings.every((h: unknown) => typeof h === 'string'))) {
    throw new Error('Saved template is invalid.');
  }
  return saved.chapters;
}

export async function saveTemplate(chapters: ChapterTemplate[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify({chapters, savedAt: new Date().toISOString()}));
}
